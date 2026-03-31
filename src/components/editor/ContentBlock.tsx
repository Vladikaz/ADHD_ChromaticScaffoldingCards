import { motion } from 'framer-motion';
import type { ContentBlock as ContentBlockType, TextSegment } from '@/lib/semanticParser';
import { calculatePadding } from '@/lib/semanticParser';
import { BACKGROUNDS } from '@/lib/semanticColors';

interface ContentBlockProps {
  block: ContentBlockType;
  themeOverride?: 'yellow' | 'blue' | 'lavender';
}

function getBgClass(type: string): string {
  switch (type) {
    case 'yellow': return 'semantic-block-yellow';
    case 'blue': return 'semantic-block-blue';
    case 'lavender': return 'semantic-block-lavender';
    default: return 'semantic-block-blue';
  }
}

function getBlockIcon(type: ContentBlockType['type']): string {
  switch (type) {
    case 'wordlist': return '📝';
    case 'question': return '❓';
    case 'instruction': return '👉';
    case 'paragraph': return '📖';
  }
}

function getBlockLabel(type: ContentBlockType['type']): string {
  switch (type) {
    case 'wordlist': return 'Memory List';
    case 'question': return 'Question';
    case 'instruction': return 'Action';
    case 'paragraph': return 'Reading';
  }
}

function renderSegment(seg: TextSegment, idx: number) {
  if (seg.style === 'bracket-highlight') {
    return <span key={idx} className="semantic-highlight-red">{seg.text}</span>;
  }
  if (seg.style === 'green-action') {
    return <span key={idx} className="semantic-text-green font-semibold">{seg.text}</span>;
  }
  return <span key={idx}>{seg.text}</span>;
}

export default function ContentBlockCard({ block, themeOverride }: ContentBlockProps) {
  const bgKey = themeOverride || (block.type === 'wordlist' ? 'yellow' : block.type === 'paragraph' ? 'blue' : 'lavender');
  const padding = calculatePadding(block.raw.length);
  const isQuestion = block.type === 'question';
  const isInstruction = block.type === 'instruction';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`semantic-block ${getBgClass(bgKey)} relative overflow-hidden`}
      style={{ padding: `${padding}px ${padding + 8}px` }}
    >
      {/* Subtle decorative corner */}
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-[0.07] rounded-bl-[80px]"
        style={{ backgroundColor: `hsl(var(--semantic-${isQuestion || isInstruction ? 'green' : 'red'}))` }}
      />

      {/* Type badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{getBlockIcon(block.type)}</span>
        <span
          className="text-xs font-semibold uppercase tracking-widest opacity-60 semantic-text-charcoal"
        >
          {getBlockLabel(block.type)}
        </span>
      </div>

      {/* Content */}
      <div
        className={`text-base leading-relaxed semantic-text-charcoal ${
          isQuestion || isInstruction ? 'semantic-text-green' : ''
        }`}
        style={{ fontSize: block.type === 'wordlist' ? '1.1rem' : '1rem' }}
      >
        {block.type === 'wordlist' ? (
          <div className="flex flex-wrap gap-3">
            {block.raw.split(/[,\n]/).filter(w => w.trim()).map((word, i) => (
              <span
                key={i}
                className="inline-block px-4 py-2 rounded-full bg-white/40 semantic-text-charcoal font-medium text-sm"
              >
                {word.trim().includes('[') ?
                  parseInlineSegments(word.trim()).map((seg, j) => renderSegment(seg, j)) :
                  word.trim()
                }
              </span>
            ))}
          </div>
        ) : (
          <p className="whitespace-pre-wrap">
            {block.segments.map((seg, i) => renderSegment(seg, i))}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Quick inline bracket parser for word list items
function parseInlineSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /\[([^\]]+)\]/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index), style: 'normal' });
    segments.push({ text: match[1], style: 'bracket-highlight' });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), style: 'normal' });
  return segments;
}
