import { toArabicNumeral, type QuranData } from '@/lib/quran-api';
import { BookOpen, Moon, Sun } from 'lucide-react';

interface AppHeaderProps {
  visible: boolean;
  surahName: string;
  juz: number;
  page: number;
  darkMode: boolean;
  learningMode: boolean;
  onToggleDark: () => void;
  onToggleLearning: () => void;
}

export function AppHeader({
  visible,
  surahName,
  juz,
  page,
  darkMode,
  learningMode,
  onToggleDark,
  onToggleLearning,
}: AppHeaderProps) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 fade-transition ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      <div className="bg-primary/95 backdrop-blur-sm text-primary-foreground px-4 py-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDark}
            className="p-1.5 rounded-full hover:bg-primary-foreground/10 transition-colors"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={onToggleLearning}
            className={`p-1.5 rounded-full transition-colors ${
              learningMode
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-primary-foreground/10'
            }`}
            title="وضع التعلم"
          >
            <BookOpen size={18} />
          </button>
        </div>

        <div className="text-center font-amiri">
          <div className="text-sm font-bold">{surahName}</div>
          <div className="text-xs opacity-80">
            الجزء {toArabicNumeral(juz)} | صفحة {toArabicNumeral(page)}
          </div>
        </div>

        <div className="w-16" />
      </div>
    </header>
  );
}
