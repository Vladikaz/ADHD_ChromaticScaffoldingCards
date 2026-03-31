import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
// toPng/jsPDF removed — per-slide export now lives in SlideCard
import { parseCardJson, type GeneratedCard } from '@/lib/cardTypes';
import { saveProject, loadProjects, deleteProject, createNewProject, type SavedProject } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';
import InputPanel from '@/components/editor/InputPanel';
import DynamicCard from '@/components/editor/DynamicCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderOpen, Plus, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function Index() {
  const [project, setProject] = useState<SavedProject>(createNewProject);
  const [showDashboard, setShowDashboard] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  // previewRef removed — per-slide export in SlideCard

  // Auto-save
  useEffect(() => {
    if (project.cardData) {
      const timeout = setTimeout(() => saveProject(project), 500);
      return () => clearTimeout(timeout);
    }
  }, [project]);

  const updateProject = useCallback((partial: Partial<SavedProject>) => {
    setProject(prev => ({ ...prev, ...partial, updatedAt: Date.now() }));
  }, []);

  const handleNew = () => {
    setProject(createNewProject());
    setShowDashboard(false);
  };

  const handleLoad = (p: SavedProject) => {
    setProject(p);
    setShowDashboard(false);
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setSavedProjects(loadProjects());
  };

  const handleOpenDashboard = () => {
    setSavedProjects(loadProjects());
    setShowDashboard(true);
  };

  const handleGenerate = async (topic: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { topic },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Try structured JSON first, fall back to parsing raw content
      let card: GeneratedCard | null = data?.cardJson || null;
      if (!card && data?.content) {
        card = parseCardJson(data.content);
      }

      if (card) {
        updateProject({ cardData: card, title: card.title || topic, content: data?.content || '' });
        toast.success('Card generated!');
      } else {
        toast.error('Failed to parse generated card. Please try again.');
      }
    } catch (e) {
      console.error('Generation error:', e);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export handlers removed — per-slide download now in SlideCard

  if (showDashboard) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your Projects</h1>
              <p className="text-muted-foreground mt-1">Load or create a new card</p>
            </div>
            <Button onClick={handleNew} className="rounded-full gap-2">
              <Plus className="w-4 h-4" /> New Project
            </Button>
          </div>

          {savedProjects.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No saved projects yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProjects.map(p => (
                <motion.div
                  key={p.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-card rounded-[24px] border border-border p-5 cursor-pointer group"
                  onClick={() => handleLoad(p)}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-foreground truncate">{p.title || 'Untitled'}</h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {p.cardData?.subtitle || p.content?.slice(0, 100) || 'Empty project'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          <Button variant="ghost" onClick={() => setShowDashboard(false)} className="mt-6 rounded-full">
            ← Back to Editor
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="bg-foreground text-background px-6 py-2 flex items-center justify-between text-xs tracking-wide">
        <span className="font-semibold">ADHD Chromatic Scaffolding – Card Generator</span>
        <span className="text-background/70">Vladimir Kazantsev &nbsp;|&nbsp; v1.1</span>
      </div>

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleOpenDashboard} className="rounded-full gap-1.5">
            <FolderOpen className="w-4 h-4" /> Projects
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Input panel */}
        <div className="lg:w-[400px] xl:w-[440px] flex-shrink-0 border-r border-border p-5 overflow-y-auto">
          <InputPanel
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {/* Preview panel */}
        <div className="flex-1 p-5 overflow-y-auto bg-secondary/30">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Preview
            </h2>
          </div>
          <ScrollArea className="h-[calc(100vh-160px)]">
            <div className="max-w-2xl mx-auto">
              {project.cardData ? (
                <DynamicCard card={project.cardData} />
              ) : (
                <div className="flex items-center justify-center h-[60vh]">
                  <div className="text-center opacity-40 space-y-3">
                    <div className="text-6xl">✨</div>
                    <p className="text-lg text-muted-foreground font-medium">
                      Your card will appear here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Enter a topic and click Generate
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
