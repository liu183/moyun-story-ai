import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const settings = await db.worldSetting.findMany({
      where: { novelId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch world settings:', error);
    return NextResponse.json({ error: '获取世界观设置失败' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { category, name, description } = body;
    if (!category?.trim() || !name?.trim()) {
      return NextResponse.json({ error: '分类和名称不能为空' }, { status: 400 });
    }

    const setting = await db.worldSetting.create({
      data: {
        novelId: id,
        category: category.trim(),
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('Failed to create world setting:', error);
    return NextResponse.json({ error: '创建世界观设置失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { settingId, ...data } = body;
    if (!settingId) {
      return NextResponse.json({ error: '缺少settingId' }, { status: 400 });
    }

    const setting = await db.worldSetting.update({
      where: { id: settingId },
      data: {
        ...(data.category !== undefined && { category: data.category.trim() }),
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Failed to update world setting:', error);
    return NextResponse.json({ error: '更新世界观设置失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.settingId) {
      return NextResponse.json({ error: '缺少settingId' }, { status: 400 });
    }

    await db.worldSetting.delete({ where: { id: body.settingId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete world setting:', error);
    return NextResponse.json({ error: '删除世界观设置失败' }, { status: 500 });
  }
}
