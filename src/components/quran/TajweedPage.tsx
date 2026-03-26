import { tajweedRules } from '@/lib/tajweed-db';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TajweedPage() {
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  return (
    <div className="min-h-screen pb-20 pt-4 px-4">
      <h1 className="text-2xl font-bold font-amiri text-center mb-6 text-foreground">
        أحكام التجويد
      </h1>
      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="space-y-3 pb-4">
          {tajweedRules.map((rule) => {
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
