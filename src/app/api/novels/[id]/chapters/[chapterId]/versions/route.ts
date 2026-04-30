import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List versions for a chapter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> },
) {
  try {
    const { id, chapterId } = await params;

    const versions = await db.chapterVersion.findMany({
      where: { novelId: id, chapterId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Keep last 50 versions max
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Failed to fetch chapter versions:', error);
    return NextResponse.json({ error: '获取版本历史失败' }, { status: 500 });
  }
}

// POST - Save a new version (before regeneration)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> },
) {
  try {
    const { id, chapterId } = await params;
    const body = await request.json();
    const { versionLabel } = body;

    // Get current chapter data
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      return NextResponse.json({ error: '章节不存在' }, { status: 404 });
    }

    // Only save version if chapter has content
    if (!chapter.content) {
      return NextResponse.json({ skipped: true });
    }

    const version = await db.chapterVersion.create({
      data: {
        chapterId: chapter.id,
        novelId: id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        content: chapter.content,
        wordCount: chapter.wordCount,
        versionLabel: versionLabel || '重写前自动保存',
      },
    });

    // Clean up old versions (keep last 20)
    const allVersions = await db.chapterVersion.findMany({
      where: { chapterId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (allVersions.length > 20) {
      const toDelete = allVersions.slice(20);
      await db.chapterVersion.deleteMany({
        where: { id: { in: toDelete.map(v => v.id) } },
      });
    }

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error('Failed to save chapter version:', error);
    return NextResponse.json({ error: '保存版本失败' }, { status: 500 });
  }
}

// PUT - Restore a version
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> },
) {
  try {
    const { id, chapterId } = await params;
    const body = await request.json();
    const { versionId } = body;

    const version = await db.chapterVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.chapterId !== chapterId) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    // Restore chapter content from version
    const chapter = await db.chapter.update({
      where: { id: chapterId },
      data: {
        content: version.content,
        wordCount: version.wordCount,
        title: version.title,
      },
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Failed to restore chapter version:', error);
    return NextResponse.json({ error: '恢复版本失败' }, { status: 500 });
  }
}
