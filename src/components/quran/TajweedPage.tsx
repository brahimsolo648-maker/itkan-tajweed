import { tajweedRules, type TajweedRule } from '@/lib/tajweed-db';
import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TajweedPageProps {
  ayahText?: string;
  surahName?: string;
  ayahNumber?: number;
}

// Detect which tajweed rules apply to a given ayah text
function detectRulesInAyah(text: string): string[] {
  const found: string[] = [];
  // نون ساكنة أو تنوين
  const hasNoonSakinah = /نْ|ً|ٍ|ٌ/.test(text);
  if (hasNoonSakinah) {
    found.push('noon-sakinah');
    // إظهار: نون ساكنة/تنوين + حروف الحلق
    if (/[نْ][ًٌٍ]?\s*[أإءهعحغخ]|[ًٌٍ]\s*[أإءهعحغخ]/.test(text)) found.push('izhhar');
    // إدغام: نون ساكنة/تنوين + يرملون
    if (/نْ\s*[يرملون]|[ًٌٍ]\s*[يرملون]/.test(text)) found.push('idgham');
    // إقلاب: نون ساكنة/تنوين + باء
    if (/نْ\s*ب|[ًٌٍ]\s*ب/.test(text)) found.push('iqlab');
    // إخفاء: نون ساكنة/تنوين + حروف الإخفاء
    if (/نْ\s*[صذثكجشقسدطزفتضظ]|[ًٌٍ]\s*[صذثكجشقسدطزفتضظ]/.test(text)) found.push('ikhfaa');
  }
  // ميم ساكنة
  if (/مْ/.test(text)) found.push('meem-sakinah');
  // مدود
  if (/[اوي]/.test(text)) found.push('madd');
  // تفخيم وترقيق - حروف الاستعلاء
  if (/[خصضغطقظ]/.test(text)) found.push('tafkheem-tarqeeq');
  return [...new Set(found)];
}

export function TajweedPage({ ayahText, surahName, ayahNumber }: TajweedPageProps) {
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const filteredRules = useMemo(() => {
    if (!ayahText) return tajweedRules;
    const ruleIds = detectRulesInAyah(ayahText);
    return tajweedRules.filter(r => ruleIds.includes(r.id));
  }, [ayahText]);

  return (
    <div className="min-h-screen pb-20 pt-4 px-4">
      <h1 className="text-2xl font-bold font-amiri text-center mb-6 text-foreground">
        أحكام التجويد
      </h1>
      {ayahText && (
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <div className="text-xs text-muted-foreground mb-2 font-amiri">
            {surahName} - آية {ayahNumber}
          </div>
          <div className="font-quran text-lg leading-[2.2] text-foreground" dir="rtl">
            {ayahText}
          </div>
        </div>
      )}
      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="space-y-3 pb-4">
          {filteredRules.length === 0 ? (
            <div className="text-center text-muted-foreground font-amiri py-8">
              لم يتم العثور على أحكام تجويد في هذه الآية
            </div>
          ) : filteredRules.map((rule) => {
            const isExpanded = expandedRule === rule.id;
            return (
              <div
                key={rule.id}
                className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
              >
                <button
                  onClick={() =>
                    setExpandedRule(isExpanded ? null : rule.id)
                  }
                  className="w-full flex items-center gap-3 p-4 text-right"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: rule.color }}
                  />
                  <span className="flex-1 font-amiri font-bold text-foreground">
                    {rule.name}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={18} className="text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-sm font-amiri text-foreground/80 leading-relaxed">
                      {rule.definition}
                    </p>

                    <div className="text-xs text-muted-foreground">
                      <span className="font-bold">الحروف: </span>
                      <span className="font-quran text-base">{rule.letters}</span>
                    </div>

                    {ayahText && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-muted-foreground">
                          أمثلة من الآية:
                        </span>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div
                            className="font-quran text-lg text-foreground"
                            style={{ color: rule.color }}
                            dir="rtl"
                          >
                            {ayahText}
                          </div>
                        </div>
                      </div>
                    )}
                    {!ayahText && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-muted-foreground">
                          أمثلة:
                        </span>
                        {rule.examples.map((ex, i) => (
                          <div
                            key={i}
                            className="bg-muted/50 rounded-lg p-3 space-y-1"
                          >
                            <div
                              className="font-quran text-lg text-foreground"
                              style={{ color: rule.color }}
                            >
                              {ex.text}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {ex.surah}
                            </div>
                            <div className="text-xs text-foreground/70">
                              {ex.explanation}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
