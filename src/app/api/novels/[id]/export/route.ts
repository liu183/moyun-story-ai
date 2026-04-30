import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const novel = await db.novel.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { chapterNumber: 'asc' },
        },
      },
    });

    if (!novel) {
      return NextResponse.json({ error: '小说不存在' }, { status: 404 });
    }

    const lines: string[] = [];
    lines.push(`《${novel.title}》`);
    lines.push(`作者：AI创作`);
    if (novel.genre) lines.push(`类型：${novel.genre}`);
    if (novel.description) lines.push(`简介：${novel.description}`);
    lines.push('');

    for (const chapter of novel.chapters) {
      lines.push(`第${chapter.chapterNumber}章 ${chapter.title}`);
      lines.push('');
      lines.push(chapter.content || '');
      lines.push('');
      lines.push('————————————————');
      lines.push('');
    }

    const text = lines.join('\n');

    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(text);

    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(novel.title)}.txt"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: '导出失败' }, { status: 500 });
  }
}
