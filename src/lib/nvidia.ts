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

export function getCurrentModel(): string {
  return FALLBACK_MODELS[currentModelIndex] || FALLBACK_MODELS[0];
}

export function setModel(modelId: string): void {
  const idx = FALLBACK_MODELS.indexOf(modelId);
  if (idx !== -1) {
    currentModelIndex = idx;
  }
}

async function callNvidiaChat(
  messages: Array<{ role: string; content: string }>,
  model: string,
  stream: boolean = false,
  options?: { temperature?: number; maxTokens?: number },
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
  options?: { temperature?: number; maxTokens?: number },
): Promise<void> {
  const modelsToTry = model
    ? [model]
    : FALLBACK_MODELS.slice(currentModelIndex).concat(
        FALLBACK_MODELS.slice(0, currentModelIndex),
      );

  for (const m of modelsToTry) {
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
      console.error(`Model ${m} failed:`, error);
      if (m === modelsToTry[modelsToTry.length - 1]) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
}

export function buildSSEStream(
  messages: Array<{ role: string; content: string }>,
  model?: string,
  options?: { temperature?: number; maxTokens?: number },
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
