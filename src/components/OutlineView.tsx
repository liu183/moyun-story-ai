'use client';

import { useEffect, useRef } from 'react';
import { useNovelStore } from '@/store/novelStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, List } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function OutlineView() {
  const {
    currentNovel, isGenerating, generatingTarget, streamingText,
    generateOutline,
  } = useNovelStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  const displayText = generatingTarget === 'outline' && isGenerating
    ? streamingText
    : null;

  useEffect(() => {
    if (generatingTarget === 'outline' && isGenerating && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamingText, generatingTarget, isGenerating]);

  if (!currentNovel) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">请先选择或创建一部小说</p>
      </div>
    );
  }

  const hasArchitecture = !!currentNovel.architecture;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">故事大纲</h2>
          <p className="text-sm text-muted-foreground">
            为《{currentNovel.title}》规划详细的故事发展
          </p>
        </div>
        <Button
          onClick={generateOutline}
          disabled={isGenerating || !hasArchitecture}
          className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          {isGenerating ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 生成中...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> AI生成大纲</>
          )}
        </Button>
      </div>

      {!hasArchitecture && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <List className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200">请先生成故事架构，再基于架构生成大纲</p>
          </CardContent>
        </Card>
      )}

      {(displayText || (!isGenerating && hasArchitecture)) && (
        <Card className="flex-1">
          <CardContent className="p-0 h-full">
            <ScrollArea className="h-full" ref={scrollRef}>
              <div className="p-6">
                <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90">
                  <ReactMarkdown>{displayText || '请点击"AI生成大纲"按钮生成大纲。'}</ReactMarkdown>
                  {isGenerating && generatingTarget === 'outline' && (
                    <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse ml-0.5" />
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {!displayText && !isGenerating && !hasArchitecture && (
        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
          <List className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg mb-1">还没有故事大纲</p>
          <p className="text-sm">先完成故事架构，再生成详细大纲</p>
        </div>
      )}
    </div>
  );
}
