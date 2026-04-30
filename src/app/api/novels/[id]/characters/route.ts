import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildSSEStream, chatCompletion } from '@/lib/nvidia';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const characters = await db.character.findMany({
      where: { novelId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        relationshipsTo: true,
        relationshipsFrom: true,
      },
    });
    return NextResponse.json(characters);
  } catch (error) {
    console.error('Failed to fetch characters:', error);
    return NextResponse.json({ error: '获取角色列表失败' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'generate') {
      const novel = await db.novel.findUnique({
        where: { id },
        include: { characters: true },
      });
      if (!novel) {
        return NextResponse.json({ error: '小说不存在' }, { status: 404 });
      }

      const messages = [
        {
          role: 'system',
          content: `你是一位专业的网文角色设计师。请根据小说的架构和设定，设计一组立体丰富的角色。
每个角色请按以下JSON数组格式输出：
[
  {
    "name": "角色名",
    "role": "主角/女主/配角/反派等",
    "personality": "性格特征（3-5个关键词+详细描述）",
    "background": "背景故事",
    "appearance": "外貌描写",
    "description": "角色详细描述（能力、目标、内心冲突等）"
  }
]
请设计5-8个角色，确保角色之间有丰富的互动关系。直接输出JSON，不要有其他文字。`,
        },
        {
          role: 'user',
          content: `请为以下小说设计角色：

书名：${novel.title}
类型：${novel.genre || '未指定'}
故事架构：
${novel.architecture || novel.description || '暂无架构，请根据书名和类型自由创作'}

已有角色：${novel.characters.length > 0 ? novel.characters.map(c => c.name).join('、') : '无'}

请设计一组配合这个故事的精彩角色。`,
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
              // Parse the AI response to extract characters
              const jsonMatch = fullText.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                const characters = JSON.parse(jsonMatch[0]);
                for (const char of characters) {
                  if (char.name) {
                    await db.character.create({
                      data: {
                        novelId: id,
                        name: char.name,
                        role: char.role || null,
                        personality: char.personality || null,
                        background: char.background || null,
                        appearance: char.appearance || null,
                        description: char.description || null,
                      },
                    });
                  }
                }
                console.log(`Auto-saved ${characters.length} characters`);
              }
            } catch (err) {
              console.error('Failed to auto-save characters:', err);
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

    // Manual character creation
    const { name, role, personality, background, appearance, description } = body;
    if (!name?.trim()) {
      return NextResponse.json({ error: '角色名不能为空' }, { status: 400 });
    }

    const character = await db.character.create({
      data: {
        novelId: id,
        name: name.trim(),
        role: role?.trim() || null,
        personality: personality?.trim() || null,
        background: background?.trim() || null,
        appearance: appearance?.trim() || null,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    console.error('Character operation error:', error);
    return NextResponse.json({ error: '角色操作失败' }, { status: 500 });
  }
}
