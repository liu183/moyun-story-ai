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

    if (body.action === 'generate') {
      const novel = await db.novel.findUnique({ where: { id } });
      if (!novel) {
        return NextResponse.json({ error: '小说不存在' }, { status: 404 });
      }

      const messages = [
        {
          role: 'system',
          content: `你是一位资深的网文创作顾问，擅长构建完整的故事架构。请根据用户提供的信息，生成一个详细的故事架构。架构应该包含：世界观设定、主线剧情、支线剧情、人物关系框架、核心冲突、故事节奏安排等。请使用Markdown格式输出，结构清晰，层次分明。`,
        },
        {
          role: 'user',
          content: `请为以下小说生成完整的故事架构：

书名：${novel.title}
类型：${novel.genre || '未指定'}
简介：${novel.description || '未提供'}
目标字数：${novel.targetWordCount ? `${novel.targetWordCount}字` : '未指定'}

请生成一个结构完整、层次清晰的故事架构。`,
        },
      ];

      const stream = buildSSEStream(messages);

      // Also capture full text for auto-save
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
              } catch { /* skip parse errors */ }
            }
          }
          controller.enqueue(chunk);
        },
        async flush() {
          // Auto-save architecture when done
          if (fullText) {
            try {
              await db.novel.update({
                where: { id },
                data: { architecture: fullText },
              });
              console.log('Architecture auto-saved to database');
            } catch (err) {
              console.error('Failed to auto-save architecture:', err);
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
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 });
  } catch (error) {
    console.error('Architecture generation error:', error);
    return NextResponse.json({ error: '架构生成失败' }, { status: 500 });
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
      select: { architecture: true },
    });
    if (!novel) {
      return NextResponse.json({ error: '小说不存在' }, { status: 404 });
    }
    return NextResponse.json({ architecture: novel.architecture });
  } catch (error) {
    console.error('Failed to fetch architecture:', error);
    return NextResponse.json({ error: '获取架构失败' }, { status: 500 });
  }
}
