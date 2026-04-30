'use client';

import { useState } from 'react';
import { useNovelStore } from '@/store/novelStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Plus, Trash2, Sparkles, Loader2, FileText,
  ChevronDown, ChevronUp, BookOpen, Edit3, Save, X, Play,
} from 'lucide-react';

export default function ChapterManager() {
  const {
    currentNovel, chapters, isGenerating, generatingTarget, streamingContent,
    addChapter, generateChapter, deleteChapter, updateChapter,
  } = useNovelStore();

  const [showAdd, setShowAdd] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', outline: '', content: '' });
  const [newTitle, setNewTitle] = useState('');
  const [newOutline, setNewOutline] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  const handleAdd = async () => {
    await addChapter({ title: newTitle, outline: newOutline });
    setNewTitle('');
    setNewOutline('');
    setShowAdd(false);
  };

  const handleEdit = (chapter: typeof chapters[0]) => {
    setEditForm({
      title: chapter.title,
      outline: chapter.outline || '',
      content: chapter.content || '',
    });
    setEditingChapter(chapter.id);
    setExpandedChapter(chapter.id);
  };

  const handleSaveEdit = async () => {
    if (!editingChapter) return;
    const wordCount = editForm.content.replace(/\s/g, '').length;
    await updateChapter(editingChapter, {
      title: editForm.title,
      outline: editForm.outline || null,
      content: editForm.content || null,
      wordCount: editForm.content ? wordCount : 0,
    });
    setEditingChapter(null);
  };

  const handleDelete = async (id: string) => {
    await deleteChapter(id);
    setDeleteConfirm(null);
  };

  const totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
  const generatedCount = chapters.filter((ch) => ch.content).length;
  const unGenerated = chapters.filter((ch) => !ch.content);

  const handleBatchGenerate = async () => {
    if (unGenerated.length === 0) return;
    setBatchGenerating(true);
    setBatchProgress({ current: 0, total: unGenerated.length });
    try {
      for (let i = 0; i < unGenerated.length; i++) {
        setBatchProgress({ current: i + 1, total: unGenerated.length });
        await generateChapter(unGenerated[i].id);
      }
    } catch (error) {
      console.error('Batch generation error:', error);
    } finally {
      setBatchGenerating(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

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
            《{currentNovel.title}》· {chapters.length}章 · 已生成{generatedCount}章 · 共{totalWords.toLocaleString()}字
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unGenerated.length > 0 && (
            <Button
              size="sm"
              onClick={handleBatchGenerate}
              disabled={isGenerating || batchGenerating}
              className="gap-1.5 text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {batchGenerating ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> {batchProgress.current}/{batchProgress.total}</>
              ) : (
                <><Play className="w-3 h-3" /> 批量生成({unGenerated.length})</>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> 添加章节
          </Button>
        </div>
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
              const isEditing = editingChapter === chapter.id;

              return (
                <Card key={chapter.id} className={`transition-all ${isGeneratingThis ? 'border-amber-500/50 bg-amber-500/5' : isEditing ? 'border-primary/30' : ''}`}>
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => !isEditing && setExpandedChapter(isExpanded ? null : chapter.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="outline" className="shrink-0 text-xs">
                          第{chapter.chapterNumber}章
                        </Badge>
                        <h3 className="font-medium truncate">{chapter.title}</h3>
                        {chapter.content && (
                          <span className="text-xs text-emerald-400 shrink-0">已生成</span>
                        )}
                        {chapter.wordCount > 0 && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {chapter.wordCount.toLocaleString()}字
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {!isEditing && (
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
                              <><Sparkles className="w-3 h-3" /> {chapter.content ? '重写' : '生成'}</>
                            )}
                          </Button>
                        )}
                        {!isEditing && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(chapter); }}
                            className="p-1.5 hover:bg-accent rounded"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isEditing && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(chapter.id); }}
                            className="p-1.5 hover:bg-destructive/20 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        )}
                        {isEditing && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                              className="gap-1 text-xs text-emerald-400"
                            >
                              <Save className="w-3 h-3" /> 保存
                            </Button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingChapter(null); }}
                              className="p-1.5 hover:bg-accent rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedChapter(isExpanded ? null : chapter.id); }}
                          className="p-1.5 hover:bg-accent rounded"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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

                    {/* Edit mode */}
                    {isExpanded && isEditing && (
                      <div className="mt-3 pt-3 border-t border-border space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">章节标题</label>
                          <Input
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">章节大纲</label>
                          <Textarea
                            value={editForm.outline}
                            onChange={(e) => setEditForm({ ...editForm, outline: e.target.value })}
                            placeholder="本章的情节安排..."
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">章节内容</label>
                          <Textarea
                            value={editForm.content}
                            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                            placeholder="本章正文内容..."
                            rows={12}
                            className="text-sm font-sans leading-relaxed"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            当前字数：{editForm.content.replace(/\s/g, '').length}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Read-only expanded content */}
                    {isExpanded && !isEditing && !isGeneratingThis && chapter.content && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <pre className="text-sm text-foreground/90 whitespace-pre-wrap max-h-96 overflow-y-auto font-sans leading-relaxed">
                          {chapter.content}
                        </pre>
                      </div>
                    )}

                    {isExpanded && !isEditing && !isGeneratingThis && !chapter.content && chapter.outline && (
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

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            确定要删除这个章节吗？删除后章节内容将无法恢复，后续章节会自动重新编号。
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
