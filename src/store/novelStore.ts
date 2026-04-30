import { create } from 'zustand';

export interface Novel {
  id: string;
  title: string;
  genre: string | null;
  description: string | null;
  targetWordCount: number | null;
  architecture: string | null;
  outline: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    chapters: number;
    characters: number;
  };
}

export interface Character {
  id: string;
  novelId: string;
  name: string;
  role: string | null;
  description: string | null;
  personality: string | null;
  background: string | null;
  appearance: string | null;
  createdAt: string;
  updatedAt: string;
  relationshipsTo?: CharacterRelationship[];
  relationshipsFrom?: CharacterRelationship[];
}

export interface CharacterRelationship {
  id: string;
  novelId: string;
  fromCharacterId: string;
  toCharacterId: string;
  relationshipType: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorldSetting {
  id: string;
  novelId: string;
  category: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  novelId: string;
  chapterNumber: number;
  title: string;
  outline: string | null;
  content: string | null;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export type TabType = 'architecture' | 'characters' | 'worldview' | 'outline' | 'chapters' | 'settings';

interface NovelStore {
  // Novel data
  currentNovel: Novel | null;
  novels: Novel[];

  // UI state
  activeTab: TabType;
  sidebarOpen: boolean;

  // Generation state
  isGenerating: boolean;
  generatingTarget: string | null;

  // Characters
  characters: Character[];

  // World settings
  worldSettings: WorldSetting[];

  // Chapters
  chapters: Chapter[];
  selectedChapterId: string | null;

  // Streaming content
  streamingContent: string;

  // Available models
  models: string[];
  selectedModel: string;

  // Actions - Novels
  loadNovels: () => Promise<void>;
  createNovel: (data: { title: string; genre?: string; description?: string; targetWordCount?: number }) => Promise<Novel>;
  updateNovel: (id: string, data: Partial<Novel>) => Promise<void>;
  deleteNovel: (id: string) => Promise<void>;
  selectNovel: (novel: Novel) => Promise<void>;
  setActiveTab: (tab: TabType) => void;
  toggleSidebar: () => void;

  // Actions - Architecture
  generateArchitecture: () => Promise<string>;
  saveArchitecture: (text: string) => Promise<void>;

  // Actions - Characters
  loadCharacters: () => Promise<void>;
  addCharacter: (data: Partial<Character>) => Promise<Character>;
  updateCharacter: (id: string, data: Partial<Character>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  generateCharacters: () => Promise<Character[]>;

  // Actions - World Settings
  loadWorldSettings: () => Promise<void>;
  addWorldSetting: (data: { category: string; name: string; description?: string }) => Promise<WorldSetting>;
  updateWorldSetting: (id: string, data: Partial<WorldSetting>) => Promise<void>;
  deleteWorldSetting: (id: string) => Promise<void>;

  // Actions - Relationships
  relationships: CharacterRelationship[];
  loadRelationships: () => Promise<void>;
  addRelationship: (data: { fromCharacterId: string; toCharacterId: string; relationshipType: string; description?: string }) => Promise<CharacterRelationship>;
  updateRelationship: (id: string, data: Partial<CharacterRelationship>) => Promise<void>;
  deleteRelationship: (id: string) => Promise<void>;

  // Actions - Outline
  generateOutline: (chapterCount?: number) => Promise<string>;

  // Actions - Chapters
  loadChapters: () => Promise<void>;
  addChapter: (data: { title: string; outline?: string; chapterNumber?: number }) => Promise<Chapter>;
  updateChapter: (id: string, data: Partial<Chapter>) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  generateChapter: (chapterId: string) => Promise<string>;
  selectChapter: (chapterId: string | null) => void;
  reorderChapters: (chapters: { id: string; chapterNumber: number }[]) => Promise<void>;

  // Actions - Models
  loadModels: () => Promise<void>;
  setSelectedModel: (model: string) => void;

  // Actions - Streaming
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  clearStreamingContent: () => void;
  setIsGenerating: (val: boolean) => void;
}

async function streamFetch(url: string, body: any, onChunk: (chunk: string) => void): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || '请求失败');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法获取响应流');

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

      try {
        const json = JSON.parse(trimmed.slice(6));
        if (json.type === 'chunk' && json.content) {
          fullText += json.content;
          onChunk(json.content);
        } else if (json.type === 'error') {
          throw new Error(json.message || json.content || '生成失败');
        }
      } catch (e) {
        if (e instanceof Error && e.message !== '生成失败' && e.message !== '请求失败') {
          // Skip malformed JSON
        } else {
          throw e;
        }
      }
    }
  }

  return fullText;
}

export const useNovelStore = create<NovelStore>((set, get) => ({
  // Initial state
  currentNovel: null,
  novels: [],
  activeTab: 'architecture',
  sidebarOpen: true,
  isGenerating: false,
  generatingTarget: null,
  characters: [],
  worldSettings: [],
  chapters: [],
  selectedChapterId: null,
  streamingContent: '',
  models: [],
  selectedModel: '',
  relationships: [],

  // Novel actions
  loadNovels: async () => {
    const res = await fetch('/api/novels');
    const data = await res.json();
    set({ novels: data });
  },

  createNovel: async (data) => {
    const res = await fetch('/api/novels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const novel = await res.json();
    await get().loadNovels();
    return novel;
  },

  updateNovel: async (id, data) => {
    await fetch(`/api/novels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (get().currentNovel?.id === id) {
      set({ currentNovel: { ...get().currentNovel!, ...data } });
    }
    await get().loadNovels();
  },

  deleteNovel: async (id) => {
    await fetch(`/api/novels/${id}`, { method: 'DELETE' });
    if (get().currentNovel?.id === id) {
      set({ currentNovel: null, characters: [], chapters: [], worldSettings: [] });
    }
    await get().loadNovels();
  },

  selectNovel: async (novel) => {
    set({ currentNovel: novel, activeTab: 'architecture' });
    // Load related data
    try {
      const res = await fetch(`/api/novels/${novel.id}`);
      const data = await res.json();
      set({
        currentNovel: data,
        characters: data.characters || [],
        chapters: data.chapters || [],
        worldSettings: data.worldSettings || [],
        relationships: data.characterRelationships || [],
      });
    } catch {
      // Keep the basic novel data
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab, selectedChapterId: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Architecture
  generateArchitecture: async () => {
    const { currentNovel } = get();
    if (!currentNovel) throw new Error('请先选择一个小说');

    set({ isGenerating: true, generatingTarget: 'architecture', streamingContent: '' });

    try {
      const text = await streamFetch(
        `/api/novels/${currentNovel.id}/architecture`,
        {
          action: 'generate',
          model: get().selectedModel || undefined,
        },
        (chunk) => {
          set((s) => ({ streamingContent: s.streamingContent + chunk }));
        }
      );

      // Refresh novel from DB to get the auto-saved architecture
      const res = await fetch(`/api/novels/${currentNovel.id}`);
      const novel = await res.json();
      set({
        isGenerating: false,
        generatingTarget: null,
        currentNovel: novel,
      });

      return text;
    } catch (error) {
      set({ isGenerating: false, generatingTarget: null });
      throw error;
    }
  },

  saveArchitecture: async (text) => {
    const { currentNovel } = get();
    if (!currentNovel) return;

    await get().updateNovel(currentNovel.id, { architecture: text });
    set({ currentNovel: { ...currentNovel, architecture: text } });
  },

  // Characters
  loadCharacters: async () => {
    const { currentNovel } = get();
    if (!currentNovel) return;

    const res = await fetch(`/api/novels/${currentNovel.id}/characters`);
    const data = await res.json();
    set({ characters: data });
  },

  addCharacter: async (data) => {
    const { currentNovel } = get();
    if (!currentNovel) throw new Error('请先选择一个小说');

    const res = await fetch(`/api/novels/${currentNovel.id}/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const character = await res.json();
    set((s) => ({ characters: [...s.characters, character] }));
    return character;
  },

  updateCharacter: async (id, data) => {
    const { currentNovel } = get();
    if (!currentNovel) return;

    await fetch(`/api/novels/${currentNovel.id}/characters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    set((s) => ({
      characters: s.characters.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  },

  deleteCharacter: async (id) => {
    const { currentNovel } = get();
    if (!currentNovel) return;

    await fetch(`/api/novels/${currentNovel.id}/characters/${id}`, { method: 'DELETE' });
    set((s) => ({ characters: s.characters.filter((c) => c.id !== id) }));
  },

  generateCharacters: async () => {
    const { currentNovel } = get();
    if (!currentNovel) throw new Error('请先选择一个小说');

    set({ isGenerating: true, generatingTarget: 'characters', streamingContent: '' });

    try {
      // Use streamFetch to handle SSE response
      await streamFetch(
        `/api/novels/${currentNovel.id}/characters`,
        {
          action: 'generate',
          model: get().selectedModel || undefined,
        },
        (chunk) => {
          set((s) => ({ streamingContent: s.streamingContent + chunk }));
        }
      );

      // Reload characters from DB (auto-saved by the API flush handler)
      const res = await fetch(`/api/novels/${currentNovel.id}/characters`);
      const characters = await res.json();
      set({ characters, isGenerating: false, generatingTarget: null });
      return characters;
    } catch (error) {
      set({ isGenerating: false, generatingTarget: null });
      throw error;
    }
  },

  // World Settings
  loadWorldSettings: async () => {
    const { currentNovel } = get();
    if (!currentNovel) return;
    const res = await fetch(`/api/novels/${currentNovel.id}/world-settings`);
    const data = await res.json();
    set({ worldSettings: data });
  },

  addWorldSetting: async (data) => {
    const { currentNovel } = get();
    if (!currentNovel) throw new Error('请先选择一个小说');
    const res = await fetch(`/api/novels/${currentNovel.id}/world-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const setting = await res.json();
    set((s) => ({ worldSettings: [...s.worldSettings, setting] }));
    return setting;
  },

  updateWorldSetting: async (id, data) => {
    const { currentNovel } = get();
    if (!currentNovel) return;
    await fetch(`/api/novels/${currentNovel.id}/world-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settingId: id, ...data }),
    });
    set((s) => ({
      worldSettings: s.worldSettings.map((ws) => (ws.id === id ? { ...ws, ...data } : ws)),
    }));
  },

  deleteWorldSetting: async (id) => {
    const { currentNovel } = get();
    if (!currentNovel) return;
    await fetch(`/api/novels/${currentNovel.id}/world-settings`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settingId: id }),
    });
    set((s) => ({ worldSettings: s.worldSettings.filter((ws) => ws.id !== id) }));
  },

  // Relationships
  loadRelationships: async () => {
    const { currentNovel } = get();
    if (!currentNovel) return;
    const res = await fetch(`/api/novels/${currentNovel.id}/relationships`);
    const data = await res.json();
    set({ relationships: data });
  },

  addRelationship: async (data) => {
    const { currentNovel } = get();
    if (!currentNovel) throw new Error('请先选择一个小说');
    const res = await fetch(`/api/novels/${currentNovel.id}/relationships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const relationship = await res.json();
    set((s) => ({ relationships: [...s.relationships, relationship] }));
    return relationship;
  },

  updateRelationship: async (id, data) => {
    const { currentNovel } = get();
    if (!currentNovel) return;
    await fetch(`/api/novels/${currentNovel.id}/relationships`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relationshipId: id, ...data }),
    });
    set((s) => ({
      relationships: s.relationships.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }));
  },

  deleteRelationship: async (id) => {
    const { currentNovel } = get();
    if (!currentNovel) return;
    await fetch(`/api/novels/${currentNovel.id}/relationships`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relationshipId: id }),
    });
    set((s) => ({ relationships: s.relationships.filter((r) => r.id !== id) }));
  },

  // Outline
  generateOutline: async (chapterCount?: number) => {
    const { currentNovel } = get();
    if (!currentNovel) throw new Error('请先选择一个小说');

    set({ isGenerating: true, generatingTarget: 'outline', streamingContent: '' });

    try {
      const text = await streamFetch(
        `/api/novels/${currentNovel.id}/outline`,
        {
          chapterCount: chapterCount || get().currentNovel?.targetWordCount || 20,
          model: get().selectedModel || undefined,
        },
        (chunk) => {
          set((s) => ({ streamingContent: s.streamingContent + chunk }));
        }
      );

      // Refresh novel from DB to get the auto-saved outline
      const res = await fetch(`/api/novels/${currentNovel.id}`);
      const novel = await res.json();
      set({
        isGenerating: false,
        generatingTarget: null,
        currentNovel: novel,
      });

      return text;
    } catch (error) {
      set({ isGenerating: false, generatingTarget: null });
      throw error;
    }
  },

  // Chapters
  loadChapters: async () => {
    const { currentNovel } = get();
    if (!currentNovel) return;

    const res = await fetch(`/api/novels/${currentNovel.id}/chapters`);
    const data = await res.json();
    set({ chapters: data });
  },

  addChapter: async (data) => {
    const { currentNovel } = get();
    if (!currentNovel) throw new Error('请先选择一个小说');

    const res = await fetch(`/api/novels/${currentNovel.id}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const chapter = await res.json();
    set((s) => ({ chapters: [...s.chapters, chapter] }));
    return chapter;
  },

  updateChapter: async (id, data) => {
    const { currentNovel } = get();
    if (!currentNovel) return;

    await fetch(`/api/novels/${currentNovel.id}/chapters`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId: id, ...data }),
    });

    set((s) => ({
      chapters: s.chapters.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  },

  deleteChapter: async (id) => {
    const { currentNovel } = get();
    if (!currentNovel) return;

    await fetch(`/api/novels/${currentNovel.id}/chapters`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId: id }),
    });
    set((s) => ({
      chapters: s.chapters.filter((c) => c.id !== id),
      selectedChapterId: s.selectedChapterId === id ? null : s.selectedChapterId,
    }));
  },

  generateChapter: async (chapterId) => {
    const { currentNovel } = get();
    if (!currentNovel) throw new Error('请先选择一个小说');

    set({ isGenerating: true, generatingTarget: `chapter-${chapterId}`, streamingContent: '', selectedChapterId: chapterId });

    try {
      const text = await streamFetch(
        `/api/novels/${currentNovel.id}/chapters/${chapterId}/generate`,
        {
          model: get().selectedModel || undefined,
        },
        (chunk) => {
          set((s) => ({ streamingContent: s.streamingContent + chunk }));
        }
      );

      set((s) => ({
        isGenerating: false,
        generatingTarget: null,
        chapters: s.chapters.map((c) =>
          c.id === chapterId ? { ...c, content: text, wordCount: text.length } : c
        ),
      }));

      return text;
    } catch (error) {
      set({ isGenerating: false, generatingTarget: null });
      throw error;
    }
  },

  selectChapter: (chapterId) => set({ selectedChapterId: chapterId }),

  reorderChapters: async (chapters) => {
    const { currentNovel } = get();
    if (!currentNovel) return;

    await fetch(`/api/novels/${currentNovel.id}/chapters`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapters }),
    });

    set((s) => ({
      chapters: s.chapters
        .map((c) => {
          const newOrder = chapters.find((ch) => ch.id === c.id);
          return newOrder ? { ...c, chapterNumber: newOrder.chapterNumber } : c;
        })
        .sort((a, b) => a.chapterNumber - b.chapterNumber),
    }));
  },

  // Models
  loadModels: async () => {
    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      // API returns array of { id, name } objects
      const modelIds = Array.isArray(data)
        ? data.map((m: any) => m.id || m).filter(Boolean)
        : (data.models || []).map((m: any) => m.id || m).filter(Boolean);

      set({ models: modelIds });
      if (!get().selectedModel && modelIds.length > 0) {
        set({ selectedModel: modelIds[0] });
      }
    } catch {
      // Use fallback models
      const fallback = [
        'nvidia/llama-3.3-nemotron-super-49b-v1.5',
        'nvidia/llama-3.1-nemotron-70b-instruct',
      ];
      set({ models: fallback, selectedModel: fallback[0] });
    }
  },

  setSelectedModel: (model) => set({ selectedModel: model }),

  // Streaming helpers
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) => set((s) => ({ streamingContent: s.streamingContent + chunk })),
  clearStreamingContent: () => set({ streamingContent: '' }),
  setIsGenerating: (val) => set({ isGenerating: val }),
}));
