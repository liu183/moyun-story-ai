'use client';

import { useState, useEffect, useRef } from 'react';
import { useNovelStore } from '@/store/novelStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Save, Edit3, Loader2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ArchitectureView() {
  const {
    currentNovel, isGenerating, generatingTarget, streamingText,
    generateArchitecture, saveArchitecture,
  } = useNovelStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayText = generatingTarget === 'architecture' && isGenerating
    ? streamingText
    : currentNovel?.architecture || '';

  useEffect(() => {
    if (generatingTarget === 'architecture' && isGenerating && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamingText, generatingTarget, isGenerating]);

  const handleSave = async () => {
    await saveArchitecture(editText);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setEditText(currentNovel?.architecture || '');
    setIsEditing(true);
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
          <h2 className="text-xl font-bold">故事架构</h2>
          <p className="text-sm text-muted-foreground">
            为《{currentNovel.title}》构建完整的故事框架
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-1.5">
                <Save className="w-3.5 h-3.5" /> 保存
              </Button>
            </>
          )}
          {!isEditing && currentNovel.architecture && (
            <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1.5">
              <Edit3 className="w-3.5 h-3.5" /> 编辑
            </Button>
          )}
          <Button
            onClick={generateArchitecture}
            disabled={isGenerating}
            className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            {isGenerating ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 生成中...</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> AI生成架构</>
            )}
          </Button>
        </div>
      </div>

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
                  <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground">
                    <ReactMarkdown>{displayText}</ReactMarkdown>
                    {isGenerating && generatingTarget === 'architecture' && (
                      <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse ml-0.5" />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-lg mb-1">还没有故事架构</p>
                    <p className="text-sm">点击上方"AI生成架构"按钮，AI将为你构建完整的故事框架</p>
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
