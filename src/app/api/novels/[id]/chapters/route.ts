import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const chapters = await db.chapter.findMany({
      where: { novelId: id },
      orderBy: { chapterNumber: 'asc' },
    });
    return NextResponse.json(chapters);
  } catch (error) {
    console.error('Failed to fetch chapters:', error);
    return NextResponse.json({ error: '获取章节列表失败' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { title, outline } = body;

    // Get next chapter number
    const lastChapter = await db.chapter.findFirst({
      where: { novelId: id },
      orderBy: { chapterNumber: 'desc' },
    });
    const nextNumber = (lastChapter?.chapterNumber || 0) + 1;

    const chapter = await db.chapter.create({
      data: {
        novelId: id,
        chapterNumber: nextNumber,
        title: title?.trim() || `第${nextNumber}章`,
        outline: outline?.trim() || null,
      },
    });

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error('Failed to create chapter:', error);
    return NextResponse.json({ error: '创建章节失败' }, { status: 500 });
  }
}
