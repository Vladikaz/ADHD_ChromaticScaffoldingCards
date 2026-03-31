import { useRef, useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CardSection } from '@/lib/cardTypes';

// Fixed resolution — the slide always renders at this size
const SLIDE_W = 1024;
const SLIDE_H = 768;

interface SlideCardProps {
  section: CardSection;
  index: number;
  title?: string;
  subtitle?: string;
  titleColor?: string;
  isFirst?: boolean;
  totalSlides: number;
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
    case 'sm': return 'text-[24px] leading-relaxed';
    case 'lg': return 'text-[40px] leading-snug';
    default: return 'text-[28px] leading-relaxed';
  }
}

function safeString(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.join('\n');
  return String(content ?? '');
}

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
        className="font-bold px-2 py-1 rounded-lg inline-block"
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

/* ── Arrow / Transformation layout ── */
function renderArrow(section: CardSection) {
  const content = safeString(section.content);
  const lines = content.split('\n').filter(l => l.trim());

  // Detect arrow separator: →, ->, =>, ➡, ⟶, ➜, >>
  const arrowRegex = /^(.+?)\s*(?:→|->|=>|➡|⟶|➜|>>)\s*(.+)$/;

  return (
    <div className="flex flex-col gap-5">
      {lines.map((line, i) => {
        const arrowMatch = line.match(arrowRegex);
        if (arrowMatch) {
          return (
            <div key={i} className="flex items-center gap-5">
              <span
                className="px-6 py-4 rounded-2xl font-medium text-[24px] shadow-sm text-center flex-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: section.textColor }}
              >
                {renderText(arrowMatch[1].trim(), section.highlightColor)}
              </span>
              <svg width="56" height="28" viewBox="0 0 56 28" fill="none" className="flex-shrink-0">
                <path d="M0 14H46M46 14L37 5M46 14L37 23" stroke={section.textColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
              </svg>
              <span
                className="px-6 py-4 rounded-2xl font-medium text-[24px] shadow-sm text-center flex-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: section.textColor }}
              >
                {renderText(arrowMatch[2].trim(), section.highlightColor)}
              </span>
            </div>
          );
        }
        return (
          <div key={i} className="text-[24px] leading-relaxed">
            {renderText(line, section.highlightColor)}
          </div>
        );
      })}
    </div>
  );
}

/* ── Table layout ── */
function renderTable(section: CardSection) {
  const content = safeString(section.content);
  const lines = content.split('\n').filter(l => l.trim());
  // Skip markdown separator lines like "---|---|---"
  const dataLines = lines.filter(l => !/^[\s|:-]+$/.test(l));
  const rows = dataLines.map(line => line.split(/\s*[|\t]\s*/).filter(c => c.trim()));
  if (rows.length === 0) return null;

  // Normalize column count to the max across all rows
  const maxCols = Math.max(...rows.map(r => r.length));
  const normalizedRows = rows.map(row => {
    while (row.length < maxCols) row.push('');
    return row.slice(0, maxCols);
  });

  const cleanCell = (c: string) => c.replace(/^\*\*|\*\*$/g, '').trim();

  return (
    <div className="overflow-hidden rounded-2xl shadow-sm" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
      <table className="w-full border-collapse">
        {normalizedRows.length > 0 && (
          <thead>
            <tr>
              {normalizedRows[0].map((cell, ci) => (
                <th
                  key={ci}
                  className="text-left px-6 py-4 text-[20px] font-bold uppercase tracking-wide border-b"
                  style={{
                    color: section.textColor,
                    borderColor: `${section.textColor}20`,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }}
                >
                  {renderText(cleanCell(cell), section.highlightColor)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {normalizedRows.slice(1).map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-6 py-4 text-[24px] border-b"
                  style={{
                    color: section.textColor,
                    borderColor: `${section.textColor}10`,
                  }}
                >
                  {renderText(cleanCell(cell), section.highlightColor)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Scheme / flow layout ── */
function renderScheme(section: CardSection) {
  const content = safeString(section.content);
  const lines = content.split('\n').filter(l => l.trim());

  return (
    <div className="flex flex-col items-center gap-3">
      {lines.map((line, i) => {
        const isConnector = /^(↓|↑|→|←|⬇|⬆|➡|⬅|\||▼|▶)$/.test(line.trim());
        if (isConnector) {
          return (
            <svg key={i} width="28" height="36" viewBox="0 0 28 36" fill="none" className="flex-shrink-0">
              <path d="M14 0V28M14 28L7 21M14 28L21 21" stroke={section.textColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
            </svg>
          );
        }
        return (
          <div
            key={i}
            className="px-8 py-4 rounded-2xl font-medium text-[24px] shadow-sm text-center w-full max-w-[600px]"
            style={{ backgroundColor: 'rgba(255,255,255,0.45)', color: section.textColor }}
          >
            {renderText(line, section.highlightColor)}
          </div>
        );
      })}
    </div>
  );
}

function renderContent(section: CardSection) {
  const content = safeString(section.content);
  if (!content.trim()) return null;
  const lines = content.split('\n').filter(l => l.trim());

  switch (section.layout) {
    case 'arrow':
      return renderArrow(section);

    case 'table':
      return renderTable(section);

    case 'scheme':
      return renderScheme(section);

    case 'chips':
      return (
        <div className="flex flex-wrap gap-4">
          {lines.flatMap(l => l.split(/[,;]/).filter(w => w.trim())).map((word, i) => (
            <span
              key={i}
              className="inline-block px-7 py-4 rounded-2xl font-medium text-[24px] shadow-sm"
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
        <ol className="space-y-5">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-5 items-start">
              <span
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-bold shadow-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: section.textColor }}
              >
                {i + 1}
              </span>
              <span className="leading-relaxed pt-2 text-[24px]">{renderText(line.replace(/^\d+[.)]\s*/, ''), section.highlightColor)}</span>
            </li>
          ))}
        </ol>
      );

    case 'bullets':
      return (
        <ul className="space-y-5">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-5 items-start">
              <span className="flex-shrink-0 w-3 h-3 rounded-full mt-3 opacity-50" style={{ backgroundColor: section.textColor }} />
              <span className="leading-relaxed text-[24px]">{renderText(line.replace(/^[-•]\s*/, ''), section.highlightColor)}</span>
            </li>
          ))}
        </ul>
      );

    case 'example':
      return (
        <div className="space-y-4 pl-7 border-l-4 border-current/10">
          {lines.map((line, i) => (
            <p key={i} className="italic leading-relaxed text-[24px] opacity-90">
              {renderText(line, section.highlightColor)}
            </p>
          ))}
        </div>
      );

    default:
      return (
        <div className="leading-relaxed whitespace-pre-wrap text-[24px]">
          {renderText(content, section.highlightColor)}
        </div>
      );
  }
}

export default function SlideCard({ section, index, title, subtitle, titleColor, isFirst, totalSlides }: SlideCardProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const content = safeString(section.content);
  const hasContent = content.trim().length > 0;
  const hasLabel = !!(section.label || section.icon);
  const shouldRender = hasContent || hasLabel || (isFirst && !!title);

  // Compute scale to fit container
  useEffect(() => {
    if (!shouldRender) return;
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setScale(containerWidth / SLIDE_W);
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [shouldRender]);

  const handleDownload = useCallback(async () => {
    if (!slideRef.current) return;

    const node = slideRef.current;
    const prevTransform = node.style.transform;
    const prevTransformOrigin = node.style.transformOrigin;

    try {
      // Export at native slide resolution without preview scaling
      node.style.transform = 'scale(1)';
      node.style.transformOrigin = 'top left';

      const dataUrl = await toPng(node, {
        quality: 1,
        pixelRatio: 1,
        width: SLIDE_W,
        height: SLIDE_H,
        canvasWidth: SLIDE_W,
        canvasHeight: SLIDE_H,
        backgroundColor: section.bgColor,
      });

      const link = document.createElement('a');
      link.download = `slide-${index + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Slide export failed:', e);
    } finally {
      node.style.transform = prevTransform;
      node.style.transformOrigin = prevTransformOrigin;
    }
  }, [index, section.bgColor]);

  if (!shouldRender) return null;

  return (
    <div className="relative group">
      <div ref={containerRef} className="w-full" style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: '24px' }}>
        <div
          ref={slideRef}
          style={{
            width: SLIDE_W,
            height: SLIDE_H,
            backgroundColor: section.bgColor,
            padding: '56px 64px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {isFirst && title && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10"
            >
              <h1
                className="text-[44px] font-bold font-['DM_Serif_Display',serif] leading-tight"
                style={{ color: titleColor || '#2C3340' }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-[22px] mt-3 opacity-60" style={{ color: titleColor || '#2C3340' }}>
                  {subtitle}
                </p>
              )}
            </motion.div>
          )}

          {hasLabel && (
            <div className="flex items-center gap-3 mb-6">
              {section.icon && <span className="text-[26px]">{section.icon}</span>}
              {section.label && (
                <span
                  className="text-[16px] font-semibold uppercase tracking-[0.15em] opacity-70"
                  style={{ color: section.textColor }}
                >
                  {section.label}
                </span>
              )}
            </div>
          )}

          {hasContent && (
            <div
              className={`${getFontClass(section.fontStyle)} ${getSizeClass(section.fontSize)} flex-1 flex items-center`}
              style={{ color: section.textColor, overflow: 'hidden' }}
            >
              <div className="w-full">{renderContent(section)}</div>
            </div>
          )}

          <div className="absolute bottom-6 right-8 text-[14px] font-medium opacity-30" style={{ color: section.textColor }}>
            {index + 1} / {totalSlides}
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="absolute top-3 right-3 rounded-full gap-1.5 text-xs h-8 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 backdrop-blur-sm shadow-md"
      >
        <Download className="w-3.5 h-3.5" />
        PNG
      </Button>
    </div>
  );
}
