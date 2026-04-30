const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';

const FALLBACK_MODELS = [
  'nvidia/llama-3.3-nemotron-super-49b-v1.5',
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'nvidia/llama-3.1-nemotron-ultra-253b-v1',
  'nvidia/nemotron-4-340b-instruct',
  'nvidia/llama-3.2-nemotron-ultra-2-104b-v1',
  'nvidia/llama3-70b-instruct',
  'nvidia/llama3-8b-instruct',
];

let currentModelIndex = 0;

export const AVAILABLE_MODELS = [
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1.5', name: 'Llama 3.3 Nemotron Super 49B' },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Llama 3.1 Nemotron 70B' },
  { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', name: 'Llama 3.1 Nemotron Ultra 253B' },
  { id: 'nvidia/nemotron-4-340b-instruct', name: 'Nemotron 4 340B' },
  { id: 'nvidia/llama-3.2-nemotron-ultra-2-104b-v1', name: 'Llama 3.2 Nemotron Ultra 104B' },
  { id: 'nvidia/llama3-70b-instruct', name: 'Llama3 70B' },
  { id: 'nvidia/llama3-8b-instruct', name: 'Llama3 8B' },
];

// Context window sizes for each model (in tokens, approximate)
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  'nvidia/llama-3.3-nemotron-super-49b-v1.5': 131072,
  'nvidia/llama-3.1-nemotron-70b-instruct': 131072,
  'nvidia/llama-3.1-nemotron-ultra-253b-v1': 131072,
  'nvidia/nemotron-4-340b-instruct': 4096,
  'nvidia/llama-3.2-nemotron-ultra-2-104b-v1': 131072,
  'nvidia/llama3-70b-instruct': 8192,
  'nvidia/llama3-8b-instruct': 8192,
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
