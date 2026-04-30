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
        characters: true,
        characterRelationships: true,
        worldSettings: true,
        chapters: { orderBy: { chapterNumber: 'asc' } },
      },
    });

    if (!novel) {
      return NextResponse.json({ error: '小说不存在' }, { status: 404 });
    }

    return NextResponse.json(novel);
  } catch (error) {
    console.error('Failed to fetch novel:', error);
    return NextResponse.json({ error: '获取小说详情失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const novel = await db.novel.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.genre !== undefined && { genre: body.genre?.trim() || null }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.targetWordCount !== undefined && { targetWordCount: body.targetWordCount || null }),
        ...(body.architecture !== undefined && { architecture: body.architecture }),
      },
    });

    return NextResponse.json(novel);
  } catch (error) {
    console.error('Failed to update novel:', error);
    return NextResponse.json({ error: '更新小说失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.novel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete novel:', error);
    return NextResponse.json({ error: '删除小说失败' }, { status: 500 });
  }
}
