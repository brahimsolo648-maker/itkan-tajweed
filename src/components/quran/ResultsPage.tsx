import { X, RotateCcw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResultsPageProps {
  score: number;
  words: { word: string; correct: boolean; correction?: string }[];
  feedback: string;
  ayahText: string;
  surahName: string;
  ayahNumber: number;
  onClose: () => void;
  onRetry: () => void;
}

export function ResultsPage({
  score,
  words,
  feedback,
  surahName,
  ayahNumber,
  onClose,
  onRetry,
}: ResultsPageProps) {
  const errorWords = words.filter(w => !w.correct);
  const correctCount = words.filter(w => w.correct).length;

  const scoreColor = score >= 80 ? 'text-green-600 dark:text-green-400'
    : score >= 50 ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-destructive';

  const ScoreIcon = score >= 80 ? CheckCircle2
    : score >= 50 ? AlertTriangle
    : XCircle;

  return (
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-sm">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <X size={20} className="text-foreground" />
          </button>
          <h2 className="text-lg font-bold font-amiri text-foreground">نتائج التلاوة</h2>
          <div className="w-8" />
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            {/* Ayah info */}
            <div className="text-center text-sm text-muted-foreground font-amiri">
              {surahName} - آية {ayahNumber}
            </div>

            {/* Score card */}
            <div className="bg-card rounded-2xl border border-border p-6 text-center space-y-3">
              <ScoreIcon size={48} className={`mx-auto ${scoreColor}`} />
              <div className={`text-5xl font-bold ${scoreColor}`}>{score}%</div>
              <Progress value={score} className="h-3" />
              <div className="text-sm text-muted-foreground font-amiri">
                {correctCount} من {words.length} كلمة صحيحة
              </div>
            </div>

            {/* Feedback */}
            {feedback && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-bold font-amiri text-foreground mb-2">ملاحظات عامة</h3>
                <p className="text-sm font-amiri text-foreground/80 leading-relaxed" dir="rtl">
                  {feedback}
                </p>
              </div>
            )}

            {/* Word-by-word results */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-bold font-amiri text-foreground mb-3">تحليل الكلمات</h3>
              <div className="flex flex-wrap gap-1.5 justify-center" dir="rtl">
                {words.map((w, i) => (
                  <span
                    key={i}
                    className={`px-2 py-1 rounded-lg text-sm font-quran ${
                      w.correct
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    {w.word}
                  </span>
                ))}
              </div>
            </div>

            {/* Error details */}
            {errorWords.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-bold font-amiri text-foreground mb-3 flex items-center gap-2">
                  <XCircle size={16} className="text-destructive" />
                  الأخطاء والتصحيحات
                </h3>
                <div className="space-y-3" dir="rtl">
                  {errorWords.map((w, i) => (
                    <div key={i} className="bg-destructive/5 rounded-lg p-3 space-y-1">
                      <div className="font-quran text-lg text-destructive">{w.word}</div>
                      {w.correction && (
                        <div className="text-xs text-foreground/70 font-amiri leading-relaxed">
                          {w.correction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom actions */}
        <div className="p-4 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-amiri hover:bg-muted transition-colors text-foreground"
          >
            العودة للمصحف
          </button>
          <button
            onClick={onRetry}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-amiri hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            إعادة التسجيل
          </button>
        </div>
      </div>
    </div>
  );
}
