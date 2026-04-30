import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; charId: string }> },
) {
  try {
    const { charId } = await params;
    const body = await request.json();

    const character = await db.character.update({
      where: { id: charId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.role !== undefined && { role: body.role?.trim() || null }),
        ...(body.personality !== undefined && { personality: body.personality?.trim() || null }),
        ...(body.background !== undefined && { background: body.background?.trim() || null }),
        ...(body.appearance !== undefined && { appearance: body.appearance?.trim() || null }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
      },
    });

    return NextResponse.json(character);
  } catch (error) {
    console.error('Failed to update character:', error);
    return NextResponse.json({ error: '更新角色失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; charId: string }> },
) {
  try {
    const { charId } = await params;
    await db.character.delete({ where: { id: charId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete character:', error);
    return NextResponse.json({ error: '删除角色失败' }, { status: 500 });
  }
}
