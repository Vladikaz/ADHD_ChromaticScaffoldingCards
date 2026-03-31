import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

interface InputPanelProps {
  onGenerate: (topic: string) => Promise<void>;
  isGenerating: boolean;
}

const EXAMPLE_TOPICS = [
  'Past Simple',
  'Articles a/an/the',
  'Irregular Verbs',
  'Present Continuous',
  'Comparatives & Superlatives',
  'Modal Verbs',
];

export default function InputPanel({ onGenerate, isGenerating }: InputPanelProps) {
  const [topic, setTopic] = useState('');

  const handleGenerate = async () => {
    const t = topic.trim();
    if (!t) return;
    await onGenerate(t);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* AI Generation */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Generate a Card
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4 px-1">
          Enter any educational topic and AI will design a complete, ADHD-friendly card with the right colors, layout, and highlights.
        </p>
        <div className="flex flex-col gap-2">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="e.g. past simple, irregular verbs..."
            className="flex-1 rounded-2xl border-2 border-border bg-card text-foreground px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-y min-h-[60px] max-h-[200px]"
            disabled={isGenerating}
            rows={2}
          />
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="rounded-full gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </div>

      {/* Example Topics */}
      <div>
        <p className="text-xs text-muted-foreground mb-3 px-1 uppercase tracking-wider font-semibold">
          Try these topics
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => { setTopic(t); }}
              disabled={isGenerating}
              className="px-4 py-2 rounded-full border border-border bg-card text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-auto px-1">
        <div className="rounded-[24px] bg-secondary/50 p-5 text-xs text-muted-foreground space-y-2.5">
          <p className="font-semibold text-foreground/70">🧠 Cognitive-Friendly Design</p>
          <p>
            This app creates beautiful educational cards using color palettes backed by cognitive science — designed specifically for how ADHD brains process visual information.
          </p>
          <p className="opacity-70">
            Colors, typography, and layout are chosen according to "Cognitive Color Filter Theory: Proposed Chromatic Scaffolding Approach to Neuroinclusive Educational Design" by Vladimir Kazantsev.
          </p>
        </div>
      </div>
    </div>
  );
}
