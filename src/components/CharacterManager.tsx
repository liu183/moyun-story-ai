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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles, Plus, Trash2, Edit3, User, Loader2, Wand2,
} from 'lucide-react';

export default function CharacterManager() {
  const {
    currentNovel, characters, isGenerating, generatingTarget, streamingContent,
    addCharacter, updateCharacter, deleteCharacter, generateCharacters,
  } = useNovelStore();

  const [showAdd, setShowAdd] = useState(false);
  const [editingChar, setEditingChar] = useState<null | { id: string; name: string; role: string; personality: string; background: string; appearance: string; description: string }>(null);
  const [form, setForm] = useState({ name: '', role: '', personality: '', background: '', appearance: '', description: '' });

  const roleColors: Record<string, string> = {
    '主角': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    '女主': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    '反派': 'bg-red-500/20 text-red-300 border-red-500/30',
    '配角': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    '导师': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  const resetForm = () => setForm({ name: '', role: '', personality: '', background: '', appearance: '', description: '' });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await addCharacter(form);
    resetForm();
    setShowAdd(false);
  };

  const handleUpdate = async () => {
    if (!editingChar || !form.name.trim()) return;
    await updateCharacter(editingChar.id, form);
    resetForm();
    setEditingChar(null);
  };

  const openEdit = (char: typeof characters[0]) => {
    setForm({
      name: char.name,
      role: char.role || '',
      personality: char.personality || '',
      background: char.background || '',
      appearance: char.appearance || '',
      description: char.description || '',
    });
    setEditingChar({ ...char, role: char.role || '', personality: char.personality || '', background: char.background || '', appearance: char.appearance || '', description: char.description || '' });
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
          <h2 className="text-xl font-bold">角色管理</h2>
          <p className="text-sm text-muted-foreground">
            为《{currentNovel.title}》设定角色阵容（{characters.length}个角色）
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={generateCharacters}
            disabled={isGenerating}
            className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            {isGenerating ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 生成中...</>
            ) : (
              <><Wand2 className="w-3.5 h-3.5" /> AI生成角色</>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { resetForm(); setShowAdd(true); }} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> 添加
          </Button>
        </div>
      </div>

      {/* Streaming display */}
      {isGenerating && generatingTarget === 'characters' && streamingContent && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span className="text-sm text-amber-300">正在生成角色...</span>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto font-mono">
              {streamingContent}
            </pre>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="flex-1">
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <User className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg mb-1">还没有角色</p>
            <p className="text-sm">使用AI一键生成或手动添加角色</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {characters.map((char) => (
              <Card key={char.id} className="group hover:border-primary/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-600/30 flex items-center justify-center border border-amber-500/20">
                        <span className="text-lg font-bold text-amber-300">{char.name[0]}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{char.name}</h3>
                        {char.role && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${roleColors[char.role] || 'bg-muted text-muted-foreground border-border'}`}>
                            {char.role}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(char)} className="p-1.5 hover:bg-accent rounded">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCharacter(char.id)} className="p-1.5 hover:bg-destructive/20 rounded">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>

                  {char.personality && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{char.personality}</p>
                  )}
                  {char.description && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-3">{char.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd || !!editingChar} onOpenChange={(open) => { if (!open) { setShowAdd(false); setEditingChar(null); } }}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingChar ? '编辑角色' : '添加角色'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">角色名 *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="输入角色名" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">角色定位</label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue placeholder="选择角色定位" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="主角">主角</SelectItem>
                    <SelectItem value="女主">女主</SelectItem>
                    <SelectItem value="配角">配角</SelectItem>
                    <SelectItem value="反派">反派</SelectItem>
                    <SelectItem value="导师">导师</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">性格特征</label>
              <Textarea value={form.personality} onChange={(e) => setForm({ ...form, personality: e.target.value })} placeholder="描述角色的性格特点..." rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">外貌描写</label>
              <Textarea value={form.appearance} onChange={(e) => setForm({ ...form, appearance: e.target.value })} placeholder="描述角色的外貌特征..." rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">背景故事</label>
              <Textarea value={form.background} onChange={(e) => setForm({ ...form, background: e.target.value })} placeholder="描述角色的背景经历..." rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">详细描述</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="角色能力、目标、内心冲突等..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowAdd(false); setEditingChar(null); }}>取消</Button>
            <Button onClick={editingChar ? handleUpdate : handleAdd} disabled={!form.name.trim()}>
              {editingChar ? '保存修改' : '添加角色'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
