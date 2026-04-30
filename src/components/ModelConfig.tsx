'use client';

import { useNovelStore } from '@/store/novelStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Cpu } from 'lucide-react';
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

export default function ModelConfig() {
  const { models, selectedModel, loadModels, setSelectedModel } = useNovelStore();

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
        <SelectTrigger className="w-56 h-8 text-xs bg-transparent border-border">
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
    </div>
  );
}
