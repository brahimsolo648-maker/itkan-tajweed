import { useState, useRef, useCallback, useEffect } from 'react';
import { analyzeTajweed, type TajweedAnalysis } from '@/lib/gemini';
import { Mic, Square, X, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface InlineRecorderProps {
  targetAyahText: string;
  surahName: string;
  ayahNumber: number;
  onClose: () => void;
  onWordColors?: (colors: { wordIndex: number; color: 'correct' | 'error' | 'current' | 'pending' }[]) => void;
}

export function InlineRecorder({
  targetAyahText,
  surahName,
  ayahNumber,
  onClose,
  onWordColors,
}: InlineRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<TajweedAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);
  const autoAnalyzeRef = useRef(false);

  // Live word tracking
  useEffect(() => {
    if (!isRecording || !transcript) return;
    const spokenWords = transcript.trim().split(/\s+/).filter(Boolean);
    const originalWords = targetAyahText.split(/\s+/).filter(Boolean);
    const colors: { wordIndex: number; color: 'correct' | 'error' | 'current' | 'pending' }[] = [];

    originalWords.forEach((_, i) => {
      if (i < spokenWords.length - 1) {
        colors.push({ wordIndex: i, color: 'correct' });
      } else if (i === spokenWords.length - 1) {
        colors.push({ wordIndex: i, color: 'current' });
      } else {
        colors.push({ wordIndex: i, color: 'pending' });
      }
    });

    onWordColors?.(colors);
  }, [transcript, isRecording, targetAyahText, onWordColors]);

  // Apply analysis colors
  useEffect(() => {
    if (!analysis) return;
    const originalWords = targetAyahText.split(/\s+/).filter(Boolean);
    const colors: { wordIndex: number; color: 'correct' | 'error' | 'current' | 'pending' }[] = [];

    originalWords.forEach((_, i) => {
      const analysisWord = analysis.words[i];
      if (analysisWord) {
        colors.push({
          wordIndex: i,
          color: analysisWord.correct ? 'correct' : 'error',
        });
      }
    });

    onWordColors?.(colors);
  }, [analysis, targetAyahText, onWordColors]);

  const startRecording = useCallback(() => {
    setError('');
    setAnalysis(null);
    setTranscript('');
    onWordColors?.([]);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('المتصفح لا يدعم التعرف على الصوت. استخدم Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript((finalText + ' ' + interim).trim());
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setError('يرجى السماح بالوصول إلى الميكروفون.');
      } else if (event.error !== 'aborted') {
        setError('حدث خطأ في التعرف على الصوت.');
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      autoAnalyzeRef.current = true;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [onWordColors]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Auto-analyze after recording ends
  useEffect(() => {
    if (autoAnalyzeRef.current && transcript && !analyzing) {
      autoAnalyzeRef.current = false;
      handleAnalyze();
    }
  }, [transcript, analyzing]);

  const handleAnalyze = useCallback(async () => {
    if (!transcript) return;
    setAnalyzing(true);
    setError('');
    try {
      const result = await analyzeTajweed(targetAyahText, transcript);
      setAnalysis(result);
    } catch {
      setError('فشل في تحليل التلاوة.');
    } finally {
      setAnalyzing(false);
    }
  }, [transcript, targetAyahText]);

  return (
    <div className="recording-overlay slide-up">
      <div className="p-4">
        {/* Handle + Close */}
        <div className="flex items-center justify-between mb-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-muted" />
          <button onClick={onClose} className="absolute left-4 p-1 rounded-full hover:bg-muted">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Ayah info */}
        <div className="text-xs text-muted-foreground text-center mb-3 font-amiri">
          {surahName} - آية {ayahNumber}
        </div>

        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
              isRecording
                ? 'bg-destructive text-destructive-foreground animate-pulse scale-110'
                : 'bg-primary text-primary-foreground hover:scale-105'
            }`}
          >
            {isRecording ? <Square size={24} /> : <Mic size={24} />}
          </button>
        </div>

        <div className="text-center text-xs text-muted-foreground font-amiri mb-2">
          {isRecording ? (
            <span className="flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              جاري الاستماع... اقرأ الآية
            </span>
          ) : analyzing ? (
            <span className="flex items-center justify-center gap-1">
              <Loader2 className="animate-spin" size={12} />
              جاري تحليل التلاوة...
            </span>
          ) : analysis ? (
            'اكتمل التحليل'
          ) : (
            'اضغط للتسجيل وقراءة الآية'
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-2 text-xs font-amiri text-center mb-2">
            {error}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-foreground">{analysis.score}%</div>
              <Progress value={analysis.score} className="flex-1 h-2" />
            </div>

            {analysis.feedback && (
              <div className="bg-muted/50 rounded-lg p-2 text-xs font-amiri text-foreground/80 leading-relaxed" dir="rtl">
                {analysis.feedback}
              </div>
            )}

            {/* Word-by-word results */}
            <div className="flex flex-wrap gap-1 justify-center" dir="rtl">
              {analysis.words.map((w, i) => (
                <span
                  key={i}
                  className={`px-1 py-0.5 rounded text-sm font-quran ${
                    w.correct
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                  title={w.correction || ''}
                >
                  {w.word}
                </span>
              ))}
            </div>

            <button
              onClick={() => {
                setAnalysis(null);
                setTranscript('');
                onWordColors?.([]);
              }}
              className="w-full py-2 rounded-lg border border-border text-sm font-amiri hover:bg-muted transition-colors"
            >
              إعادة التسجيل
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
