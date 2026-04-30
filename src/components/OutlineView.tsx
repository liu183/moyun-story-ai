'use client';

import { useEffect, useRef, useState } from 'react';
import { useNovelStore } from '@/store/novelStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, List, Save, Edit3, Check, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export default function OutlineView() {
  const {
    currentNovel, isGenerating, generatingTarget, streamingContent,
    generateOutline, updateNovel, addChapter, setActiveTab, chapters,
  } = useNovelStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [saved, setSaved] = useState(false);
  const [creating, setCreating] = useState(false);

  const isOutlineGenerating = generatingTarget === 'outline' && isGenerating;
  const displayText = isOutlineGenerating
    ? streamingContent
    : currentNovel?.outline || '';

  useEffect(() => {
    if (isOutlineGenerating && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamingContent, isOutlineGenerating]);

  if (!currentNovel) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">请先选择或创建一部小说</p>
      </div>
    );
  }

  const hasArchitecture = !!currentNovel.architecture;
  const hasOutline = !!currentNovel.outline;

  const handleSave = async () => {
    await updateNovel(currentNovel.id, { outline: editText });
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleEdit = () => {
    setEditText(currentNovel?.outline || '');
    setIsEditing(true);
  };

  const handleCreateChapters = async () => {
    const outlineText = currentNovel?.outline;
    if (!outlineText) return;

    setCreating(true);
    try {
      // Parse outline for chapter titles/outlines
      // Match patterns like "第X章" or "## 第X章" or numbered headings
      const chapterRegex = /(?:##?\s*)?(?:第?\s*(\d+)\s*章[：:：]?\s*)([\s\S]*?)(?=(?:##?\s*)?(?:第?\s*\d+\s*章)|$)/g;
      const matches = [...outlineText.matchAll(chapterRegex)];

      let createdCount = 0;

      if (matches.length > 0) {
        // Found structured chapters
        for (const match of matches) {
          const chapterNum = match[1] ? parseInt(match[1]) : undefined;
          const titleAndOutline = match[2]?.trim() || '';
          // First line is usually the title, rest is outline
          const lines = titleAndOutline.split('\n').filter(l => l.trim());
          const title = lines[0]?.trim() || (chapterNum ? `第${chapterNum}章` : `第${createdCount + 1}章`);
          const outline = lines.slice(1).join('\n').trim() || null;

          await addChapter({ title, outline: outline || undefined, chapterNumber: chapterNum });
          createdCount++;
        }
      } else {
        // Try to split by numbered headings (e.g., "1.", "一、")
        const headingRegex = /(?:^|\n)(?:\d+[.、)）]\s*|一[、.]|二[、.]|三[、.]|四[、.]|五[、.]|六[、.]|七[、.]|八[、.]|九[、.]|十[、.])([\s\S]*?)(?=(?:\n\d+[.、)）])|\n#|$)/g;
        const headingMatches = [...outlineText.matchAll(headingRegex)];

        if (headingMatches.length > 0) {
          for (const match of headingMatches) {
            const content = match[1]?.trim() || '';
            const lines = content.split('\n').filter(l => l.trim());
            const title = lines[0]?.trim() || `第${createdCount + 1}章`;
            const outline = lines.slice(1).join('\n').trim() || null;

            await addChapter({ title, outline: outline || undefined });
            createdCount++;
          }
        } else {
          // Fallback: create 10 empty chapters
          for (let i = 0; i < 10; i++) {
            await addChapter({ title: `第${i + 1}章` });
            createdCount++;
          }
        }
      }

      // Navigate to chapters tab
      setActiveTab('chapters');
    } catch (error) {
      console.error('Failed to create chapters from outline:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">故事大纲</h2>
          <p className="text-sm text-muted-foreground">
            为《{currentNovel.title}》规划详细的故事发展
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-1.5">
                {saved ? <><Check className="w-3.5 h-3.5" /> 已保存</> : <><Save className="w-3.5 h-3.5" /> 保存</>}
              </Button>
            </>
          )}
          {!isEditing && hasOutline && !isOutlineGenerating && (
            <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1.5">
              <Edit3 className="w-3.5 h-3.5" /> 编辑
            </Button>
          )}
          <Button
            onClick={() => {
              generateOutline().then(() => {
                toast.success('故事大纲生成完成');
              }).catch((err) => {
                toast.error(err.message || '大纲生成失败');
              });
            }}
            disabled={isGenerating || !hasArchitecture}
            className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            {isOutlineGenerating ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 生成中...</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> {hasOutline ? '重新生成大纲' : 'AI生成大纲'}</>
            )}
          </Button>
          {hasOutline && chapters.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateChapters}
              disabled={creating || isGenerating}
              className="gap-1.5"
            >
              {creating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 创建中...</> : <><FileText className="w-3.5 h-3.5" /> 创建章节</>}
            </Button>
          )}
        </div>
      </div>

      {!hasArchitecture && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <List className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200">请先生成故事架构，再基于架构生成大纲</p>
          </CardContent>
        </Card>
      )}

      {isEditing ? (
        <Textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="flex-1 min-h-[500px] font-mono text-sm"
        />
      ) : (
        <Card className="flex-1">
          <CardContent className="p-0 h-full">
            <ScrollArea className="h-full" ref={scrollRef}>
              <div className="p-6">
                {displayText ? (
                  <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90">
                    <ReactMarkdown>{displayText}</ReactMarkdown>
                    {isOutlineGenerating && (
                      <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse ml-0.5" />
                    )}
                  </div>
                ) : hasOutline ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <List className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-lg mb-1">还没有故事大纲</p>
                    <p className="text-sm">点击上方"AI生成大纲"按钮生成大纲</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <List className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-lg mb-1">还没有故事大纲</p>
                    <p className="text-sm">先完成故事架构，再生成详细大纲</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
