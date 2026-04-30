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

    const { title, outline, chapterNumber } = body;

    // Get next chapter number (or use provided one)
    const lastChapter = await db.chapter.findFirst({
      where: { novelId: id },
      orderBy: { chapterNumber: 'desc' },
    });
    const nextNumber = chapterNumber || (lastChapter?.chapterNumber || 0) + 1;

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Support single chapter update with { chapterId, ...data }
    if (body.chapterId) {
      const { chapterId, ...data } = body;
      const chapter = await db.chapter.update({
        where: { id: chapterId },
        data: {
          ...(data.title !== undefined && { title: data.title.trim() || undefined }),
          ...(data.outline !== undefined && { outline: data.outline?.trim() || null }),
          ...(data.content !== undefined && { content: data.content || null }),
          ...(data.wordCount !== undefined && { wordCount: data.wordCount }),
          ...(data.chapterNumber !== undefined && { chapterNumber: data.chapterNumber }),
        },
      });
      return NextResponse.json(chapter);
    }

    // Support batch reorder with { chapters: [{id, chapterNumber}] }
    if (body.chapters && Array.isArray(body.chapters)) {
      await Promise.all(
        body.chapters.map((ch: { id: string; chapterNumber: number }) =>
          db.chapter.update({
            where: { id: ch.id },
            data: { chapterNumber: ch.chapterNumber },
          })
        )
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '无效的请求参数' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update chapter:', error);
    return NextResponse.json({ error: '更新章节失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.chapterId) {
      return NextResponse.json({ error: '缺少chapterId' }, { status: 400 });
    }

    await db.chapter.delete({ where: { id: body.chapterId } });

    // Renumber remaining chapters
    const remaining = await db.chapter.findMany({
      where: { novelId: id },
      orderBy: { chapterNumber: 'asc' },
    });
    await Promise.all(
      remaining.map((ch, idx) =>
        db.chapter.update({
          where: { id: ch.id },
          data: { chapterNumber: idx + 1 },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete chapter:', error);
    return NextResponse.json({ error: '删除章节失败' }, { status: 500 });
  }
}
