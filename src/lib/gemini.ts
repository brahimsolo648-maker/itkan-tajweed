const API_KEY = 'AIzaSyC-IiWxvqu9lsaT1omvE_yWZogVTz_DTOM';
const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

export interface TajweedAnalysis {
  score: number;
  words: { word: string; correct: boolean; correction?: string }[];
  feedback: string;
}

export async function analyzeTajweed(
  originalText: string,
  userText: string
): Promise<TajweedAnalysis> {
  const prompt = `قارن بين النصين التاليين:
النص الأصلي: ${originalText}
نص المستخدم: ${userText}

حدد الأخطاء في مخارج الحروف والصفات والمدود، وأعط التصحيح لكل خطأ بأسلوب تعليمي بسيط.

أعد الإجابة بصيغة JSON فقط بالشكل التالي:
{
  "score": رقم من 0 إلى 100 يمثل نسبة الإتقان,
  "words": [{"word": "الكلمة", "correct": true أو false, "correction": "التصحيح إن وجد"}],
  "feedback": "ملاحظات عامة وتوجيهات"
}`;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) throw new Error('فشل الاتصال بخدمة التحليل');

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('لم يتم استلام نتيجة التحليل');

    return JSON.parse(text) as TajweedAnalysis;
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return {
      score: 0,
      words: [],
      feedback: 'حدث خطأ أثناء تحليل التلاوة. يرجى المحاولة مرة أخرى.',
    };
  }
}
