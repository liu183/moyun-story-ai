'use client';

import { useState } from 'react';
import { useNovelStore } from '@/store/novelStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Book, Plus, Trash2, FileText, ChevronLeft, ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const {
    novels, currentNovel, selectNovel, createNovel, deleteNovel,
    sidebarOpen, toggleSidebar,
  } = useNovelStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createNovel({ title: newTitle, genre: newGenre, description: newDesc });
    setNewTitle('');
    setNewGenre('');
    setNewDesc('');
    setShowCreate(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这部小说吗？删除后无法恢复。')) {
      await deleteNovel(id);
    }
  };

  const genreColors: Record<string, string> = {
    '玄幻': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    '仙侠': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    '都市': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    '科幻': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    '历史': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    '言情': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    '悬疑': 'bg-red-500/20 text-red-300 border-red-500/30',
    '奇幻': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-card border border-border/50 hover:bg-accent transition-colors lg:hidden"
      >
        {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Book className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">墨韵AI</h1>
              <p className="text-xs text-muted-foreground">AI网文创作平台</p>
            </div>
          </div>
        </div>

        {/* Novel list */}
        <ScrollArea className="flex-1 p-2">
          {novels.length === 0 ? (
            <div className="text-center py-8 px-4">
              <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">暂无小说</p>
              <p className="text-xs text-muted-foreground/60 mt-1">点击下方按钮创建新作品</p>
            </div>
          ) : (
            <div className="space-y-1">
              {novels.map((novel) => (
                <div
                  key={novel.id}
                  onClick={() => selectNovel(novel)}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                    currentNovel?.id === novel.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-accent border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm truncate">{novel.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {novel.genre && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${genreColors[novel.genre] || 'bg-muted text-muted-foreground border-border'}`}>
                            {novel.genre}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {novel._count?.chapters || 0}章
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, novel.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Create button */}
        <div className="p-3 border-t border-border">
          <Button
            onClick={() => setShowCreate(true)}
            className="w-full gap-2"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            新建小说
          </Button>
        </div>
      </aside>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>创建新小说</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">书名 *</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="请输入书名"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">类型</label>
              <Input
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                placeholder="如：玄幻、都市、科幻、言情..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">简介</label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="简要描述你的故事创意..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim()}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
