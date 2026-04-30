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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Globe, Plus, Trash2, Edit3, Users, Link2, ChevronDown, ChevronRight,
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  '地理', '势力', '种族', '物品', '修炼', '历史', '规则', '其他',
];

const CATEGORY_COLORS: Record<string, string> = {
  '地理': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  '势力': 'bg-red-500/20 text-red-300 border-red-500/30',
  '种族': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  '物品': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  '修炼': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  '历史': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  '规则': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

export default function WorldView() {
  const {
    currentNovel, characters, worldSettings, relationships,
    addWorldSetting, updateWorldSetting, deleteWorldSetting,
    addRelationship, deleteRelationship, loadRelationships,
  } = useNovelStore();

  const [showAddSetting, setShowAddSetting] = useState(false);
  const [editingSetting, setEditingSetting] = useState<any>(null);
  const [settingForm, setSettingForm] = useState({ category: '', name: '', description: '' });
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [relationForm, setRelationForm] = useState({ fromCharacterId: '', toCharacterId: '', relationshipType: '', description: '' });
  const [showRelations, setShowRelations] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const resetSettingForm = () => setSettingForm({ category: '', name: '', description: '' });
  const resetRelationForm = () => setRelationForm({ fromCharacterId: '', toCharacterId: '', relationshipType: '', description: '' });

  const handleAddSetting = async () => {
    if (!settingForm.category || !settingForm.name.trim()) return;
    await addWorldSetting(settingForm);
    resetSettingForm();
    setShowAddSetting(false);
  };

  const handleUpdateSetting = async () => {
    if (!editingSetting || !settingForm.name.trim()) return;
    await updateWorldSetting(editingSetting.id, settingForm);
    resetSettingForm();
    setEditingSetting(null);
  };

  const handleAddRelation = async () => {
    if (!relationForm.fromCharacterId || !relationForm.toCharacterId || !relationForm.relationshipType.trim()) return;
    if (relationForm.fromCharacterId === relationForm.toCharacterId) return;
    await addRelationship(relationForm);
    resetRelationForm();
    setShowAddRelation(false);
    loadRelationships();
  };

  const groupedSettings = worldSettings.reduce<Record<string, typeof worldSettings>>((acc, ws) => {
    const cat = ws.category || '其他';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ws);
    return acc;
  }, {});

  const categoryEntries = Object.entries(groupedSettings);

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
          <h2 className="text-xl font-bold">世界观设定</h2>
          <p className="text-sm text-muted-foreground">
            《{currentNovel.title}》的世界观与角色关系
          </p>
        </div>
        <div className="flex items-center gap-2">
          {characters.length >= 2 && (
            <Button variant="outline" size="sm" onClick={() => { resetRelationForm(); setShowAddRelation(true); }} className="gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> 添加关系
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => { resetSettingForm(); setShowAddSetting(true); }} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> 添加设定
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Character Relationships */}
        {relationships.length > 0 && (
          <Card className="mb-4">
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => setShowRelations(!showRelations)}
            >
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  角色关系
                  <Badge variant="outline" className="text-[10px]">{relationships.length}</Badge>
                </span>
                {showRelations ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {showRelations && (
              <CardContent className="space-y-2">
                {relationships.map((rel: any) => (
                  <div key={rel.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30 group">
                    <Badge variant="outline" className="text-xs shrink-0">{rel.fromCharacter?.name || '?'}</Badge>
                    <span className="text-amber-400 font-medium text-xs px-2">{rel.relationshipType}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{rel.toCharacter?.name || '?'}</Badge>
                    {rel.description && (
                      <span className="text-xs text-muted-foreground truncate ml-1">{rel.description}</span>
                    )}
                    <button
                      onClick={() => deleteRelationship(rel.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded ml-auto shrink-0"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        )}

        {/* Character roster */}
        {characters.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">角色阵容</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {characters.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/40 to-orange-600/40 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-300">{c.name[0]}</span>
                    </div>
                    <span className="text-sm">{c.name}</span>
                    {c.role && <Badge variant="outline" className="text-[10px] px-1">{c.role}</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* World Settings grouped by category */}
        {categoryEntries.length > 0 ? (
          categoryEntries.map(([category, settings]) => (
            <Card key={category} className="mb-4">
              <CardHeader
                className="pb-3 cursor-pointer"
                onClick={() => setActiveCategory(activeCategory === category ? null : category)}
              >
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[category] || 'bg-muted text-muted-foreground border-border'}`}>
                      {category}
                    </span>
                    {settings.length}项
                  </span>
                  {activeCategory === category ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </CardTitle>
              </CardHeader>
              {activeCategory !== category ? (
                <CardContent className="pt-0 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {settings.map((ws) => (
                      <Badge key={ws.id} variant="outline" className="text-xs">{ws.name}</Badge>
                    ))}
                  </div>
                </CardContent>
              ) : (
                <CardContent className="space-y-3">
                  {settings.map((ws) => (
                    <div key={ws.id} className="p-3 rounded-lg bg-muted/20 group">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{ws.name}</h4>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => {
                            setSettingForm({ category: ws.category, name: ws.name, description: ws.description || '' });
                            setEditingSetting(ws);
                          }} className="p-1 hover:bg-accent rounded">
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button onClick={() => deleteWorldSetting(ws.id)} className="p-1 hover:bg-destructive/20 rounded">
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </div>
                      {ws.description && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{ws.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Globe className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg mb-1">还没有世界观设定</p>
            <p className="text-sm">添加地理、势力、种族等设定来丰富你的世界</p>
          </div>
        )}
      </ScrollArea>

      {/* Add/Edit World Setting Dialog */}
      <Dialog open={showAddSetting || !!editingSetting} onOpenChange={(open) => { if (!open) { setShowAddSetting(false); setEditingSetting(null); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingSetting ? '编辑设定' : '添加世界观设定'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">分类 *</label>
                <Select value={settingForm.category} onValueChange={(v) => setSettingForm({ ...settingForm, category: v })}>
                  <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">名称 *</label>
                <Input value={settingForm.name} onChange={(e) => setSettingForm({ ...settingForm, name: e.target.value })} placeholder="如：天剑宗" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">描述</label>
              <Textarea value={settingForm.description} onChange={(e) => setSettingForm({ ...settingForm, description: e.target.value })} placeholder="详细描述这个设定..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowAddSetting(false); setEditingSetting(null); }}>取消</Button>
            <Button onClick={editingSetting ? handleUpdateSetting : handleAddSetting} disabled={!settingForm.category || !settingForm.name.trim()}>
              {editingSetting ? '保存修改' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Relationship Dialog */}
      <Dialog open={showAddRelation} onOpenChange={setShowAddRelation}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>添加角色关系</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">角色A *</label>
                <Select value={relationForm.fromCharacterId} onValueChange={(v) => setRelationForm({ ...relationForm, fromCharacterId: v })}>
                  <SelectTrigger><SelectValue placeholder="选择角色" /></SelectTrigger>
                  <SelectContent>
                    {characters.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}（{c.role || '角色'}）</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">角色B *</label>
                <Select value={relationForm.toCharacterId} onValueChange={(v) => setRelationForm({ ...relationForm, toCharacterId: v })}>
                  <SelectTrigger><SelectValue placeholder="选择角色" /></SelectTrigger>
                  <SelectContent>
                    {characters.filter((c) => c.id !== relationForm.fromCharacterId).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}（{c.role || '角色'}）</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">关系类型 *</label>
              <Input value={relationForm.relationshipType} onChange={(e) => setRelationForm({ ...relationForm, relationshipType: e.target.value })} placeholder="如：师徒、恋人、仇敌..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">关系描述</label>
              <Textarea value={relationForm.description} onChange={(e) => setRelationForm({ ...relationForm, description: e.target.value })} placeholder="描述这种关系的特点..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddRelation(false)}>取消</Button>
            <Button onClick={handleAddRelation} disabled={!relationForm.fromCharacterId || !relationForm.toCharacterId || !relationForm.relationshipType.trim()}>
              添加关系
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
