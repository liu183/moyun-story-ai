'use client';

import { useState, useCallback } from 'react';
import { useNovelStore } from '@/store/novelStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import {
  Plus, Trash2, Sparkles, Loader2, FileText,
  ChevronDown, ChevronUp, BookOpen, Edit3, Save, X, Play,
  History, Download, Eye, PenLine, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

function WordCountBar({ chapters }: { chapters: Array<{ wordCount: number; content: string | null }> }) {
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
  const generatedCount = chapters.filter((ch) => ch.content).length;
  const avgWords = generatedCount > 0 ? Math.round(totalWords / generatedCount) : 0;
  const readTimeMinutes = Math.max(1, Math.ceil(totalWords / 500));

  return (
    <div className="flex items-center gap-4 py-2 px-3 rounded-lg bg-muted/30 border border-border text-xs">
      <div className="flex items-center gap-1.5">
        <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-muted-foreground">总字数</span>
        <span className="font-mono font-medium text-foreground">{totalWords.toLocaleString()}</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-muted-foreground">已生成</span>
        <span className="font-mono font-medium text-foreground">{generatedCount}/{chapters.length}章</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">章均</span>
        <span className="font-mono font-medium text-foreground">{avgWords.toLocaleString()}字</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">阅读时长</span>
        <span className="font-mono font-medium text-foreground">约{readTimeMinutes}分钟</span>
      </div>
    </div>
  );
}

function VersionHistoryDialog({
  novelId,
  chapterId,
  open,
  onClose,
  onRestore,
}: {
  novelId: string;
  chapterId: string;
  open: boolean;
  onClose: () => void;
  onRestore: (versionId: string) => void;
}) {
  const [versions, setVersions] = useState<Array<{
    id: string;
    title: string;
    wordCount: number;
    versionLabel: string;
    createdAt: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/novels/${novelId}/chapters/${chapterId}/versions`);
      const data = await res.json();
      setVersions(Array.isArray(data) ? data : []);
    } catch {
      toast.error('加载版本历史失败');
    } finally {
      setLoading(false);
    }
  }, [novelId, chapterId]);

  useState(() => {
    if (open) loadVersions();
  });

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    try {
      const res = await fetch(`/api/novels/${novelId}/chapters/${chapterId}/versions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });
      if (!res.ok) throw new Error('恢复失败');
      toast.success('版本已恢复');
      onRestore(versionId);
      onClose();
    } catch {
      toast.error('恢复版本失败');
    } finally {
      setRestoring(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); else loadVersions(); }}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-4 h-4" /> 版本历史
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">暂无版本记录</p>
          ) : (
            <ScrollArea className="max-h-60">
              <div className="space-y-2 pr-3">
                {versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{ver.versionLabel}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ver.wordCount.toLocaleString()}字 · {new Date(ver.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(ver.id)}
                      disabled={restoring === ver.id}
                      className="shrink-0 ml-2 text-xs"
                    >
                      {restoring === ver.id ? (
                        <><Loader2 className="w-3 h-3 animate-spin mr-1" /> 恢复中</>
                      ) : (
                        '恢复'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  const [previewMode, setPreviewMode] = useState<Record<string, 'markdown' | 'edit'>>({});
  const [versionDialog, setVersionDialog] = useState<{ novelId: string; chapterId: string } | null>(null);

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
      toast.success(`批量生成完成，共 ${unGenerated.length} 章`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '批量生成失败');
    } finally {
      setBatchGenerating(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  const handleExport = (format: string) => {
    if (!currentNovel) return;
    const url = `/api/novels/${currentNovel.id}/export?format=${format}`;
    window.open(url, '_blank');
    toast.success(`正在导出 ${format.toUpperCase()} 文件...`);
  };

  const handleVersionRestore = (versionId: string) => {
    // Reload chapters after restore - use loadChapters from store if needed
    // For now, just trigger a page refresh effect
    window.location.reload();
  };

  if (!currentNovel) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">请先选择或创建一部小说</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">章节管理</h2>
          <p className="text-sm text-muted-foreground">
            《{currentNovel.title}》· {chapters.length}章
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export buttons */}
          <Select onValueChange={handleExport}>
            <SelectTrigger className="w-24 h-8 text-xs bg-transparent border-border">
              <Download className="w-3.5 h-3.5 mr-1" />
              <SelectValue placeholder="导出" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="txt" className="text-xs">导出 TXT</SelectItem>
              <SelectItem value="docx" className="text-xs">导出 DOC</SelectItem>
            </SelectContent>
          </Select>

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

      {/* Word count bar */}
      {chapters.length > 0 && (
        <WordCountBar chapters={chapters} />
      )}

      {/* Chapter list */}
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
              const currentPreviewMode = previewMode[chapter.id] || (isEditing ? 'edit' : 'markdown');

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
                            onClick={(e) => {
                              e.stopPropagation();
                              generateChapter(chapter.id)
                                .then(() => toast.success(`第${chapter.chapterNumber}章 生成完成`))
                                .catch((err) => toast.error(err.message || '章节生成失败'));
                            }}
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
                        {!isEditing && chapter.content && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setVersionDialog({ novelId: currentNovel.id, chapterId: chapter.id });
                            }}
                            className="p-1.5 hover:bg-accent rounded"
                            title="版本历史"
                          >
                            <History className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        )}
                        {!isEditing && chapter.content && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(chapter); }}
                            className="p-1.5 hover:bg-accent rounded"
                            title="编辑"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isEditing && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(chapter.id); }}
                            className="p-1.5 hover:bg-destructive/20 rounded"
                            title="删除"
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
                        <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground text-sm max-h-60 overflow-y-auto">
                          <ReactMarkdown>{streamingContent}</ReactMarkdown>
                          <span className="inline-block w-1.5 h-3 bg-amber-400 animate-pulse ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Expanded content with view/edit toggle */}
                    {isExpanded && chapter.content && !isGeneratingThis && (
                      <div className="mt-3 pt-3 border-t border-border">
                        {/* Toggle buttons for markdown/edit */}
                        {!isEditing && (
                          <div className="flex items-center gap-1 mb-3">
                            <button
                              onClick={() => setPreviewMode({ ...previewMode, [chapter.id]: 'markdown' })}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                                currentPreviewMode === 'markdown'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-accent'
                              }`}
                            >
                              <Eye className="w-3 h-3" /> 预览
                            </button>
                            <button
                              onClick={() => {
                                setPreviewMode({ ...previewMode, [chapter.id]: 'edit' });
                                handleEdit(chapter);
                              }}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                                currentPreviewMode === 'edit'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-accent'
                              }`}
                            >
                              <PenLine className="w-3 h-3" /> 编辑
                            </button>
                          </div>
                        )}

                        {isEditing ? (
                          <div className="space-y-3">
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
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-medium text-muted-foreground">章节内容</label>
                                <span className="text-xs text-muted-foreground">
                                  {editForm.content.replace(/\s/g, '').length.toLocaleString()}字
                                </span>
                              </div>
                              <Textarea
                                value={editForm.content}
                                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                placeholder="本章正文内容..."
                                rows={14}
                                className="text-sm font-sans leading-relaxed"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-blockquote:border-amber-500/50 prose-code:text-amber-300 prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded text-sm max-h-[500px] overflow-y-auto leading-relaxed">
                            <ReactMarkdown>{chapter.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Edit mode for chapters without content */}
                    {isExpanded && isEditing && !chapter.content && (
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

                    {/* Read-only: outline only (no content) */}
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

      {/* Version history dialog */}
      {versionDialog && (
        <VersionHistoryDialog
          novelId={versionDialog.novelId}
          chapterId={versionDialog.chapterId}
          open={!!versionDialog}
          onClose={() => setVersionDialog(null)}
          onRestore={handleVersionRestore}
        />
      )}
    </div>
  );
}
