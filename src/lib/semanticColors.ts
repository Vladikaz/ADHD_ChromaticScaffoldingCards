// Semantic Color Engine — ADHD-Optimized (Corrected Color Theory)
// 
// PRINCIPLES:
// - Green & Blue: calming, sedative → primary backgrounds
// - Purple/Violet: calm & serenity, emotional control → backgrounds & accents
// - Soft Yellow: safe for highlights (not intense yellow)
// - Pink: soft alternative to red, neutralizing → safe highlights & accents
// - Orange/Brown: warm, safe alternatives to red → accents
// - Red: ONLY for critical attention / prohibition — very limited use
// - Blue + Yellow together: AVOID (dopaminergic cell regulation issues)
// - Black/White: soften contrast to avoid overstimulation

// Safe background palette (calming)
export const BACKGROUNDS = {
  softGreen: { hsl: '142 40% 92%', hex: '#E0F2E9', label: 'Grounding' },
  softBlue: { hsl: '210 40% 93%', hex: '#E3EDF7', label: 'Focus' },
  lavender: { hsl: '270 35% 93%', hex: '#EDE4F5', label: 'Calm' },
  warmCream: { hsl: '40 40% 95%', hex: '#F7F3EB', label: 'Warm Neutral' },
  softMint: { hsl: '160 30% 93%', hex: '#E2F0EC', label: 'Fresh' },
  white: { hsl: '0 0% 99%', hex: '#FCFCFC', label: 'Clean' },
};

// Safe accent/highlight colors (non-arousing)
export const HIGHLIGHTS = {
  softYellow: { hsl: '48 70% 80%', hex: '#F0DFA0', label: 'Attention' },
  softPink: { hsl: '340 45% 80%', hex: '#E8B4C8', label: 'Gentle Emphasis' },
  warmOrange: { hsl: '25 55% 65%', hex: '#C89060', label: 'Warm Accent' },
  softBrown: { hsl: '30 30% 55%', hex: '#9E8570', label: 'Earth' },
  teal: { hsl: '180 30% 45%', hex: '#507D7D', label: 'Cool Accent' },
};

// Text colors
export const TEXT = {
  dark: { hsl: '220 15% 20%', hex: '#2C3340' },       // Soft dark (not pure black)
  medium: { hsl: '220 10% 40%', hex: '#5C6370' },      // Secondary text
  green: { hsl: '150 35% 30%', hex: '#326B50' },        // Calm action text
  deepBlue: { hsl: '215 40% 30%', hex: '#2E4A6E' },     // Rule/explanation text
  plum: { hsl: '280 25% 35%', hex: '#5E4570' },         // Calm emphasis
};

// Danger/prohibition only (very limited use)
export const DANGER = {
  softRed: { hsl: '0 50% 55%', hex: '#BF5C5C', label: 'Prohibition' },
};

// ADHD Safety: Blue + Yellow combination check
export function isColorSafe(bg: string, accent: string): boolean {
  const isBlue = bg.includes('blue') || bg.includes('Blue');
  const isYellow = accent.includes('yellow') || accent.includes('Yellow');
  if (isBlue && isYellow) return false;
  if (accent.includes('blue') && bg.includes('yellow')) return false;
  return true;
}
