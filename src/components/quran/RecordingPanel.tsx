import { useState, useRef, useCallback, useEffect } from 'react';
import { analyzeTajweed, type TajweedAnalysis } from '@/lib/gemini';
import { Mic, Square, Loader2 } from 'lucide-react';
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
  const [interimTranscript, setInterimTranscript] = useState('');
  const [analysis, setAnalysis] = useState<TajweedAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);

  // Auto-analyze when recording stops and we have a transcript
  const autoAnalyzeRef = useRef(false);

  const startRecording = useCallback(() => {
    setError('');
    setAnalysis(null);
    setTranscript('');
    setInterimTranscript('');

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
      let finalText = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finalText);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
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
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Auto-analyze after recording ends
  useEffect(() => {
    if (autoAnalyzeRef.current && transcript && targetAyahText && !analyzing) {
      autoAnalyzeRef.current = false;
      handleAnalyze();
    }
  }, [transcript, targetAyahText, analyzing]);

  const handleAnalyze = useCallback(async () => {
    const textToAnalyze = transcript || interimTranscript;
    if (!textToAnalyze || !targetAyahText) {
      setError('يرجى التسجيل أولاً واختيار آية للمقارنة.');
      return;
    }
    setAnalyzing(true);
    setError('');
    try {
      const result = await analyzeTajweed(targetAyahText, textToAnalyze);
      setAnalysis(result);
    } catch (e) {
      setError('فشل في تحليل التلاوة.');
    } finally {
      setAnalyzing(false);
    }
  }, [transcript, interimTranscript, targetAyahText]);

  // Highlight original text words based on live transcript
  const renderLiveTracking = () => {
    if (!targetAyahText) return null;
    const currentText = (transcript + ' ' + interimTranscript).trim();
    if (!currentText && !analysis) {
      return (
        <div className="font-quran text-lg leading-[2.2] text-foreground" dir="rtl">
          {targetAyahText}
        </div>
      );
    }

    if (analysis) {
      return (
        <div className="flex flex-wrap gap-1 justify-center" dir="rtl">
          {analysis.words.map((w, i) => (
            <span
              key={i}
              className={`px-1.5 py-0.5 rounded font-quran text-lg ${
                w.correct
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}
            >
              {w.word}
              {!w.correct && w.correction && (
                <span className="block text-xs text-center mt-0.5 font-amiri">{w.correction}</span>
              )}
            </span>
          ))}
        </div>
      );
    }

    // Live tracking: highlight words as user reads
    const originalWords = targetAyahText.split(/\s+/);
    const spokenWords = currentText.split(/\s+/).filter(Boolean);
    const spokenCount = spokenWords.length;

    return (
      <div className="font-quran text-lg leading-[2.2]" dir="rtl">
        {originalWords.map((word, i) => (
          <span
            key={i}
            className={`inline mx-0.5 transition-colors duration-200 ${
              i < spokenCount
                ? 'text-primary font-bold'
                : 'text-muted-foreground/50'
            }`}
          >
            {word}{' '}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20 pt-4 px-4">
      <h1 className="text-2xl font-bold font-amiri text-center mb-4 text-foreground">
        التسجيل والتحليل
      </h1>

      {targetAyahText && (
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <div className="text-xs text-muted-foreground mb-2 font-amiri">
            {surahName} - آية {ayahNumber}
          </div>
          {renderLiveTracking()}
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
        {isRecording && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs text-destructive font-amiri">جاري التسجيل...</span>
          </div>
        )}
      </div>

      {/* Transcript */}
      {(transcript || interimTranscript) && (
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <div className="text-xs text-muted-foreground mb-1 font-amiri">
            النص المُتعرف عليه:
          </div>
          <div className="font-quran text-lg text-foreground leading-relaxed" dir="rtl">
            {transcript}
            {interimTranscript && (
              <span className="text-muted-foreground/60">{interimTranscript}</span>
            )}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      {(transcript || interimTranscript) && targetAyahText && !analysis && (
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

      {analyzing && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <Loader2 className="animate-spin text-primary" size={20} />
          <span className="text-sm text-muted-foreground font-amiri">جاري تحليل التلاوة بالذكاء الاصطناعي...</span>
        </div>
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

          {analysis.feedback && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1 font-amiri font-bold">
                ملاحظات:
              </div>
              <div className="text-sm font-amiri text-foreground leading-relaxed" dir="rtl">
                {analysis.feedback}
              </div>
            </div>
          )}

          <Button
            onClick={() => {
              setAnalysis(null);
              setTranscript('');
              setInterimTranscript('');
            }}
            variant="outline"
            className="w-full"
          >
            إعادة التسجيل
          </Button>
        </div>
      )}
    </div>
  );
}
