'use client';

import { useNovelStore } from '@/store/novelStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Settings, Save, Check, Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function NovelSettings() {
  const { currentNovel, updateNovel, chapters } = useNovelStore();
  const [title, setTitle] = useState(currentNovel?.title || '');
  const [genre, setGenre] = useState(currentNovel?.genre || '');
  const [description, setDescription] = useState(currentNovel?.description || '');
  const [targetWordCount, setTargetWordCount] = useState(currentNovel?.targetWordCount?.toString() || '');
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!currentNovel) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">请先选择或创建一部小说</p>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateNovel(currentNovel.id, {
        title,
        genre,
        description,
        targetWordCount: targetWordCount ? parseInt(targetWordCount) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success('设置已保存');
    } catch (error) {
      toast.error('保存失败，请重试');
    }
  };

  const handleExportTXT = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/novels/${currentNovel.id}/export`);
      if (!res.ok) throw new Error('导出失败');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentNovel.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('导出成功');
    } catch {
      toast.error('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  const totalChapters = chapters.length || currentNovel._count?.chapters || 0;
  const totalChars = currentNovel._count?.characters || 0;
  const completedChapters = chapters.filter((ch) => ch.content).length;
  const completionPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  const totalWordCount = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold">小说设置</h2>
        <p className="text-sm text-muted-foreground">
          管理《{currentNovel.title}》的基本信息
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{totalChapters}</p>
            <p className="text-xs text-muted-foreground mt-1">章节</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{totalChars}</p>
            <p className="text-xs text-muted-foreground mt-1">角色</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">
              {totalWordCount > 0 ? `${(totalWordCount / 10000).toFixed(1)}万` : '0'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">总字数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{completionPercent}%</p>
            <p className="text-xs text-muted-foreground mt-1">完成度</p>
          </CardContent>
        </Card>
      </div>

      {totalChapters > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">创作进度</span>
              <span className="text-xs">{completedChapters}/{totalChapters} 章已完成</span>
            </div>
            <Progress value={completionPercent} className="h-2" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">导出</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExportTXT}
            disabled={exporting || totalChapters === 0}
            variant="outline"
            className="gap-2 w-full sm:w-auto"
          >
            <Download className="w-4 h-4" />
            {exporting ? '导出中...' : '导出TXT'}
          </Button>
          {totalChapters === 0 && (
            <p className="text-xs text-muted-foreground mt-2">请先创建章节后再导出</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1.5 block">书名</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">类型</Label>
            <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="如：玄幻、都市、科幻..." />
          </div>
          <div>
            <Label className="mb-1.5 block">目标字数</Label>
            <Input
              type="number"
              value={targetWordCount}
              onChange={(e) => setTargetWordCount(e.target.value)}
              placeholder="如：1000000"
            />
          </div>
          <div>
            <Label className="mb-1.5 block">简介</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述你的故事..."
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Button onClick={handleSave} className="gap-1.5">
            {saved ? <><Check className="w-3.5 h-3.5" /> 已保存</> : <><Save className="w-3.5 h-3.5" /> 保存修改</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">创建信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">创建时间</span>
            <span>{new Date(currentNovel.createdAt).toLocaleString('zh-CN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">最后更新</span>
            <span>{new Date(currentNovel.updatedAt).toLocaleString('zh-CN')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
