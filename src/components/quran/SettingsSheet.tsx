import { RECITERS, type ReciterId } from '@/lib/quran-api';
import { X, Minus, Plus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  reciter: ReciterId;
  onChangeReciter: (r: ReciterId) => void;
  fontSize: number;
  onChangeFontSize: (s: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (s: number) => void;
}

export function SettingsSheet({
  open,
  onClose,
  darkMode,
  onToggleDark,
  reciter,
  onChangeReciter,
  fontSize,
  onChangeFontSize,
  playbackSpeed,
  onChangeSpeed,
}: SettingsSheetProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-amiri">الإعدادات</h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted">
              <X size={20} />
            </button>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="font-amiri">الوضع الليلي</span>
            <button
              onClick={onToggleDark}
              className={`w-12 h-6 rounded-full transition-colors ${
                darkMode ? 'bg-accent' : 'bg-muted'
              } relative`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${
                  darkMode ? 'right-0.5' : 'right-6'
                }`}
              />
            </button>
          </div>

          {/* Reciter */}
          <div className="py-3 border-b border-border">
            <span className="font-amiri block mb-2">القارئ</span>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(RECITERS) as ReciterId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => onChangeReciter(id)}
                  className={`px-3 py-2 rounded-lg text-sm font-amiri transition-colors ${
                    reciter === id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {RECITERS[id].name}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="py-3 border-b border-border">
            <span className="font-amiri block mb-2">حجم الخط</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onChangeFontSize(Math.max(18, fontSize - 2))}
                className="p-1.5 rounded-full bg-muted hover:bg-muted/80"
              >
                <Minus size={16} />
              </button>
              <Slider
                value={[fontSize]}
                onValueChange={([v]) => onChangeFontSize(v)}
                min={18}
                max={42}
                step={2}
                className="flex-1"
              />
              <button
                onClick={() => onChangeFontSize(Math.min(42, fontSize + 2))}
                className="p-1.5 rounded-full bg-muted hover:bg-muted/80"
              >
                <Plus size={16} />
              </button>
              <span className="text-sm w-8 text-center">{fontSize}</span>
            </div>
          </div>

          {/* Playback Speed */}
          <div className="py-3">
            <span className="font-amiri block mb-2">سرعة التلاوة</span>
            <div className="flex gap-2">
              {[0.5, 0.75, 1, 1.25, 1.5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => onChangeSpeed(speed)}
                  className={`flex-1 py-1.5 rounded-lg text-sm transition-colors ${
                    playbackSpeed === speed
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
