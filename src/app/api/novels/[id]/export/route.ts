import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'txt';

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

    if (format === 'docx') {
      return exportAsDocx(novel);
    }

    return exportAsTxt(novel);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: '导出失败' }, { status: 500 });
  }
}

function exportAsTxt(novel: {
  title: string;
  genre: string | null;
  description: string | null;
  chapters: Array<{ chapterNumber: number; title: string; content: string | null }>;
}) {
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
}

function exportAsDocx(novel: {
  title: string;
  genre: string | null;
  description: string | null;
  chapters: Array<{ chapterNumber: number; title: string; content: string | null }>;
}) {
  // Generate DOCX-compatible HTML (Word can open HTML with .doc extension)
  // Escape HTML entities in content
  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

  let chaptersHtml = '';
  for (const chapter of novel.chapters) {
    chaptersHtml += `
      <div style="page-break-after: always;">
        <h2 style="text-align: center; font-size: 18pt; margin-top: 24pt; margin-bottom: 12pt;">
          第${chapter.chapterNumber}章 ${escapeHtml(chapter.title)}
        </h2>
        <p style="text-indent: 2em; line-height: 1.8; font-size: 12pt; font-family: 'SimSun', serif;">
          ${escapeHtml(chapter.content || '（本章暂无内容）')}
        </p>
      </div>`;
  }

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'SimSun', 'Noto Serif SC', serif; margin: 2cm; }
        h1 { text-align: center; font-size: 22pt; }
        .meta { text-align: center; color: #666; margin-bottom: 24pt; }
      </style>
    </head>
    <body>
      <h1>《${escapeHtml(novel.title)}》</h1>
      <div class="meta">
        <p>作者：AI创作${novel.genre ? ` | 类型：${escapeHtml(novel.genre)}` : ''}</p>
        ${novel.description ? `<p>${escapeHtml(novel.description)}</p>` : ''}
      </div>
      ${chaptersHtml}
    </body>
    </html>`;

  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(html);

  return new Response(uint8Array, {
    status: 200,
    headers: {
      'Content-Type': 'application/msword',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(novel.title)}.doc"`,
    },
  });
}
