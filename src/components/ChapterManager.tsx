'use client';

import { useState } from 'react';
import { useNovelStore } from '@/store/novelStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Plus, Trash2, Sparkles, Loader2, FileText,
  ChevronDown, ChevronUp, BookOpen,
} from 'lucide-react';

export default function ChapterManager() {
  const {
    currentNovel, chapters, isGenerating, generatingTarget, streamingContent,
    addChapter, generateChapter, deleteChapter,
  } = useNovelStore();

  const [showAdd, setShowAdd] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newOutline, setNewOutline] = useState('');

  const handleAdd = async () => {
    await addChapter({ title: newTitle, outline: newOutline });
    setNewTitle('');
    setNewOutline('');
    setShowAdd(false);
  };

  const totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

  if (!currentNovel) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">请先选择或创建一部小说</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">章节管理</h2>
          <p className="text-sm text-muted-foreground">
            《{currentNovel.title}》· {chapters.length}章 · 共{totalWords.toLocaleString()}字
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> 添加章节
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg mb-1">还没有章节</p>
            <p className="text-sm">添加章节并使用AI生成内容</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter) => {
              const isGeneratingThis = generatingTarget === `chapter-${chapter.id}` && isGenerating;
              const isExpanded = expandedChapter === chapter.id;

              return (
                <Card key={chapter.id} className={`transition-all ${isGeneratingThis ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="outline" className="shrink-0 text-xs">
                          第{chapter.chapterNumber}章
                        </Badge>
                        <h3 className="font-medium truncate">{chapter.title}</h3>
                        {chapter.wordCount > 0 && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {chapter.wordCount.toLocaleString()}字
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); generateChapter(chapter.id); }}
                          disabled={isGenerating}
                          className="gap-1 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                        >
                          {isGeneratingThis ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> 生成中</>
                          ) : (
                            <><Sparkles className="w-3 h-3" /> {chapter.content ? '重新生成' : 'AI生成'}</>
                          )}
                        </Button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedChapter(isExpanded ? null : chapter.id); }}
                          className="p-1.5 hover:bg-accent rounded"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteChapter(chapter.id); }}
                          className="p-1.5 hover:bg-destructive/20 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>

                    {/* Streaming content */}
                    {isGeneratingThis && streamingContent && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <pre className="text-sm text-foreground/90 whitespace-pre-wrap max-h-60 overflow-y-auto font-sans leading-relaxed">
                          {streamingContent}
                          <span className="inline-block w-1.5 h-3 bg-amber-400 animate-pulse ml-0.5" />
                        </pre>
                      </div>
                    )}

                    {/* Expanded content */}
                    {isExpanded && !isGeneratingThis && chapter.content && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <pre className="text-sm text-foreground/90 whitespace-pre-wrap max-h-96 overflow-y-auto font-sans leading-relaxed">
                          {chapter.content}
                        </pre>
                      </div>
                    )}

                    {isExpanded && !isGeneratingThis && !chapter.content && chapter.outline && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">章节大纲：</p>
                        <p className="text-sm text-muted-foreground">{chapter.outline}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Add chapter dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>添加章节</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">章节标题</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={`第${(chapters.length || 0) + 1}章`}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">章节大纲</label>
              <Textarea
                value={newOutline}
                onChange={(e) => setNewOutline(e.target.value)}
                placeholder="简要描述本章的情节安排..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
            <Button onClick={handleAdd}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
