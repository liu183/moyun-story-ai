'use client';

import { useEffect } from 'react';
import { useNovelStore, type TabType } from '@/store/novelStore';
import Sidebar from '@/components/Sidebar';
import ArchitectureView from '@/components/ArchitectureView';
import CharacterManager from '@/components/CharacterManager';
import WorldView from '@/components/WorldView';
import OutlineView from '@/components/OutlineView';
import ChapterManager from '@/components/ChapterManager';
import NovelSettings from '@/components/NovelSettings';
import ModelConfig from '@/components/ModelConfig';
import {
  BookOpen, Users, Globe, List, FileText, Settings,
  Sparkles, Book,
} from 'lucide-react';

const tabs: { value: TabType; label: string; icon: React.ReactNode }[] = [
  { value: 'architecture', label: '架构', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'characters', label: '角色', icon: <Users className="w-4 h-4" /> },
  { value: 'worldview', label: '世界观', icon: <Globe className="w-4 h-4" /> },
  { value: 'outline', label: '大纲', icon: <List className="w-4 h-4" /> },
  { value: 'chapters', label: '章节', icon: <FileText className="w-4 h-4" /> },
  { value: 'settings', label: '设置', icon: <Settings className="w-4 h-4" /> },
];

export default function Home() {
  const { currentNovel, activeTab, setActiveTab, loadNovels } = useNovelStore();

  useEffect(() => {
    loadNovels();
  }, [loadNovels]);

  const renderContent = () => {
    switch (activeTab) {
      case 'architecture': return <ArchitectureView />;
      case 'characters': return <CharacterManager />;
      case 'worldview': return <WorldView />;
      case 'outline': return <OutlineView />;
      case 'chapters': return <ChapterManager />;
      case 'settings': return <NovelSettings />;
      default: return <ArchitectureView />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {currentNovel ? (
          <>
            {/* Tab navigation */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
              <div className="px-6 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                          activeTab === tab.value
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ModelConfig />
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">AI驱动</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 p-6">
              {renderContent()}
            </div>
          </>
        ) : (
          /* Welcome screen */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                <Book className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-3">欢迎来到墨韵AI</h1>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                AI驱动的网文创作平台，从故事架构到章节内容，全程AI辅助创作。
                选择一部小说开始创作，或创建一部全新的作品。
              </p>
              <div className="grid grid-cols-2 gap-3 text-left text-sm">
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <Sparkles className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="font-medium">AI生成架构</p>
                  <p className="text-xs text-muted-foreground mt-1">一键构建完整故事框架</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <Users className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="font-medium">角色设计</p>
                  <p className="text-xs text-muted-foreground mt-1">AI生成立体丰富的角色</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <List className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="font-medium">大纲规划</p>
                  <p className="text-xs text-muted-foreground mt-1">智能生成详细故事大纲</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <FileText className="w-5 h-5 text-amber-400 mb-2" />
                  <p className="font-medium">章节创作</p>
                  <p className="text-xs text-muted-foreground mt-1">AI撰写高质量章节内容</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
