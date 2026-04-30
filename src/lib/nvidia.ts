const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';

const FALLBACK_MODELS = [
  'nvidia/llama-3.3-nemotron-super-49b-v1.5',
  'deepseek-ai/deepseek-r1',
  'deepseek-ai/deepseek-v4-pro',
  'qwen/qwen3-235b-a22b',
  'mistralai/mistral-large-3-675b-instruct-2512',
  'meta/llama-3.1-405b-instruct',
  'google/gemma-3-27b-it',
];

let currentModelIndex = 0;

// All available models on NVIDIA NIM platform, grouped by provider
export const AVAILABLE_MODELS = [
  // NVIDIA - Nemotron series (recommended for Chinese content)
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1.5', name: 'Nemotron Super 49B', group: 'NVIDIA' },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', group: 'NVIDIA' },
  { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', name: 'Nemotron Ultra 253B', group: 'NVIDIA' },
  { id: 'nvidia/llama-3.2-nemotron-ultra-2-104b-v1', name: 'Nemotron Ultra 104B v2', group: 'NVIDIA' },
  { id: 'nvidia/nemotron-4-340b-instruct', name: 'Nemotron 4 340B', group: 'NVIDIA' },
  // DeepSeek
  { id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1', group: 'DeepSeek' },
  { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro', group: 'DeepSeek' },
  { id: 'deepseek-ai/deepseek-v3.2-0324', name: 'DeepSeek V3.2', group: 'DeepSeek' },
  { id: 'deepseek-ai/deepseek-coder-6.7b-instruct', name: 'DeepSeek Coder 6.7B', group: 'DeepSeek' },
  // Qwen
  { id: 'qwen/qwen3-235b-a22b', name: 'Qwen3 235B', group: 'Qwen' },
  { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', group: 'Qwen' },
  { id: 'qwen/qwen2.5-coder-32b-instruct', name: 'Qwen2.5 Coder 32B', group: 'Qwen' },
  { id: 'qwen/qwen3-coder-480b-a35b-instruct', name: 'Qwen3 Coder 480B', group: 'Qwen' },
  // Mistral
  { id: 'mistralai/mistral-large-3-675b-instruct-2512', name: 'Mistral Large 675B', group: 'Mistral' },
  { id: 'mistralai/mixtral-8x22b-instruct-v0.1', name: 'Mixtral 8x22B', group: 'Mistral' },
  { id: 'mistralai/devstral-2-123b-instruct-2512', name: 'Devstral 123B', group: 'Mistral' },
  { id: 'mistralai/magistral-3b-2506', name: 'Magistral 3B', group: 'Mistral' },
  // Meta Llama
  { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', group: 'Meta' },
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', group: 'Meta' },
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', group: 'Meta' },
  { id: 'meta/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B', group: 'Meta' },
  { id: 'meta/llama4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B', group: 'Meta' },
  // Google
  { id: 'google/gemma-3-27b-it', name: 'Gemma 3 27B', group: 'Google' },
  { id: 'google/gemma-3-12b-it', name: 'Gemma 3 12B', group: 'Google' },
  { id: 'google/gemma-3-4b-it', name: 'Gemma 3 4B', group: 'Google' },
  { id: 'google/codegemma-7b-it', name: 'CodeGemma 7B', group: 'Google' },
  // Microsoft
  { id: 'microsoft/phi-4', name: 'Phi-4', group: 'Microsoft' },
  { id: 'microsoft/phi-4-mini-instruct', name: 'Phi-4 Mini', group: 'Microsoft' },
  { id: 'microsoft/phi-4-multimodal-instruct', name: 'Phi-4 Multimodal', group: 'Microsoft' },
  { id: 'microsoft/phi-3.5-moe-instruct', name: 'Phi-3.5 MoE', group: 'Microsoft' },
  // Moonshot AI
  { id: 'moonshotai/kimi-k2-instruct', name: 'Kimi K2', group: 'Moonshot' },
  // MiniMax
  { id: 'minimax/minimax-m1-80k', name: 'MiniMax M1 80K', group: 'MiniMax' },
  // GLM
  { id: 'z-ai/glm-4.5', name: 'GLM 4.5', group: 'GLM' },
  { id: 'z-ai/glm-4.7', name: 'GLM 4.7', group: 'GLM' },
  { id: 'z-ai/glm-5', name: 'GLM 5', group: 'GLM' },
];

// Context window sizes for each model (in tokens, approximate)
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  // NVIDIA
  'nvidia/llama-3.3-nemotron-super-49b-v1.5': 131072,
  'nvidia/llama-3.1-nemotron-70b-instruct': 131072,
  'nvidia/llama-3.1-nemotron-ultra-253b-v1': 131072,
  'nvidia/llama-3.2-nemotron-ultra-2-104b-v1': 131072,
  'nvidia/nemotron-4-340b-instruct': 4096,
  // DeepSeek
  'deepseek-ai/deepseek-r1': 131072,
  'deepseek-ai/deepseek-v4-pro': 131072,
  'deepseek-ai/deepseek-v3.2-0324': 131072,
  'deepseek-ai/deepseek-coder-6.7b-instruct': 32768,
  // Qwen
  'qwen/qwen3-235b-a22b': 131072,
  'qwen/qwen3-32b': 131072,
  'qwen/qwen2.5-coder-32b-instruct': 131072,
  'qwen/qwen3-coder-480b-a35b-instruct': 131072,
  // Mistral
  'mistralai/mistral-large-3-675b-instruct-2512': 131072,
  'mistralai/mixtral-8x22b-instruct-v0.1': 65536,
  'mistralai/devstral-2-123b-instruct-2512': 131072,
  'mistralai/magistral-3b-2506': 32768,
  // Meta Llama
  'meta/llama-3.1-405b-instruct': 131072,
  'meta/llama-3.3-70b-instruct': 131072,
  'meta/llama-3.1-8b-instruct': 131072,
  'meta/llama-4-maverick-17b-128e-instruct': 131072,
  'meta/llama4-scout-17b-16e-instruct': 131072,
  // Google
  'google/gemma-3-27b-it': 131072,
  'google/gemma-3-12b-it': 131072,
  'google/gemma-3-4b-it': 32768,
  'google/codegemma-7b-it': 8192,
  // Microsoft
  'microsoft/phi-4': 16384,
  'microsoft/phi-4-mini-instruct': 131072,
  'microsoft/phi-4-multimodal-instruct': 16384,
  'microsoft/phi-3.5-moe-instruct': 131072,
  // Moonshot
  'moonshotai/kimi-k2-instruct': 131072,
  // MiniMax
  'minimax/minimax-m1-80k': 81920,
  // GLM
  'z-ai/glm-4.5': 131072,
  'z-ai/glm-4.7': 131072,
  'z-ai/glm-5': 131072,
};

const DEFAULT_CONTEXT_WINDOW = 8192;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000;

export function getCurrentModel(): string {
  return FALLBACK_MODELS[currentModelIndex] || FALLBACK_MODELS[0];
}

export function setModel(modelId: string): void {
  const idx = FALLBACK_MODELS.indexOf(modelId);
  if (idx !== -1) {
    currentModelIndex = idx;
  }
}

function getContextWindow(model: string): number {
  return MODEL_CONTEXT_WINDOWS[model] || DEFAULT_CONTEXT_WINDOW;
}

/**
 * Smart truncation: given a list of text sections with priorities,
 * fit them within the available context window (in characters, ~1.5 chars/token for Chinese).
 * Returns the truncated text sections.
 */
export function smartTruncate(
  model: string,
  maxTokens: number,
  sections: Array<{ text: string; priority: number }>,
): Array<string> {
  const totalWindow = getContextWindow(model);
  // Reserve tokens for output (maxTokens) and system prompt overhead (~500 tokens)
  const availableTokens = totalWindow - maxTokens - 500;
  const availableChars = Math.max(availableTokens * 1.5, 1000);

  // Sort by priority (higher = keep more)
  const sorted = sections
    .map((s, i) => ({ ...s, originalIndex: i }))
    .sort((a, b) => b.priority - a.priority);

  const results: Array<string> = new Array(sections.length).fill('');
  let remainingChars = availableChars;

  for (const section of sorted) {
    if (remainingChars <= 0) {
      results[section.originalIndex] = '';
      continue;
    }
    const truncated = section.text.length > remainingChars
      ? section.text.substring(0, Math.floor(remainingChars))
      : section.text;
    results[section.originalIndex] = truncated;
    remainingChars -= truncated.length;
  }

  return results;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callNvidiaChat(
  messages: Array<{ role: string; content: string }>,
  model: string,
  stream: boolean = false,
  options?: { temperature?: number; maxTokens?: number; topP?: number },
): Promise<Response> {
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 8192,
      top_p: options?.topP ?? undefined,
      stream,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`NVIDIA API error (${res.status}): ${errorText}`);
  }

  return res;
}

export async function chatCompletion(
  messages: Array<{ role: string; content: string }>,
  model?: string,
): Promise<string> {
  const modelToUse = model || getCurrentModel();
  const res = await callNvidiaChat(messages, modelToUse, false);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function streamChat(
  messages: Array<{ role: string; content: string }>,
  onChunk: (chunk: string) => void,
  onDone: (fullText: string) => void,
  onError: (error: Error) => void,
  model?: string,
  options?: { temperature?: number; maxTokens?: number; topP?: number },
): Promise<void> {
  const modelsToTry = model
    ? [model]
    : FALLBACK_MODELS.slice(currentModelIndex).concat(
        FALLBACK_MODELS.slice(0, currentModelIndex),
      );

  for (const m of modelsToTry) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await callNvidiaChat(messages, m, true, options);
        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error('无法获取响应流');
        }

        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                onChunk(delta);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        onDone(fullText);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const status = (error as any)?.status || 0;

        // Don't retry on auth errors or bad requests
        if (status === 401 || status === 400 || status === 403) {
          console.error(`Model ${m} auth/error:`, error);
          break;
        }

        // Exponential backoff for rate limits and server errors
        if (attempt < MAX_RETRIES - 1) {
          const delay = RETRY_BASE_DELAY * Math.pow(2, attempt) + Math.random() * 500;
          console.warn(`Model ${m} attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`);
          await sleep(delay);
        }
      }
    }

    // Model exhausted all retries, try next model
    console.error(`Model ${m} failed after ${MAX_RETRIES} attempts:`, lastError?.message);
    if (m === modelsToTry[modelsToTry.length - 1]) {
      onError(lastError || new Error('所有模型均生成失败'));
    }
  }
}

export function buildSSEStream(
  messages: Array<{ role: string; content: string }>,
  model?: string,
  options?: { temperature?: number; maxTokens?: number; topP?: number },
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      await streamChat(
        messages,
        (chunk) => {
          const data = JSON.stringify({ type: 'chunk', content: chunk });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        },
        (fullText) => {
          const data = JSON.stringify({ type: 'done', content: fullText });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.close();
        },
        (error) => {
          const data = JSON.stringify({ type: 'error', content: error.message });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.close();
        },
        model,
        options,
      );
    },
  });
}
