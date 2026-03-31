// Semantic Parser: Analyzes raw text and segments into typed content blocks

export type BlockType = 'wordlist' | 'question' | 'instruction' | 'paragraph';

export interface ContentBlock {
  id: string;
  type: BlockType;
  raw: string;
  segments: TextSegment[];
}

export interface TextSegment {
  text: string;
  style: 'normal' | 'bracket-highlight' | 'green-action';
}

const IMPERATIVE_VERBS = [
  'translate', 'choose', 'match', 'select', 'complete', 'fill',
  'write', 'read', 'listen', 'find', 'circle', 'underline',
  'describe', 'explain', 'compare', 'list', 'name', 'define',
  'identify', 'sort', 'group', 'connect', 'draw', 'label',
  'answer', 'ask', 'check', 'correct', 'rewrite', 'copy',
];

let blockIdCounter = 0;

function generateId(): string {
  return `block-${Date.now()}-${blockIdCounter++}`;
}

function parseSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const bracketRegex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = bracketRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), style: 'normal' });
    }
    segments.push({ text: match[1], style: 'bracket-highlight' });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), style: 'normal' });
  }

  return segments.length > 0 ? segments : [{ text, style: 'normal' }];
}

function classifyBlock(text: string): BlockType {
  const trimmed = text.trim();

  // Questions: lines ending with ?
  if (trimmed.endsWith('?')) return 'question';

  // Instructions: starts with imperative verb
  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
  if (IMPERATIVE_VERBS.includes(firstWord)) return 'instruction';

  // Word lists: comma-separated short items, or short lines with commas
  const commaCount = (trimmed.match(/,/g) || []).length;
  const words = trimmed.split(/\s+/).length;
  if (commaCount >= 2 && words < 30) return 'wordlist';

  // Short items separated by newlines (each <4 words) = word list
  const lines = trimmed.split('\n').filter(l => l.trim());
  if (lines.length >= 3 && lines.every(l => l.trim().split(/\s+/).length <= 4)) return 'wordlist';

  // Long paragraphs (>20 words)
  if (words > 20) return 'paragraph';

  // Default to paragraph for short text
  return 'paragraph';
}

export function parseContent(rawText: string): ContentBlock[] {
  if (!rawText.trim()) return [];

  // Split by double newlines to get logical blocks
  const rawBlocks = rawText.split(/\n\s*\n/).filter(b => b.trim());

  // If only one block, try splitting by single newlines for varied content
  let blocks: string[];
  if (rawBlocks.length === 1) {
    const lines = rawText.split('\n').filter(l => l.trim());
    // Group consecutive lines of the same type
    blocks = groupLines(lines);
  } else {
    blocks = rawBlocks;
  }

  return blocks.map(block => ({
    id: generateId(),
    type: classifyBlock(block),
    raw: block.trim(),
    segments: parseSegments(block.trim()),
  }));
}

function groupLines(lines: string[]): string[] {
  if (lines.length <= 1) return lines;

  const groups: string[] = [];
  let current: string[] = [lines[0]];
  let currentType = classifyBlock(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    const lineType = classifyBlock(lines[i]);
    if (lineType === currentType && lineType === 'paragraph') {
      current.push(lines[i]);
    } else {
      groups.push(current.join('\n'));
      current = [lines[i]];
      currentType = lineType;
    }
  }
  groups.push(current.join('\n'));

  return groups;
}

// ADHD Safety: calculate dynamic padding based on text volume
export function calculatePadding(textLength: number): number {
  const base = 32;
  const extra = Math.min(Math.floor(textLength / 50) * 4, 32);
  return base + extra;
}

// ADHD Safety: check red budget (<10% surface)
export function checkRedBudget(segments: TextSegment[]): boolean {
  const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0);
  const redChars = segments
    .filter(s => s.style === 'bracket-highlight')
    .reduce((sum, s) => sum + s.text.length, 0);
  return totalChars > 0 ? (redChars / totalChars) < 0.1 : true;
}
