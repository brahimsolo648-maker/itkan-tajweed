export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  surahNumber: number;
  surahName: string;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  revelationType: string;
  numberOfAyahs: number;
  firstPage: number;
}

export interface QuranData {
  surahs: Surah[];
  pageMap: Map<number, Ayah[]>;
  juzFirstPage: Map<number, number>;
  surahFirstPage: Map<number, number>;
  totalPages: number;
}

const PRIMARY_API = 'https://api.alquran.cloud/v1/quran/ar.warsh';
const FALLBACK_API = 'https://cdn.jsdelivr.net/npm/quran-json@latest/dist/quran_warsh.json';

// البسملة كما ترد في بداية الآية الأولى من كل سورة (عدا الفاتحة والتوبة)
const BISMILLAH_PREFIX = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

/**
 * Strip البسملة from the beginning of ayah 1 text for surahs other than الفاتحة and التوبة.
 * The API concatenates بسملة with the first ayah text.
 */
export function stripBismillah(text: string, surahNumber: number, numberInSurah: number): string {
  if (numberInSurah !== 1 || surahNumber === 1 || surahNumber === 9) return text;
  // Remove BOM if present
  let cleaned = text.replace(/^\uFEFF/, '');
  if (cleaned.startsWith(BISMILLAH_PREFIX)) {
    cleaned = cleaned.slice(BISMILLAH_PREFIX.length).trim();
  }
  return cleaned;
}

async function fetchFromPrimary(): Promise<any> {
  const res = await fetch(PRIMARY_API);
  if (!res.ok) throw new Error('Primary API failed');
  const json = await res.json();
  return json.data.surahs;
}

async function fetchFromFallback(): Promise<any> {
  const res = await fetch(FALLBACK_API);
  if (!res.ok) throw new Error('Fallback API failed');
  const json = await res.json();
  // The fallback format may differ - normalize it
  if (Array.isArray(json)) return json;
  if (json.data?.surahs) return json.data.surahs;
  if (json.surahs) return json.surahs;
  throw new Error('Unknown fallback format');
}

export async function fetchQuranData(): Promise<QuranData> {
  let rawSurahs: any[];

  try {
    rawSurahs = await fetchFromPrimary();
  } catch (primaryErr) {
    console.warn('Primary API failed, trying fallback...', primaryErr);
    try {
      rawSurahs = await fetchFromFallback();
    } catch (fallbackErr) {
      console.error('Both APIs failed', fallbackErr);
      throw new Error('فشل في تحميل بيانات المصحف من جميع المصادر. يرجى تحديث الصفحة.');
    }
  }

  const surahs: Surah[] = [];
  const pageMap = new Map<number, Ayah[]>();
  const juzFirstPage = new Map<number, number>();
  const surahFirstPage = new Map<number, number>();
  let maxPage = 1;

  for (const s of rawSurahs) {
    const ayahsList = s.ayahs || s.verses || [];
    const firstAyahPage = ayahsList[0]?.page || 1;

    surahs.push({
      number: s.number,
      name: s.name,
      englishName: s.englishName || s.english_name || '',
      revelationType: s.revelationType || s.revelation_type || '',
      numberOfAyahs: s.numberOfAyahs || ayahsList.length,
      firstPage: firstAyahPage,
    });
    surahFirstPage.set(s.number, firstAyahPage);

    for (const a of ayahsList) {
      const ayahPage = a.page || 1;
      const ayahJuz = a.juz || 1;

      const ayah: Ayah = {
        number: a.number,
        text: a.text,
        numberInSurah: a.numberInSurah ?? a.number_in_surah ?? a.verse ?? 0,
        juz: ayahJuz,
        page: ayahPage,
        surahNumber: s.number,
        surahName: s.name,
      };

      if (!pageMap.has(ayahPage)) pageMap.set(ayahPage, []);
      pageMap.get(ayahPage)!.push(ayah);
      if (!juzFirstPage.has(ayahJuz)) juzFirstPage.set(ayahJuz, ayahPage);
      if (ayahPage > maxPage) maxPage = ayahPage;
    }
  }

  // Validate data completeness
  console.log(`Quran data loaded: ${surahs.length} surahs, ${maxPage} pages`);
  if (surahs.length !== 114) {
    console.warn(`Expected 114 surahs but got ${surahs.length}`);
  }

  return { surahs, pageMap, juzFirstPage, surahFirstPage, totalPages: maxPage };
}

export function toArabicNumeral(n: number | undefined | null): string {
  if (n == null) return '';
  return n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

export function padSurahNumber(n: number): string {
  return n.toString().padStart(3, '0');
}

export const RECITERS = {
  husary: { name: 'محمود خليل الحصري', folder: 'Husary_64kbps' },
  abdulbasit: { name: 'عبد الباسط عبد الصمد', folder: 'Abdul_Basit_Murattal_64kbps' },
  alafasy: { name: 'مشاري العفاسي', folder: 'Alafasy_64kbps' },
  minshawi: { name: 'محمد صديق المنشاوي', folder: 'Minshawy_Murattal_128kbps' },
} as const;

export type ReciterId = keyof typeof RECITERS;

export function getAyahAudioUrl(reciter: ReciterId, surahNumber: number, ayahNumber: number): string {
  const s = surahNumber.toString().padStart(3, '0');
  const a = ayahNumber.toString().padStart(3, '0');
  return `https://everyayah.com/data/${RECITERS[reciter].folder}/${s}${a}.mp3`;
}

export function getSurahAudioUrl(reciter: ReciterId, surahNumber: number): string {
  // Play first ayah as fallback for full surah
  return getAyahAudioUrl(reciter, surahNumber, 1);
}
