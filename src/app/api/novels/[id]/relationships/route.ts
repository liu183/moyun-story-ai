import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const relationships = await db.characterRelationship.findMany({
      where: { novelId: id },
      include: {
        fromCharacter: { select: { id: true, name: true } },
        toCharacter: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(relationships);
  } catch (error) {
    console.error('Failed to fetch relationships:', error);
    return NextResponse.json({ error: '获取角色关系失败' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { fromCharacterId, toCharacterId, relationshipType, description } = body;
    if (!fromCharacterId || !toCharacterId || !relationshipType?.trim()) {
      return NextResponse.json({ error: '角色和关系类型不能为空' }, { status: 400 });
    }

    const relationship = await db.characterRelationship.create({
      data: {
        novelId: id,
        fromCharacterId,
        toCharacterId,
        relationshipType: relationshipType.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(relationship, { status: 201 });
  } catch (error) {
    console.error('Failed to create relationship:', error);
    return NextResponse.json({ error: '创建角色关系失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { relationshipId, ...data } = body;
    if (!relationshipId) {
      return NextResponse.json({ error: '缺少relationshipId' }, { status: 400 });
    }

    const relationship = await db.characterRelationship.update({
      where: { id: relationshipId },
      data: {
        ...(data.fromCharacterId !== undefined && { fromCharacterId: data.fromCharacterId }),
        ...(data.toCharacterId !== undefined && { toCharacterId: data.toCharacterId }),
        ...(data.relationshipType !== undefined && { relationshipType: data.relationshipType.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
      },
    });

    return NextResponse.json(relationship);
  } catch (error) {
    console.error('Failed to update relationship:', error);
    return NextResponse.json({ error: '更新角色关系失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.relationshipId) {
      return NextResponse.json({ error: '缺少relationshipId' }, { status: 400 });
    }

    await db.characterRelationship.delete({ where: { id: body.relationshipId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete relationship:', error);
    return NextResponse.json({ error: '删除角色关系失败' }, { status: 500 });
  }
}
