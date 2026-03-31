import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchQuranData,
  type QuranData,
  type Ayah,
  type ReciterId,
  getSurahAudioUrl,
  toArabicNumeral,
} from '@/lib/quran-api';
import { useAutoHide } from '@/hooks/use-auto-hide';
import { MushafPage } from '@/components/quran/MushafPage';
import { AppHeader } from '@/components/quran/AppHeader';
import { BottomNav, type ViewType } from '@/components/quran/BottomNav';
import { SurahDrawer } from '@/components/quran/SurahDrawer';
import { SettingsSheet } from '@/components/quran/SettingsSheet';
import { TajweedPage } from '@/components/quran/TajweedPage';
import { InlineRecorder } from '@/components/quran/InlineRecorder';
import { JuzList } from '@/components/quran/JuzList';
import { AyahContextMenu } from '@/components/quran/AyahContextMenu';
import { List, Layers } from 'lucide-react';

const Index = () => {
  const [quranData, setQuranData] = useState<QuranData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [currentView, setCurrentView] = useState<ViewType>('mushaf');
  const [flipDirection, setFlipDirection] = useState<'left' | 'right' | null>(null);

  const { visible: showUI, toggle: toggleUI } = useAutoHide(3000);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [juzOpen, setJuzOpen] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    ayah: Ayah;
    position: { x: number; y: number };
  } | null>(null);

  // Inline recording
  const [recordingTarget, setRecordingTarget] = useState<{
    text: string;
    surahName: string;
    ayahNumber: number;
    ayahGlobalNumber: number;
  } | null>(null);

  // Tajweed word colors (ayah number -> word colors)
  const [tajweedColors, setTajweedColors] = useState<
    Map<number, { wordIndex: number; color: 'correct' | 'error' | 'current' | 'pending' }[]>
  >(new Map());

  // Settings
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('itqan-dark') === 'true'
  );
  const [reciter, setReciter] = useState<ReciterId>(
    () => (localStorage.getItem('itqan-reciter') as ReciterId) || 'alaa'
  );
  const [fontSize, setFontSize] = useState(
    () => Number(localStorage.getItem('itqan-font-size')) || 24
  );
  const [playbackSpeed, setPlaybackSpeed] = useState(
    () => Number(localStorage.getItem('itqan-speed')) || 1
  );

  const [hiddenAyahs, setHiddenAyahs] = useState<Set<number>>(new Set());

  const [tajweedTarget, setTajweedTarget] = useState<{
    text: string;
    surahName: string;
    ayahNumber: number;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Load Quran
  useEffect(() => {
    fetchQuranData()
      .then((data) => {
        setQuranData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadError('فشل في تحميل بيانات المصحف. يرجى تحديث الصفحة.');
        setLoading(false);
      });
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('itqan-dark', String(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => { localStorage.setItem('itqan-reciter', reciter); }, [reciter]);
  useEffect(() => { localStorage.setItem('itqan-font-size', String(fontSize)); }, [fontSize]);
  useEffect(() => { localStorage.setItem('itqan-speed', String(playbackSpeed)); }, [playbackSpeed]);

  const currentAyahs = quranData?.pageMap.get(currentPage) || [];
  const currentSurahName = currentAyahs[0]?.surahName || '';
  const currentJuz = currentAyahs[0]?.juz || 1;

  const goToSurah = useCallback((surahNumber: number) => {
    if (!quranData) return;
    const page = quranData.surahFirstPage.get(surahNumber);
    if (page) {
      setFlipDirection('right');
      setCurrentPage(page);
    }
  }, [quranData]);

  const goToJuz = useCallback((juz: number) => {
    if (!quranData) return;
    const page = quranData.juzFirstPage.get(juz);
    if (page) {
      setFlipDirection('right');
      setCurrentPage(page);
    }
  }, [quranData]);

  const nextPage = useCallback(() => {
    if (!quranData) return;
    setFlipDirection('right');
    setCurrentPage((p) => Math.min(p + 1, quranData.totalPages));
  }, [quranData]);

  const prevPage = useCallback(() => {
    setFlipDirection('left');
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, []);

  // Clear flip animation after it plays
  useEffect(() => {
    if (flipDirection) {
      const timer = setTimeout(() => setFlipDirection(null), 550);
      return () => clearTimeout(timer);
    }
  }, [flipDirection, currentPage]);

  // Touch handlers for swipe (RTL: swipe left = prev, swipe right = next)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diffX = touchStartX.current - e.changedTouches[0].clientX;
      const diffY = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
      if (diffY > Math.abs(diffX)) return; // vertical scroll
      if (Math.abs(diffX) > 50) {
        // RTL: swipe left (diffX > 0) goes to prev page, swipe right goes to next
        if (diffX > 0) prevPage();
        else nextPage();
      }
    },
    [nextPage, prevPage]
  );

  // Play surah audio for the ayah's surah
  const playSurahAudio = useCallback(
    (surahNumber: number) => {
      const url = getSurahAudioUrl(reciter, surahNumber);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.playbackRate = playbackSpeed;
      audio.play().catch(console.error);
      audioRef.current = audio;
    },
    [reciter, playbackSpeed]
  );

  const handleAyahLongPress = useCallback((ayah: Ayah, rect: DOMRect) => {
    setContextMenu({
      ayah,
      position: { x: rect.left + rect.width / 2, y: rect.bottom },
    });
  }, []);

  const handleChangeView = useCallback((view: ViewType) => {
    setCurrentView(view);
    if (view === 'mushaf') {
      setRecordingTarget(null);
      setTajweedColors(new Map());
    }
  }, []);

  // Handle word color updates from recorder
  const handleWordColors = useCallback((colors: { wordIndex: number; color: 'correct' | 'error' | 'current' | 'pending' }[]) => {
    if (!recordingTarget) return;
    setTajweedColors(new Map([[recordingTarget.ayahGlobalNumber, colors]]));
  }, [recordingTarget]);

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-amiri font-bold text-2xl">إ</span>
        </div>
        <h1 className="text-xl font-bold font-amiri text-foreground">إتقان</h1>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-xs text-muted-foreground font-amiri">جاري تحميل المصحف الشريف...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 px-4">
        <p className="text-destructive font-amiri text-center">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-amiri"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background select-none"
      onClick={currentView === 'mushaf' ? toggleUI : undefined}
      onTouchStart={currentView === 'mushaf' ? handleTouchStart : undefined}
      onTouchEnd={currentView === 'mushaf' ? handleTouchEnd : undefined}
    >
      <AppHeader
        visible={showUI && currentView === 'mushaf'}
        surahName={currentSurahName}
        juz={currentJuz}
        page={currentPage}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((d) => !d)}
      />

      <main className={`${currentView === 'mushaf' ? 'pt-0 pb-14' : 'pt-1 pb-16'}`}>
        {currentView === 'mushaf' && (
          <>
            <MushafPage
              ayahs={currentAyahs}
              fontSize={fontSize}
              onAyahLongPress={handleAyahLongPress}
              hiddenAyahs={hiddenAyahs}
              onToggleHidden={(num) => {
                setHiddenAyahs(prev => {
                  const next = new Set(prev);
                  if (next.has(num)) next.delete(num);
                  else next.add(num);
                  return next;
                });
              }}
              pageNumber={currentPage}
              tajweedColors={tajweedColors}
              flipDirection={flipDirection}
            />

            {/* Floating buttons */}
            <div
              className={`fixed right-2 z-30 flex flex-col gap-2 fade-transition ${
                showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              style={{ top: '40%' }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setDrawerOpen(true); }}
                className="p-2 rounded-full bg-card/90 border border-border shadow-lg text-foreground hover:bg-muted transition-colors"
                title="فهرس السور"
              >
                <List size={16} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setJuzOpen(true); }}
                className="p-2 rounded-full bg-card/90 border border-border shadow-lg text-foreground hover:bg-muted transition-colors"
                title="الأجزاء"
              >
                <Layers size={16} />
              </button>
            </div>

            {/* Inline recorder */}
            {recordingTarget && (
              <InlineRecorder
                targetAyahText={recordingTarget.text}
                surahName={recordingTarget.surahName}
                ayahNumber={recordingTarget.ayahNumber}
                onClose={() => {
                  setRecordingTarget(null);
                  setTajweedColors(new Map());
                }}
                onWordColors={handleWordColors}
              />
            )}
          </>
        )}

        {currentView === 'tajweed' && (
          <TajweedPage
            ayahText={tajweedTarget?.text}
            surahName={tajweedTarget?.surahName}
            ayahNumber={tajweedTarget?.ayahNumber}
          />
        )}

        {currentView === 'settings' && (
          <div className="pt-4 px-4">
            <SettingsSheet
              open={true}
              onClose={() => setCurrentView('mushaf')}
              darkMode={darkMode}
              onToggleDark={() => setDarkMode((d) => !d)}
              reciter={reciter}
              onChangeReciter={setReciter}
              fontSize={fontSize}
              onChangeFontSize={setFontSize}
              playbackSpeed={playbackSpeed}
              onChangeSpeed={setPlaybackSpeed}
            />
          </div>
        )}
      </main>

      <BottomNav
        visible={showUI}
        currentView={currentView}
        onChangeView={handleChangeView}
      />

      {quranData && (
        <SurahDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          surahs={quranData.surahs}
          onSelectSurah={goToSurah}
        />
      )}

      <JuzList
        open={juzOpen}
        onClose={() => setJuzOpen(false)}
        onSelectJuz={goToJuz}
      />

      {currentView === 'mushaf' && (
        <SettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          reciter={reciter}
          onChangeReciter={setReciter}
          fontSize={fontSize}
          onChangeFontSize={setFontSize}
          playbackSpeed={playbackSpeed}
          onChangeSpeed={setPlaybackSpeed}
        />
      )}

      {contextMenu && (
        <AyahContextMenu
          ayah={contextMenu.ayah}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onListen={() => playSurahAudio(contextMenu.ayah.surahNumber)}
          onRecord={() => {
            setRecordingTarget({
              text: contextMenu.ayah.text,
              surahName: contextMenu.ayah.surahName,
              ayahNumber: contextMenu.ayah.numberInSurah,
              ayahGlobalNumber: contextMenu.ayah.number,
            });
          }}
          onTajweed={() => {
            setTajweedTarget({
              text: contextMenu.ayah.text,
              surahName: contextMenu.ayah.surahName,
              ayahNumber: contextMenu.ayah.numberInSurah,
            });
            setCurrentView('tajweed');
          }}
          onTest={() => {
            setHiddenAyahs(prev => {
              const next = new Set(prev);
              next.add(contextMenu.ayah.number);
              return next;
            });
          }}
        />
      )}
    </div>
  );
};

export default Index;
