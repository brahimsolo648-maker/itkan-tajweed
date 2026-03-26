import { toArabicNumeral } from '@/lib/quran-api';
import { X } from 'lucide-react';

interface JuzListProps {
  open: boolean;
  onClose: () => void;
  onSelectJuz: (juz: number) => void;
}

export function JuzList({ open, onClose, onSelectJuz }: JuzListProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-background rounded-2xl shadow-2xl w-[90vw] max-w-sm max-h-[70vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold font-amiri">الأجزاء</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X size={20} />
          </button>
        </div>
        <div className="p-3 grid grid-cols-5 gap-2 overflow-y-auto max-h-[55vh]">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
            <button
              key={juz}
              onClick={() => {
                onSelectJuz(juz);
                onClose();
              }}
              className="flex items-center justify-center w-full aspect-square rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-colors font-amiri text-sm font-bold"
            >
              {toArabicNumeral(juz)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
