import { motion } from 'framer-motion';
import type { GeneratedCard, CardSection } from '@/lib/cardTypes';
import SlideCard from './SlideCard';

interface DynamicCardProps {
  card: GeneratedCard;
}

function getFontClass(fontStyle?: string) {
  switch (fontStyle) {
    case 'serif': return "font-['DM_Serif_Display',serif]";
    case 'italic': return 'italic';
    default: return '';
  }
}

function getSizeClass(fontSize?: string) {
  switch (fontSize) {
    case 'sm': return 'text-sm';
    case 'lg': return 'text-lg';
    default: return 'text-base';
  }
}

// Parse [brackets] into highlighted spans
function renderText(text: string, highlightColor?: string) {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={idx++}>{text.slice(last, match.index)}</span>);
    }
    parts.push(
      <span
        key={idx++}
        className="font-bold px-1.5 py-0.5 rounded-md inline-block"
        style={{
          backgroundColor: highlightColor || '#F0DFA0',
          color: 'inherit',
        }}
      >
        {match[1]}
      </span>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(<span key={idx++}>{text.slice(last)}</span>);
  }
  return parts.length ? parts : [text];
}

function renderContent(section: CardSection) {
  const content = typeof section.content === 'string' ? section.content : String(section.content ?? '');
  const lines = content.split('\n').filter(l => l.trim());

  switch (section.layout) {
    case 'chips':
      return (
        <div className="flex flex-wrap gap-3">
          {lines.flatMap(l => l.split(/[,;]/).filter(w => w.trim())).map((word, i) => (
            <span
              key={i}
              className="inline-block px-5 py-2.5 rounded-2xl font-medium text-sm shadow-sm"
              style={{
                backgroundColor: 'rgba(255,255,255,0.5)',
                color: section.textColor,
              }}
            >
              {renderText(word.trim(), section.highlightColor)}
            </span>
          ))}
        </div>
      );

    case 'numbered':
      return (
        <ol className="space-y-3">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: section.textColor }}
              >
                {i + 1}
              </span>
              <span className="leading-relaxed pt-1">{renderText(line.replace(/^\d+[.)]\s*/, ''), section.highlightColor)}</span>
            </li>
          ))}
        </ol>
      );

    case 'bullets':
      return (
        <ul className="space-y-3">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-2 h-2 rounded-full mt-2.5 opacity-50" style={{ backgroundColor: section.textColor }} />
              <span className="leading-relaxed">{renderText(line.replace(/^[-•]\s*/, ''), section.highlightColor)}</span>
            </li>
          ))}
        </ul>
      );

    case 'example':
      return (
        <div className="space-y-2 pl-5 border-l-3 border-current/10">
          {lines.map((line, i) => (
            <p key={i} className="italic leading-relaxed opacity-90">
              {renderText(line, section.highlightColor)}
            </p>
          ))}
        </div>
      );

    default: // paragraph
      return (
        <div className="leading-relaxed whitespace-pre-wrap">
          {renderText(content, section.highlightColor)}
        </div>
      );
  }
}

function SectionCard({ section, index }: { section: CardSection; index: number }) {
  const padding = Math.min(28 + Math.floor(section.content.length / 60) * 3, 52);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden"
      style={{
        backgroundColor: section.bgColor,
        borderRadius: '28px',
        padding: `${padding}px ${padding + 12}px`,
      }}
    >
      {/* Section header */}
      {(section.icon || section.label) && (
        <div className="flex items-center gap-2.5 mb-4">
          {section.icon && <span className="text-base">{section.icon}</span>}
          {section.label && (
            <span
              className="text-xs font-semibold uppercase tracking-[0.15em] opacity-70"
              style={{ color: section.textColor }}
            >
              {section.label}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div
        className={`${getFontClass(section.fontStyle)} ${getSizeClass(section.fontSize)}`}
        style={{ color: section.textColor }}
      >
        {renderContent(section)}
      </div>
    </motion.div>
  );
}

export default function DynamicCard({ card }: DynamicCardProps) {
  return (
    <div className="space-y-6">
      {card.sections.map((section, i) => (
        <SlideCard
          key={i}
          section={section}
          index={i}
          title={card.title}
          subtitle={card.subtitle}
          titleColor={card.titleColor}
          isFirst={i === 0}
          totalSlides={card.sections.length}
        />
      ))}
    </div>
  );
}
