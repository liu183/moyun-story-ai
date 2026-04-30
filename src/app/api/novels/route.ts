import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const novels = await db.novel.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { chapters: true, characters: true } },
      },
    });
    return NextResponse.json(novels);
  } catch (error) {
    console.error('Failed to fetch novels:', error);
    return NextResponse.json({ error: '获取小说列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, genre, description, targetWordCount } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }

    const novel = await db.novel.create({
      data: {
        title: title.trim(),
        genre: genre?.trim() || null,
        description: description?.trim() || null,
        targetWordCount: targetWordCount || null,
      },
    });

    return NextResponse.json(novel, { status: 201 });
  } catch (error) {
    console.error('Failed to create novel:', error);
    return NextResponse.json({ error: '创建小说失败' }, { status: 500 });
  }
}
