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
    { label: 'استماع للقارئ', icon: Volume2, action: onListen },
    { label: 'أحكام التجويد', icon: BookOpen, action: onTajweed },
    { label: 'اختبار الآية', icon: EyeOff, action: onTest },
    { label: 'تسجيل الآية', icon: Mic, action: onRecord },
  ];

  // Position menu within viewport
  const style: React.CSSProperties = {
    top: Math.min(position.y, window.innerHeight - 200),
    left: Math.min(Math.max(position.x - 80, 8), window.innerWidth - 168),
  };

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden w-40"
        style={style}
      >
        {items.map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            onClick={() => {
              action();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted transition-colors text-right"
          >
            <Icon size={16} className="text-accent flex-shrink-0" />
            <span className="text-sm font-amiri text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
