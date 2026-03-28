import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalText, userText } = await req.json();
    if (!originalText || !userText) {
      return new Response(JSON.stringify({ error: 'Missing originalText or userText' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `أنت خبير في تجويد القرآن الكريم ومتخصص في رواية ورش عن نافع. مهمتك مقارنة النص الذي قرأه المستخدم بالنص الأصلي من المصحف وتحديد الأخطاء في:
1. مخارج الحروف والصفات
2. أحكام النون الساكنة والتنوين (إظهار، إدغام، إقلاب، إخفاء)
3. أحكام الميم الساكنة
4. المدود بأنواعها
5. التفخيم والترقيق
6. الوقف والابتداء

يجب أن ترد بصيغة JSON فقط بالشكل التالي:
{
  "score": رقم من 0 إلى 100 يمثل نسبة الإتقان,
  "words": [{"word": "الكلمة", "correct": true أو false, "correction": "التصحيح والشرح إن وجد خطأ"}],
  "feedback": "ملاحظات عامة وتوجيهات لتحسين التلاوة"
}

كن دقيقاً في التقييم. إذا كان النص المقروء قريباً جداً من الأصلي فأعط درجة عالية. ركز على الأخطاء الجوهرية التي تغير المعنى أو تخالف أحكام التجويد.`;

    const userPrompt = `قارن بين النصين التاليين:
النص الأصلي من المصحف: ${originalText}
النص الذي قرأه المستخدم: ${userText}

حلل التلاوة وحدد الأخطاء مع التصحيح.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'tajweed_analysis',
            description: 'Return tajweed analysis results',
            parameters: {
              type: 'object',
              properties: {
                score: { type: 'number', description: 'Score 0-100' },
                words: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      word: { type: 'string' },
                      correct: { type: 'boolean' },
                      correction: { type: 'string' },
                    },
                    required: ['word', 'correct'],
                  },
                },
                feedback: { type: 'string' },
              },
              required: ['score', 'words', 'feedback'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'tajweed_analysis' } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'يرجى إضافة رصيد للاستمرار في استخدام التحليل' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await response.text();
      console.error('AI gateway error:', status, errText);
      return new Response(JSON.stringify({ error: 'فشل في تحليل التلاوة' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback: try to parse content as JSON
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const result = JSON.parse(content);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch {
        // Return raw content as feedback
        return new Response(JSON.stringify({ score: 0, words: [], feedback: content }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'No analysis result' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('analyze-tajweed error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});