import { Button } from '@/components/ui/button';
import { Layers, CreditCard, Sun, Droplets, Flower2, Download, FileText } from 'lucide-react';

interface ToolbarProps {
  mode: 'single' | 'multi';
  onModeChange: (mode: 'single' | 'multi') => void;
  themeOverride?: 'yellow' | 'blue' | 'lavender';
  onThemeChange: (theme?: 'yellow' | 'blue' | 'lavender') => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  hasContent: boolean;
}

const themes = [
  { key: undefined as undefined, icon: Sun, label: 'Auto', color: '' },
  { key: 'yellow' as const, icon: Sun, label: 'Memory', color: 'bg-[hsl(54,100%,88%)]' },
  { key: 'blue' as const, icon: Droplets, label: 'Focus', color: 'bg-[hsl(199,100%,94%)]' },
  { key: 'lavender' as const, icon: Flower2, label: 'Action', color: 'bg-[hsl(291,100%,95%)]' },
];

export default function Toolbar({
  mode, onModeChange, themeOverride, onThemeChange, onExportPng, onExportPdf, hasContent,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
        <Button
          variant={mode === 'single' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('single')}
          className="rounded-full gap-1.5 text-xs h-8"
        >
          <CreditCard className="w-3.5 h-3.5" />
          Single Card
        </Button>
        <Button
          variant={mode === 'multi' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('multi')}
          className="rounded-full gap-1.5 text-xs h-8"
        >
          <Layers className="w-3.5 h-3.5" />
          Multi-Slide
        </Button>
      </div>

      {/* Theme override */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Theme:</span>
        {themes.map((t) => (
          <button
            key={t.label}
            onClick={() => onThemeChange(t.key)}
            className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
              themeOverride === t.key || (!themeOverride && !t.key)
                ? 'border-primary scale-110 shadow-sm'
                : 'border-transparent opacity-50 hover:opacity-80'
            } ${t.color || 'bg-secondary'}`}
            title={t.label}
          >
            <t.icon className="w-3 h-3 text-foreground/70" />
          </button>
        ))}
      </div>

      {/* Export */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPng}
          disabled={!hasContent}
          className="rounded-full gap-1.5 text-xs h-8"
        >
          <Download className="w-3.5 h-3.5" />
          PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPdf}
          disabled={!hasContent}
          className="rounded-full gap-1.5 text-xs h-8"
        >
          <FileText className="w-3.5 h-3.5" />
          PDF
        </Button>
      </div>
    </div>
  );
}
