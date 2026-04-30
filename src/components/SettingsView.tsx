'use client';

import { useNovelStore } from '@/store/novelStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Settings, Save, BookOpen, Hash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsView() {
  const { currentNovel, updateNovel } = useNovelStore();

  const [title, setTitle] = useState(currentNovel?.title || '');
  const [genre, setGenre] = useState(currentNovel?.genre || '');
  const [description, setDescription] = useState(currentNovel?.description || '');
  const [targetWordCount, setTargetWordCount] = useState(
    currentNovel?.targetWordCount?.toString() || ''
  );

  if (!currentNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Settings className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>请先在左侧选择或创建一个小说</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    await updateNovel(currentNovel.id, {
      title: title.trim() || currentNovel.title,
      genre: genre.trim() || null,
      description: description.trim() || null,
      targetWordCount: targetWordCount ? parseInt(targetWordCount) : null,
    });
    toast.success('设置已保存');
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold">小说设置</h2>
          <p className="text-sm text-muted-foreground mt-0.5">基本信息和参数配置</p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          className="bg-amber-600/90 hover:bg-amber-600 text-white"
        >
          <Save className="h-4 w-4 mr-1.5" />
          保存
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          <Card className="border-border bg-muted/20">
            <CardContent className="p-6 space-y-5">
              <div>
                <Label className="flex items-center gap-2 mb-1.5">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  作品标题
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请输入作品标题"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-1.5">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  作品类型
                </Label>
                <Input
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="如：玄幻、都市、仙侠、科幻..."
                />
              </div>

              <div>
                <Label className="mb-1.5 block">作品简介</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简要描述你的故事创意..."
                  rows={4}
                />
              </div>

              <Separator />

              <div>
                <Label className="flex items-center gap-2 mb-1.5">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  目标章节数
                </Label>
                <Input
                  type="number"
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(e.target.value)}
                  placeholder="如：30"
                  className="w-48"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  用于大纲生成时参考的章节数量
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted/20">
            <CardContent className="p-6">
              <h3 className="font-medium mb-3">创作信息</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>创建时间</span>
                  <span>{new Date(currentNovel.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>最后更新</span>
                  <span>{new Date(currentNovel.updatedAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
