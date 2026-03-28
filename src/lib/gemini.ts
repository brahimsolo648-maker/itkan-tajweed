export interface TajweedAnalysis {
  score: number;
  words: { word: string; correct: boolean; correction?: string }[];
  feedback: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function analyzeTajweed(
  originalText: string,
  userText: string
): Promise<TajweedAnalysis> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-tajweed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ originalText, userText }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل الاتصال بخدمة التحليل');
    }

    return await res.json() as TajweedAnalysis;
  } catch (error) {
    console.error('Tajweed analysis error:', error);
    return {
      score: 0,
      words: [],
      feedback: error instanceof Error ? error.message : 'حدث خطأ أثناء تحليل التلاوة. يرجى المحاولة مرة أخرى.',
    };
  }
}
