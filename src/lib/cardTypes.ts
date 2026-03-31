// Dynamic card structure — AI decides everything per topic

export interface CardSection {
  icon?: string;
  label?: string;
  content: string;
  bgColor: string;           // CSS color value or token name
  textColor: string;         // CSS color value or token name
  highlightColor?: string;   // For [bracketed] text
  layout: 'paragraph' | 'chips' | 'numbered' | 'bullets' | 'example' | 'table' | 'arrow' | 'scheme';
  fontStyle?: 'normal' | 'italic' | 'serif';
  fontSize?: 'sm' | 'base' | 'lg';
}

export interface GeneratedCard {
  title: string;
  subtitle?: string;
  titleColor?: string;
  bgColor?: string;          // Overall card background
  sections: CardSection[];
}

export function parseCardJson(raw: string): GeneratedCard | null {
  try {
    // Strip markdown fences
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
    let cleaned = (jsonMatch[1] || raw).trim();
    // Remove trailing commas before } or ]
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    // Remove control characters except newlines
    cleaned = cleaned.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '');
    
    const parsed = JSON.parse(cleaned);
    
    if (!parsed.title || !Array.isArray(parsed.sections)) return null;
    
    parsed.sections = parsed.sections
      .map((s: any) => ({
        icon: s.icon || '',
        label: s.label || '',
        content: typeof s.content === 'string' ? s.content : Array.isArray(s.content) ? s.content.join('\n') : String(s.content ?? ''),
        bgColor: s.bgColor || '#E3EDF7',
        textColor: s.textColor || '#2C3340',
        highlightColor: s.highlightColor || '#F0DFA0',
        layout: ['paragraph', 'chips', 'numbered', 'bullets', 'example', 'table', 'arrow', 'scheme'].includes(s.layout) ? s.layout : 'paragraph',
        fontStyle: s.fontStyle || 'normal',
        fontSize: s.fontSize || 'base',
      }))
      // Filter out sections with no meaningful content
      .filter((s: CardSection) => {
        const text = s.content.trim();
        return text.length > 0 || s.label || s.icon;
      });
    
    return parsed as GeneratedCard;
  } catch (e) {
    console.error('Failed to parse card JSON:', e);
    return null;
  }
}
