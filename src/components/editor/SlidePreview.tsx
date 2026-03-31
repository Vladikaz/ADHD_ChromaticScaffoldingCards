import { motion, AnimatePresence } from 'framer-motion';
import type { ContentBlock } from '@/lib/semanticParser';
import ContentBlockCard from './ContentBlock';

interface SlidePreviewProps {
  blocks: ContentBlock[];
  mode: 'single' | 'multi';
  activeSlide: number;
  onSlideSelect: (index: number) => void;
  themeOverride?: 'yellow' | 'blue' | 'lavender';
}

export default function SlidePreview({ blocks, mode, activeSlide, onSlideSelect, themeOverride }: SlidePreviewProps) {
  if (blocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center opacity-40 space-y-3">
          <div className="text-6xl">✨</div>
          <p className="text-lg text-muted-foreground font-medium">
            Your slides will appear here
          </p>
          <p className="text-sm text-muted-foreground">
            Start typing in the input panel
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'single') {
    return (
      <div className="space-y-5 p-2">
        <AnimatePresence mode="popLayout">
          {blocks.map((block) => (
            <ContentBlockCard key={block.id} block={block} themeOverride={themeOverride} />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // Multi-slide mode
  const currentBlock = blocks[activeSlide];

  return (
    <div className="flex gap-4 h-full">
      {/* Thumbnail sidebar */}
      <div className="w-28 flex-shrink-0 space-y-2 overflow-y-auto pr-1">
        {blocks.map((block, i) => (
          <button
            key={block.id}
            onClick={() => onSlideSelect(i)}
            className={`w-full aspect-[16/10] rounded-2xl border-2 transition-all text-[8px] p-2 overflow-hidden text-left ${
              i === activeSlide
                ? 'border-primary shadow-md scale-105'
                : 'border-border opacity-60 hover:opacity-90'
            }`}
          >
            <div className="text-[7px] font-semibold text-muted-foreground uppercase mb-1">
              {i + 1}
            </div>
            <div className="text-muted-foreground line-clamp-2 leading-tight">
              {block.raw.slice(0, 50)}
            </div>
          </button>
        ))}
      </div>

      {/* Main slide */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {currentBlock && (
            <motion.div
              key={currentBlock.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl"
            >
              <ContentBlockCard block={currentBlock} themeOverride={themeOverride} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
