import { Ayah } from '@/lib/quran-api';
import { Mic, Volume2, EyeOff, BookOpen } from 'lucide-react';

interface AyahContextMenuProps {
  ayah: Ayah;
  position: { x: number; y: number };
  onClose: () => void;
  onListen: () => void;
  onRecord: () => void;
  onTajweed: () => void;
  onTest: () => void;
}

export function AyahContextMenu({
  ayah,
  position,
  onClose,
  onListen,
  onRecord,
  onTajweed,
  onTest,
}: AyahContextMenuProps) {
  const items = [
    { label: 'استماع', icon: Volume2, action: onListen },
    { label: 'تجويد', icon: BookOpen, action: onTajweed },
    { label: 'إخفاء', icon: EyeOff, action: onTest },
    { label: 'تسجيل', icon: Mic, action: onRecord },
  ];

  const style: React.CSSProperties = {
    top: Math.min(position.y, window.innerHeight - 180),
    left: Math.min(Math.max(position.x - 70, 8), window.innerWidth - 148),
  };

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl overflow-hidden w-36 animate-scale-in"
        style={style}
      >
        {items.map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            onClick={() => {
              action();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-right"
          >
            <Icon size={14} className="text-accent flex-shrink-0" />
            <span className="text-xs font-amiri text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
