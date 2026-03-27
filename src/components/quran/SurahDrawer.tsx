import { type Surah, toArabicNumeral } from '@/lib/quran-api';
import { X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SurahDrawerProps {
  open: boolean;
  onClose: () => void;
  surahs: Surah[];
  onSelectSurah: (surahNumber: number) => void;
}

export function SurahDrawer({ open, onClose, surahs, onSelectSurah }: SurahDrawerProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-72 bg-background shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold font-amiri text-foreground">فهرس السور</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X size={20} className="text-foreground" />
          </button>
        </div>
        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="p-2">
            {surahs.map((s) => (
              <button
                key={s.number}
                onClick={() => {
                  onSelectSurah(s.number);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-right"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full border border-accent text-accent text-sm font-bold">
                  {toArabicNumeral(s.number)}
                </span>
                <div className="flex-1">
                  <div className="font-amiri font-bold text-foreground text-sm">
                    {s.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {toArabicNumeral(s.numberOfAyahs)} آية
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {s.firstPage ? `ص ${toArabicNumeral(s.firstPage)}` : ''}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
