import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildSSEStream } from '@/lib/nvidia';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> },
) {
  try {
    const { id, chapterId } = await params;

    const novel = await db.novel.findUnique({
      where: { id },
      include: {
        characters: true,
        chapters: { orderBy: { chapterNumber: 'asc' } },
      },
    });

    if (!novel) {
      return NextResponse.json({ error: '小说不存在' }, { status: 404 });
    }

    const currentChapter = novel.chapters.find(c => c.id === chapterId);
    if (!currentChapter) {
      return NextResponse.json({ error: '章节不存在' }, { status: 404 });
    }

    // Get previous chapter content for context
    const prevChapter = novel.chapters
      .filter(c => c.chapterNumber < currentChapter.chapterNumber)
      .pop();

    const charSummary = novel.characters.map(c => `${c.name}（${c.role || '角色'}）：${c.personality || ''}`).join('\n');

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
${novel.architecture ? novel.architecture.substring(0, 1000) : '暂无'}

角色介绍：
${charSummary || '暂无'}

${prevChapter ? `上一章（${prevChapter.title}）结尾：
${prevChapter.content ? prevChapter.content.substring(Math.max(0, prevChapter.content.length - 500)) : '暂无内容'}
` : ''}

当前章节：${currentChapter.title}
章节大纲：${currentChapter.outline || '无大纲，请自由创作'}

请撰写本章内容。`,
      },
    ];

    const stream = buildSSEStream(messages);

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
