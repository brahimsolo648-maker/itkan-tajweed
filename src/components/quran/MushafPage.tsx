import { Ayah, toArabicNumeral, stripBismillah, getHizbQuarterLabel } from '@/lib/quran-api';
import { useRef, useState, useCallback } from 'react';

interface MushafPageProps {
  ayahs: Ayah[];
  fontSize: number;
  onAyahLongPress?: (ayah: Ayah, rect: DOMRect) => void;
  hiddenAyahs?: Set<number>;
  onToggleHidden?: (ayahNumber: number) => void;
  pageNumber?: number;
  selectedAyahs?: Set<number>;
  tajweedColors?: Map<number, { wordIndex: number; color: 'correct' | 'error' | 'current' | 'pending' }[]>;
  flipDirection?: 'left' | 'right' | null;
}

export function MushafPage({
  ayahs,
  fontSize,
  onAyahLongPress,
  hiddenAyahs,
  onToggleHidden,
  pageNumber,
  selectedAyahs,
  tajweedColors,
  flipDirection,
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

  // Get page info
  const firstAyah = ayahs[0];
  const juz = firstAyah?.juz || 1;
  const hizbQuarter = firstAyah?.hizbQuarter || 1;
  const surahName = firstAyah?.surahName || '';

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

  const flipClass = flipDirection === 'right'
    ? 'page-flip-enter-right'
    : flipDirection === 'left'
    ? 'page-flip-enter-left'
    : '';

  return (
    <div className={`page-flip-container ${flipClass}`}>
      <div className="mushaf-frame mx-2 my-2 sm:mx-4 sm:my-3">
        {/* Corner ornaments */}
        <div className="mushaf-corner-tl" />
        <div className="mushaf-corner-br" />

        {/* Page info header */}
        <div className="mushaf-page-info">
          <span>الجزء {toArabicNumeral(juz)}</span>
          <span className="font-bold">{surahName}</span>
          <span>{getHizbQuarterLabel(hizbQuarter)}</span>
        </div>

        {/* Ayah content */}
        <div className="px-3 py-3 sm:px-5 sm:py-4" dir="rtl">
          {ayahs.map((ayah) => {
            const isNewSurah = surahStarts.has(ayah.number);
            const isHidden = hiddenAyahs?.has(ayah.number);
            const isSelected = selectedAyahs?.has(ayah.number);

            return (
              <span key={ayah.number}>
                {isNewSurah && (
                  <div className="surah-header-decoration my-3 mx-auto max-w-[280px]">
                    <span className="font-quran text-base font-bold">
                      {ayah.surahName}
                    </span>
                  </div>
                )}
                {isHidden ? (
                  <span
                    className="ayah-text inline cursor-pointer"
                    style={{ fontSize: `${fontSize}px` }}
                    onClick={() => onToggleHidden?.(ayah.number)}
                  >
                    <span className="inline-block bg-muted rounded px-2 py-0.5 text-muted-foreground text-xs font-amiri">
                      ﴿ {toArabicNumeral(ayah.numberInSurah)} ﴾
                    </span>
                  </span>
                ) : (
                  <span
                    className={`ayah-text inline cursor-pointer transition-colors ${
                      pressedAyah === ayah.number ? 'bg-accent/20 rounded' : ''
                    } ${isSelected ? 'ayah-selected' : ''}`}
                    style={{ fontSize: `${fontSize}px` }}
                    onPointerDown={(e) => handlePointerDown(ayah, e)}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  >
                    {renderAyahText(ayah, tajweedColors?.get(ayah.number))}
                    <span className="ayah-number">
                      {toArabicNumeral(ayah.numberInSurah)}
                    </span>
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {/* Page number footer */}
        {pageNumber != null && (
          <div className="page-number-footer">
            {toArabicNumeral(pageNumber)}
          </div>
        )}
      </div>
    </div>
  );
}

function renderAyahText(
  ayah: Ayah,
  colors?: { wordIndex: number; color: 'correct' | 'error' | 'current' | 'pending' }[]
) {
  const text = stripBismillah(ayah.text, ayah.surahNumber, ayah.numberInSurah);

  if (!colors || colors.length === 0) {
    return text;
  }

  const words = text.split(/(\s+)/);
  const colorMap = new Map(colors.map(c => [c.wordIndex, c.color]));
  let wordIdx = 0;

  return words.map((segment, i) => {
    if (/^\s+$/.test(segment)) return segment;
    const color = colorMap.get(wordIdx);
    wordIdx++;
    const className = color === 'correct'
      ? 'tajweed-correct'
      : color === 'error'
      ? 'tajweed-error'
      : color === 'current'
      ? 'tajweed-current'
      : color === 'pending'
      ? 'tajweed-pending'
      : '';
    return (
      <span key={i} className={className}>
        {segment}
      </span>
    );
  });
}
