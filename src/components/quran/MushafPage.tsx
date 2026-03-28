import { Ayah, toArabicNumeral, stripBismillah } from '@/lib/quran-api';
import { useRef, useState, useCallback } from 'react';

interface MushafPageProps {
  ayahs: Ayah[];
  fontSize: number;
  learningMode: boolean;
  onAyahLongPress?: (ayah: Ayah, rect: DOMRect) => void;
  onRecordAyah?: (ayah: Ayah) => void;
  onListenAyah?: (ayah: Ayah) => void;
  hiddenAyahs?: Set<number>;
  onToggleHidden?: (ayahNumber: number) => void;
  pageNumber?: number;
}

export function MushafPage({
  ayahs,
  fontSize,
  learningMode,
  onAyahLongPress,
  onRecordAyah,
  onListenAyah,
  hiddenAyahs,
  onToggleHidden,
  pageNumber,
}: MushafPageProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const [pressedAyah, setPressedAyah] = useState<number | null>(null);

  // Group ayahs by surah to detect surah starts
  const surahStarts = new Set<number>();
  let prevSurah = 0;
  for (const a of ayahs) {
    if (a.surahNumber !== prevSurah) {
      if (a.numberInSurah === 1) surahStarts.add(a.number);
      prevSurah = a.surahNumber;
    }
  }

  const handlePointerDown = useCallback(
    (ayah: Ayah, e: React.PointerEvent) => {
      const target = e.currentTarget as HTMLElement;
      longPressTimer.current = setTimeout(() => {
        const rect = target.getBoundingClientRect();
        onAyahLongPress?.(ayah, rect);
        setPressedAyah(null);
      }, 600);
      setPressedAyah(ayah.number);
    },
    [onAyahLongPress]
  );

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    setPressedAyah(null);
  }, []);

  return (
    <>
    <div className="mushaf-page px-3 py-4 sm:px-6 sm:py-6">
      {ayahs.map((ayah, idx) => {
        const isNewSurah = surahStarts.has(ayah.number);

        return (
          <span key={ayah.number}>
            {isNewSurah && (
              <div className="surah-header-decoration my-4 mx-auto max-w-xs">
                <span className="font-quran text-lg font-bold">
                  {ayah.surahName}
                </span>
              </div>
            )}
            {/* Bismillah for surahs (except Al-Fatiha and At-Tawbah) */}
            {isNewSurah && ayah.surahNumber !== 1 && ayah.surahNumber !== 9 && (
              <div className="bismillah-text my-2">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </div>
            )}
            {hiddenAyahs?.has(ayah.number) ? (
              <span
                className="ayah-text inline cursor-pointer"
                style={{ fontSize: `${fontSize}px` }}
                onClick={() => onToggleHidden?.(ayah.number)}
              >
                <span className="inline-block bg-muted rounded px-2 py-1 text-muted-foreground text-sm font-amiri">
                  ••• اضغط لإظهار الآية •••
                </span>
                <span className="ayah-number">
                  {toArabicNumeral(ayah.numberInSurah)}
                </span>
              </span>
            ) : (
              <span
                className={`ayah-text inline cursor-pointer transition-colors ${
                  pressedAyah === ayah.number
                    ? 'bg-accent/30 rounded'
                    : ''
                }`}
                style={{ fontSize: `${fontSize}px` }}
                onPointerDown={(e) => handlePointerDown(ayah, e)}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {stripBismillah(ayah.text, ayah.surahNumber, ayah.numberInSurah)}
                <span className="ayah-number">
                  {toArabicNumeral(ayah.numberInSurah)}
                </span>
              </span>
            )}

            {learningMode && (
              <div className="inline-flex gap-1 mx-1 align-middle">
                <button
                  onClick={() => onRecordAyah?.(ayah)}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/80 text-destructive-foreground text-xs"
                  title="تسجيل"
                >
                  🎙
                </button>
                <button
                  onClick={() => onListenAyah?.(ayah)}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/80 text-primary-foreground text-xs"
                  title="استماع"
                >
                  ▶
                </button>
              </div>
            )}
          </span>
        );
      })}
    </div>
      {pageNumber != null && (
        <div className="text-center py-2 text-sm text-muted-foreground font-amiri">
          صفحة {toArabicNumeral(pageNumber)}
        </div>
      )}
    </>
  );
}
