import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildSSEStream } from '@/lib/nvidia';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { model, temperature, maxTokens } = body;

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

    const charSummary = novel.characters.map(c => `${c.name}（${c.role || '角色'}）`).join('、');

    const messages = [
      {
        role: 'system',
        content: `你是一位专业的网文大纲策划师。请根据小说的架构和角色设定，生成一份详细的故事大纲。
大纲应该包含：
1. 整体故事线概述
2. 各卷/各章节的详细安排（含章节标题和简要内容描述）
3. 情节起伏和节奏安排
4. 关键转折点
5. 伏笔和呼应安排

请使用Markdown格式输出，结构清晰。`,
      },
      {
        role: 'user',
        content: `请为以下小说生成详细大纲：

书名：${novel.title}
类型：${novel.genre || '未指定'}
目标字数：${novel.targetWordCount ? `${novel.targetWordCount}字` : '未指定'}

故事架构：
${novel.architecture || '暂无'}

主要角色：${charSummary || '暂无'}

请生成一份完整的故事大纲。`,
      },
    ];

    const stream = buildSSEStream(messages, model || undefined, { temperature, maxTokens });

    // Capture full text for auto-save
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
            } catch { /* skip parse errors */ }
          }
        }
        controller.enqueue(chunk);
      },
      async flush() {
        if (fullText) {
          try {
            await db.novel.update({
              where: { id },
              data: { outline: fullText },
            });
            console.log('Outline auto-saved to database');
          } catch (err) {
            console.error('Failed to auto-save outline:', err);
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
    console.error('Outline generation error:', error);
    return NextResponse.json({ error: '大纲生成失败' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const novel = await db.novel.findUnique({
      where: { id },
      select: { outline: true },
    });
    if (!novel) {
      return NextResponse.json({ error: '小说不存在' }, { status: 404 });
    }
    return NextResponse.json({ outline: novel.outline });
  } catch (error) {
    console.error('Failed to fetch outline:', error);
    return NextResponse.json({ error: '获取大纲失败' }, { status: 500 });
  }
}
