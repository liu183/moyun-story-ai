'use client';

import { useNovelStore } from '@/store/novelStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Cpu, Settings2 } from 'lucide-react';
import { useEffect } from 'react';

const MODEL_NAMES: Record<string, string> = {
  'nvidia/llama-3.3-nemotron-super-49b-v1.5': 'Nemotron Super 49B',
  'nvidia/llama-3.1-nemotron-70b-instruct': 'Nemotron 70B',
  'nvidia/llama-3.1-nemotron-ultra-253b-v1': 'Nemotron Ultra 253B',
  'nvidia/nemotron-4-340b-instruct': 'Nemotron 4 340B',
  'nvidia/llama-3.2-nemotron-ultra-2-104b-v1': 'Nemotron Ultra 104B',
  'nvidia/llama3-70b-instruct': 'Llama3 70B',
  'nvidia/llama3-8b-instruct': 'Llama3 8B',
};

const MAX_TOKEN_OPTIONS = [
  { value: 2048, label: '2K' },
  { value: 4096, label: '4K' },
  { value: 8192, label: '8K' },
  { value: 12288, label: '12K' },
  { value: 16384, label: '16K' },
];

export default function ModelConfig() {
  const {
    models, selectedModel, loadModels, setSelectedModel,
    temperature, maxTokens, topP,
    setTemperature, setMaxTokens, setTopP,
  } = useNovelStore();

  useEffect(() => {
    if (models.length === 0) {
      loadModels();
    }
  }, [loadModels, models.length]);

  const displayName = (modelId: string) => MODEL_NAMES[modelId] || modelId.split('/').pop() || modelId;

  return (
    <div className="flex items-center gap-2">
      <Cpu className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedModel} onValueChange={setSelectedModel}>
        <SelectTrigger className="w-52 h-8 text-xs bg-transparent border-border">
          <SelectValue placeholder="选择AI模型" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {models.map((modelId) => (
            <SelectItem key={modelId} value={modelId} className="text-xs">
              {displayName(modelId)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="参数设置">
            <Settings2 className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-card border-border" side="bottom" align="end">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">AI参数设置</h4>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">创意度 (Temperature)</label>
                <span className="text-xs font-mono text-amber-400">{temperature.toFixed(1)}</span>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={(v) => setTemperature(v[0])}
                min={0.1}
                max={1.5}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>严谨 0.1</span>
                <span>创意 1.5</span>
              </div>
            </div>

            {/* Top P */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">核采样 (Top P)</label>
                <span className="text-xs font-mono text-amber-400">{topP.toFixed(2)}</span>
              </div>
              <Slider
                value={[topP]}
                onValueChange={(v) => setTopP(v[0])}
                min={0.1}
                max={1.0}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>聚焦 0.1</span>
                <span>多样 1.0</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">最大生成长度 (Max Tokens)</label>
                <span className="text-xs font-mono text-amber-400">{maxTokens}</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {MAX_TOKEN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMaxTokens(opt.value)}
                    className={`text-[10px] px-1.5 py-1 rounded border transition-colors ${
                      maxTokens === opt.value
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'border-border text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
