'use client';

import { useNovelStore } from '@/store/novelStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Settings } from 'lucide-react';

export default function WorldView() {
  const { currentNovel, characters } = useNovelStore();

  if (!currentNovel) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">请先选择或创建一部小说</p>
      </div>
    );
  }

  const mainCharacters = characters.filter(c => c.role === '主角' || c.role === '女主');
  const supportingCharacters = characters.filter(c => c.role !== '主角' && c.role !== '女主');

  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold">世界观</h2>
        <p className="text-sm text-muted-foreground">
          《{currentNovel.title}》的世界观与角色关系
        </p>
      </div>

      {!currentNovel.architecture && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Globe className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200">请先生成故事架构，世界观将基于架构展示</p>
          </CardContent>
        </Card>
      )}

      {characters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">角色阵容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mainCharacters.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">主要角色</p>
                <div className="flex flex-wrap gap-2">
                  {mainCharacters.map(c => (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500/40 to-orange-600/40 flex items-center justify-center">
                        <span className="text-xs font-bold text-amber-300">{c.name[0]}</span>
                      </div>
                      <span className="text-sm">{c.name}</span>
                      {c.role && <Badge variant="outline" className="text-[10px] px-1">{c.role}</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {supportingCharacters.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">其他角色</p>
                <div className="flex flex-wrap gap-2">
                  {supportingCharacters.map(c => (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs">{c.name[0]}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{c.name}</span>
                      {c.role && <Badge variant="outline" className="text-[10px] px-1">{c.role}</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {characters.length === 0 && currentNovel.architecture && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-muted-foreground">
            <Globe className="w-10 h-10 mb-3 opacity-30" />
            <p>请先创建角色，再查看世界观</p>
          </CardContent>
        </Card>
      )}

      {characters.length === 0 && !currentNovel.architecture && (
        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
          <Globe className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg mb-1">世界观概览</p>
          <p className="text-sm">完成故事架构和角色设定后查看</p>
        </div>
      )}
    </div>
  );
}
