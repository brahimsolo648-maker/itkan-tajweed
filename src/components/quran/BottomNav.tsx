import { Book, BookOpen, Settings } from 'lucide-react';

export type ViewType = 'mushaf' | 'tajweed' | 'settings';

interface BottomNavProps {
  visible: boolean;
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

const navItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: 'mushaf', label: 'المصحف', icon: Book },
  { id: 'tajweed', label: 'التجويد', icon: BookOpen },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export function BottomNav({ visible, currentView, onChangeView }: BottomNavProps) {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 fade-transition ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-full pointer-events-none'
      }`}
    >
      <div className="bg-primary/95 backdrop-blur-sm text-primary-foreground flex justify-around items-center py-1 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChangeView(id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
              currentView === id
                ? 'text-accent'
                : 'text-primary-foreground/70 hover:text-primary-foreground'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-amiri">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
