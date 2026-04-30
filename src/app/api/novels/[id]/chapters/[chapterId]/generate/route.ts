import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildSSEStream, smartTruncate } from '@/lib/nvidia';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> },
) {
  try {
    const { id, chapterId } = await params;
    const body = await request.json();
    const { model, temperature, maxTokens, topP } = body;

    const novel = await db.novel.findUnique({
      where: { id },
      include: {
        characters: true,
        chapters: { orderBy: { chapterNumber: 'asc' } },
        worldSettings: true,
      },
    });

    if (!novel) {
      return NextResponse.json({ error: '小说不存在' }, { status: 404 });
    }

    const currentChapter = novel.chapters.find(c => c.id === chapterId);
    if (!currentChapter) {
      return NextResponse.json({ error: '章节不存在' }, { status: 404 });
    }

    // Save current version before regeneration
    if (currentChapter.content) {
      try {
        await db.chapterVersion.create({
          data: {
            chapterId: currentChapter.id,
            novelId: id,
            chapterNumber: currentChapter.chapterNumber,
            title: currentChapter.title,
            content: currentChapter.content,
            wordCount: currentChapter.wordCount,
            versionLabel: '重写前自动保存',
          },
        });
        // Clean up old versions (keep last 20)
        const allVersions = await db.chapterVersion.findMany({
          where: { chapterId: currentChapter.id },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        });
        if (allVersions.length > 20) {
          await db.chapterVersion.deleteMany({
            where: { id: { in: allVersions.slice(20).map(v => v.id) } },
          });
        }
      } catch (verErr) {
        console.warn('Failed to save chapter version:', verErr);
      }
    }

    // Get previous chapter content for context
    const prevChapter = novel.chapters
      .filter(c => c.chapterNumber < currentChapter.chapterNumber)
      .pop();

    // Get next chapter outline for forward context
    const nextChapter = novel.chapters
      .filter(c => c.chapterNumber > currentChapter.chapterNumber)
      .shift();

    // Build rich character info
    const charSummary = novel.characters.map(c => {
      let info = `【${c.name}】（${c.role || '角色'}）`;
      if (c.personality) info += `\n  性格：${c.personality}`;
      if (c.appearance) info += `\n  外貌：${c.appearance}`;
      if (c.background) info += `\n  背景：${c.background}`;
      return info;
    }).join('\n');

    // Build world settings summary
    const worldSettingsSummary = novel.worldSettings.length > 0
      ? novel.worldSettings.map(ws => `${ws.category} - ${ws.name}：${ws.description || ''}`).join('\n')
      : null;

    // Smart context truncation - prioritize important context
    const sections = [
      { text: novel.architecture || '暂无', priority: 5 },
      { text: novel.outline || '', priority: 4 },
      { text: worldSettingsSummary || '', priority: 3 },
      { text: charSummary || '暂无', priority: 3 },
      { text: prevChapter ? `上一章（${prevChapter.title}）结尾：\n${prevChapter.content || '暂无内容'}` : '', priority: 2 },
      { text: nextChapter ? `下一章预告（${nextChapter.title}）：\n${nextChapter.outline || ''}` : '', priority: 1 },
    ];

    const modelToUse = model || 'nvidia/llama-3.3-nemotron-70b-instruct';
    const maxTokensVal = maxTokens || 8192;
    const truncated = smartTruncate(modelToUse, maxTokensVal, sections);

    const [architectureText, outlineText, worldText, charText, prevText, nextText] = truncated;

    const messages = [
      {
        role: 'system',
        content: `你是一位才华横溢的网文作家。请根据大纲和上下文，撰写小说章节内容。
要求：
1. 文笔流畅，情节紧凑
2. 人物对话生动自然
3. 适当的环境描写和心理描写
4. 与前文保持连贯
5. 每章字数在2000-3000字左右
6. 直接输出小说正文，不要有额外的说明文字`,
      },
      {
        role: 'user',
        content: `请撰写以下章节：

书名：${novel.title}
类型：${novel.genre || ''}

故事架构概要：
${architectureText}

${outlineText ? `故事大纲：
${outlineText}

` : ''}${worldText ? `世界设定：
${worldText}

` : ''}角色介绍：
${charText}

${prevText ? `${prevText}

` : ''}${nextText ? `${nextText}

` : ''}
当前章节：${currentChapter.title}
章节大纲：${currentChapter.outline || '无大纲，请自由创作'}

请撰写本章内容。`,
      },
    ];

    const stream = buildSSEStream(
      messages,
      model || undefined,
      { temperature, maxTokens: maxTokensVal, topP },
    );

    const encoder = new TextEncoder();
    let fullText = '';

    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                fullText += data.content;
              }
            } catch { /* skip */ }
          }
        }
        controller.enqueue(chunk);
      },
      async flush() {
        if (fullText) {
          try {
            const wordCount = fullText.replace(/\s/g, '').length;
            await db.chapter.update({
              where: { id: chapterId },
              data: { content: fullText, wordCount },
            });
            console.log(`Chapter auto-saved: ${wordCount} chars`);
          } catch (err) {
            console.error('Failed to auto-save chapter:', err);
          }
        }
      },
    });

    const combinedStream = stream.pipeThrough(transformStream);

    return new Response(combinedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chapter generation error:', error);
    return NextResponse.json({ error: '章节生成失败' }, { status: 500 });
  }
}
