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
import { RecordingPanel } from '@/components/quran/RecordingPanel';
import { JuzList } from '@/components/quran/JuzList';
import { AyahContextMenu } from '@/components/quran/AyahContextMenu';
import { List, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

const Index = () => {
  // Data
  const [quranData, setQuranData] = useState<QuranData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Navigation
  const [currentPage, setCurrentPage] = useState(1);
  const [currentView, setCurrentView] = useState<ViewType>('mushaf');

  // UI state
  const { visible: showUI, toggle: toggleUI, show: showUIControls } = useAutoHide(3000);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [juzOpen, setJuzOpen] = useState(false);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    ayah: Ayah;
    position: { x: number; y: number };
  } | null>(null);

  // Recording target
  const [recordingTarget, setRecordingTarget] = useState<{
    text: string;
    surahName: string;
    ayahNumber: number;
  } | null>(null);

  // Settings (persisted)
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('itqan-dark') === 'true'
  );
  const [reciter, setReciter] = useState<ReciterId>(
    () => (localStorage.getItem('itqan-reciter') as ReciterId) || 'alaa'
  );
  const [fontSize, setFontSize] = useState(
    () => Number(localStorage.getItem('itqan-font-size')) || 26
  );
  const [playbackSpeed, setPlaybackSpeed] = useState(
    () => Number(localStorage.getItem('itqan-speed')) || 1
  );
  const [learningMode, setLearningMode] = useState(false);

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Swipe
  const touchStartX = useRef(0);

  // Load Quran data
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

  useEffect(() => {
    localStorage.setItem('itqan-reciter', reciter);
  }, [reciter]);

  useEffect(() => {
    localStorage.setItem('itqan-font-size', String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('itqan-speed', String(playbackSpeed));
  }, [playbackSpeed]);

  // Get current page info
  const currentAyahs = quranData?.pageMap.get(currentPage) || [];
  const currentSurahName = currentAyahs[0]?.surahName || '';
  const currentJuz = currentAyahs[0]?.juz || 1;

  // Navigate to surah
  const goToSurah = useCallback(
    (surahNumber: number) => {
      if (!quranData) return;
      const page = quranData.surahFirstPage.get(surahNumber);
      if (page) setCurrentPage(page);
    },
    [quranData]
  );

  // Navigate to juz
  const goToJuz = useCallback(
    (juz: number) => {
      if (!quranData) return;
      const page = quranData.juzFirstPage.get(juz);
      if (page) setCurrentPage(page);
    },
    [quranData]
  );

  // Page navigation
  const nextPage = useCallback(() => {
    if (!quranData) return;
    setCurrentPage((p) => Math.min(p + 1, quranData.totalPages));
  }, [quranData]);

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, []);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) nextPage(); // swipe left = next
        else prevPage(); // swipe right = prev
      }
    },
    [nextPage, prevPage]
  );

  // Play surah audio
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

  // Ayah long press handler
  const handleAyahLongPress = useCallback((ayah: Ayah, rect: DOMRect) => {
    setContextMenu({
      ayah,
      position: { x: rect.left + rect.width / 2, y: rect.bottom },
    });
  }, []);

  // View change handler
  const handleChangeView = useCallback((view: ViewType) => {
    setCurrentView(view);
    if (view === 'mushaf') {
      // Reset to mushaf
    }
  }, []);

  // Loading screen
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <img
          src="/icon-512.png"
          alt="إتقان"
          className="w-24 h-24 rounded-2xl shadow-lg"
          width={96}
          height={96}
        />
        <h1 className="text-2xl font-bold font-amiri text-foreground">إتقان</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-sm text-muted-foreground font-amiri">جاري تحميل المصحف الشريف...</p>
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
      onClick={toggleUI}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <AppHeader
        visible={showUI}
        surahName={currentSurahName}
        juz={currentJuz}
        page={currentPage}
        darkMode={darkMode}
        learningMode={learningMode}
        onToggleDark={() => setDarkMode((d) => !d)}
        onToggleLearning={() => setLearningMode((l) => !l)}
      />

      {/* Main Content */}
      <main className="pt-1 pb-16">
        {currentView === 'mushaf' && (
          <>
            <MushafPage
              ayahs={currentAyahs}
              fontSize={fontSize}
              learningMode={learningMode}
              onAyahLongPress={handleAyahLongPress}
              onRecordAyah={(ayah) => {
                setRecordingTarget({
                  text: ayah.text,
                  surahName: ayah.surahName,
                  ayahNumber: ayah.numberInSurah,
                });
                setCurrentView('recording');
              }}
              onListenAyah={(ayah) => playSurahAudio(ayah.surahNumber)}
            />

            {/* Page navigation arrows */}
            <div
              className={`fixed top-1/2 -translate-y-1/2 left-2 z-30 fade-transition ${
                showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextPage();
                }}
                className="p-2 rounded-full bg-primary/80 text-primary-foreground shadow-lg"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            <div
              className={`fixed top-1/2 -translate-y-1/2 right-2 z-30 fade-transition ${
                showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevPage();
                }}
                className="p-2 rounded-full bg-primary/80 text-primary-foreground shadow-lg"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Floating action buttons */}
            <div
              className={`fixed left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 fade-transition ${
                showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              style={{ top: '35%' }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerOpen(true);
                }}
                className="p-2.5 rounded-full bg-card/90 border border-border shadow-lg text-foreground hover:bg-muted transition-colors"
                title="فهرس السور"
              >
                <List size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setJuzOpen(true);
                }}
                className="p-2.5 rounded-full bg-card/90 border border-border shadow-lg text-foreground hover:bg-muted transition-colors"
                title="الأجزاء"
              >
                <Layers size={18} />
              </button>
            </div>
          </>
        )}

        {currentView === 'tajweed' && <TajweedPage />}

        {currentView === 'recording' && (
          <RecordingPanel
            targetAyahText={recordingTarget?.text}
            surahName={recordingTarget?.surahName}
            ayahNumber={recordingTarget?.ayahNumber}
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

      {/* Bottom Navigation */}
      <BottomNav
        visible={showUI}
        currentView={currentView}
        onChangeView={handleChangeView}
      />

      {/* Surah Drawer */}
      {quranData && (
        <SurahDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          surahs={quranData.surahs}
          onSelectSurah={goToSurah}
        />
      )}

      {/* Juz List */}
      <JuzList
        open={juzOpen}
        onClose={() => setJuzOpen(false)}
        onSelectJuz={goToJuz}
      />

      {/* Settings Sheet (from settings button, not bottom nav) */}
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

      {/* Ayah Context Menu */}
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
            });
            setCurrentView('recording');
          }}
          onTajweed={() => setCurrentView('tajweed')}
          onTest={() => {
            // Simple test: alert with ayah hidden
            alert('حاول ترديد الآية من الذاكرة ثم تحقق!');
          }}
        />
      )}
    </div>
  );
};

export default Index;
