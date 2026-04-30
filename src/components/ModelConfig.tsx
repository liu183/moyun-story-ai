'use client';

import { useNovelStore } from '@/store/novelStore';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Cpu, Settings2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { AVAILABLE_MODELS } from '@/lib/nvidia';

const MAX_TOKEN_OPTIONS = [
  { value: 2048, label: '2K' },
  { value: 4096, label: '4K' },
  { value: 8192, label: '8K' },
  { value: 12288, label: '12K' },
  { value: 16384, label: '16K' },
];

// Group and sort models for display
function getGroupedModels(models: typeof AVAILABLE_MODELS) {
  const groups = new Map<string, typeof AVAILABLE_MODELS>();
  for (const model of models) {
    const g = model.group || '其他';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(model);
  }
  return groups;
}

export default function ModelConfig() {
  const {
    selectedModel, loadModels, setSelectedModel,
    temperature, maxTokens, topP,
    setTemperature, setMaxTokens, setTopP,
  } = useNovelStore();

  // Initialize models from AVAILABLE_MODELS (client-side)
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const groupedModels = useMemo(() => getGroupedModels(AVAILABLE_MODELS), []);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="flex items-center gap-2">
      <Cpu className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedModel} onValueChange={setSelectedModel}>
        <SelectTrigger className="w-52 h-8 text-xs bg-transparent border-border">
          <SelectValue placeholder="选择AI模型" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border max-h-80">
          {Array.from(groupedModels.entries()).map(([group, models], idx) => (
            <div key={group}>
              {idx > 0 && <SelectSeparator />}
              <SelectGroup>
                <SelectLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group}
                </SelectLabel>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate max-w-[160px]">{model.name}</span>
                      <span className="text-[9px] text-muted-foreground/60 shrink-0">
                        {model.id.split('/').pop()}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </div>
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

            {/* Current model info */}
            {currentModel && (
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
                当前模型：<span className="font-medium text-foreground">{currentModel.name}</span>
                <span className="text-muted-foreground/60 ml-1">({currentModel.group})</span>
              </div>
            )}

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
