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

export async function fetchQuranData(): Promise<QuranData> {
  const res = await fetch('https://api.alquran.cloud/v1/quran/ar.warsh');
  if (!res.ok) throw new Error('فشل في تحميل بيانات المصحف');
  const json = await res.json();

  const surahs: Surah[] = [];
  const pageMap = new Map<number, Ayah[]>();
  const juzFirstPage = new Map<number, number>();
  const surahFirstPage = new Map<number, number>();
  let maxPage = 1;

  for (const s of json.data.surahs) {
    const firstAyahPage = s.ayahs[0]?.page || 1;
    surahs.push({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      revelationType: s.revelationType,
      numberOfAyahs: s.numberOfAyahs,
      firstPage: firstAyahPage,
    });
    surahFirstPage.set(s.number, firstAyahPage);

    for (const a of s.ayahs) {
      const ayah: Ayah = {
        number: a.number,
        text: a.text,
        numberInSurah: a.numberInSurah,
        juz: a.juz,
        page: a.page,
        surahNumber: s.number,
        surahName: s.name,
      };
      if (!pageMap.has(a.page)) pageMap.set(a.page, []);
      pageMap.get(a.page)!.push(ayah);
      if (!juzFirstPage.has(a.juz)) juzFirstPage.set(a.juz, a.page);
      if (a.page > maxPage) maxPage = a.page;
    }
  }

  return { surahs, pageMap, juzFirstPage, surahFirstPage, totalPages: maxPage };
}

export function toArabicNumeral(n: number): string {
  return n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

export function padSurahNumber(n: number): string {
  return n.toString().padStart(3, '0');
}

export const RECITERS = {
  alaa: { name: 'آلاء', baseUrl: 'https://server7.mp3quran.net/alaa/' },
  huthfi_w: { name: 'أحمد الحذيفي', baseUrl: 'https://server8.mp3quran.net/huthfi_w/' },
  ayub_w: { name: 'محمد أيوب', baseUrl: 'https://server8.mp3quran.net/ayub_w/' },
  qazabri: { name: 'عمر القزابري', baseUrl: 'https://server13.mp3quran.net/qazabri/' },
} as const;

export type ReciterId = keyof typeof RECITERS;

export function getSurahAudioUrl(reciter: ReciterId, surahNumber: number): string {
  return `${RECITERS[reciter].baseUrl}${padSurahNumber(surahNumber)}.mp3`;
}
