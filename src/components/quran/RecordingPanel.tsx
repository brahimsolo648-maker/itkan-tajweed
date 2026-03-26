import { useState, useRef, useCallback } from 'react';
import { analyzeTajweed, type TajweedAnalysis } from '@/lib/gemini';
import { Mic, Square, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface RecordingPanelProps {
  targetAyahText?: string;
  surahName?: string;
  ayahNumber?: number;
}

export function RecordingPanel({ targetAyahText, surahName, ayahNumber }: RecordingPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<TajweedAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    setError('');
    setAnalysis(null);
    setTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('المتصفح لا يدعم التعرف على الصوت. استخدم Google Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('يرجى السماح بالوصول إلى الميكروفون.');
      } else {
        setError('حدث خطأ في التعرف على الصوت.');
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!transcript || !targetAyahText) {
      setError('يرجى التسجيل أولاً واختيار آية للمقارنة.');
      return;
    }
    setAnalyzing(true);
    setError('');
    try {
      const result = await analyzeTajweed(targetAyahText, transcript);
      setAnalysis(result);
    } catch (e) {
      setError('فشل في تحليل التلاوة.');
    } finally {
      setAnalyzing(false);
    }
  }, [transcript, targetAyahText]);

  return (
    <div className="min-h-screen pb-20 pt-4 px-4">
      <h1 className="text-2xl font-bold font-amiri text-center mb-4 text-foreground">
        التسجيل والتحليل
      </h1>

      {targetAyahText && (
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <div className="text-xs text-muted-foreground mb-1">
            {surahName} - آية {ayahNumber}
          </div>
          <div className="font-quran text-lg leading-relaxed text-foreground">
            {targetAyahText}
          </div>
        </div>
      )}

      {!targetAyahText && (
        <div className="bg-muted/50 rounded-xl p-6 mb-4 text-center">
          <p className="text-muted-foreground font-amiri">
            اضغط مطولاً على أي آية في المصحف ثم اختر "تسجيل الآية" لبدء التحليل
          </p>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
            isRecording
              ? 'bg-destructive text-destructive-foreground animate-pulse scale-110'
              : 'bg-primary text-primary-foreground hover:scale-105'
          }`}
        >
          {isRecording ? <Square size={32} /> : <Mic size={32} />}
        </button>
        <span className="text-sm text-muted-foreground font-amiri">
          {isRecording ? 'اضغط لإيقاف التسجيل' : 'اضغط لبدء التسجيل'}
        </span>
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <div className="text-xs text-muted-foreground mb-1 font-amiri">
            النص المُتعرف عليه:
          </div>
          <div className="font-quran text-lg text-foreground leading-relaxed">
            {transcript}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      {transcript && targetAyahText && (
        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full mb-4"
        >
          {analyzing ? (
            <>
              <Loader2 className="animate-spin ml-2" size={16} />
              جاري التحليل...
            </>
          ) : (
            'تحليل التلاوة'
          )}
        </Button>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 mb-4 text-sm font-amiri text-center">
          {error}
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-1">
              {analysis.score}%
            </div>
            <div className="text-sm text-muted-foreground font-amiri">
              نسبة الإتقان
            </div>
            <Progress value={analysis.score} className="mt-2 h-2" />
          </div>

          {analysis.words.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {analysis.words.map((w, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 rounded-lg font-quran text-base ${
                    w.correct
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                  title={w.correction || ''}
                >
                  {w.word}
                  {!w.correct && w.correction && (
                    <span className="block text-xs mt-0.5">{w.correction}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {analysis.feedback && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1 font-amiri font-bold">
                ملاحظات:
              </div>
              <div className="text-sm font-amiri text-foreground leading-relaxed">
                {analysis.feedback}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
