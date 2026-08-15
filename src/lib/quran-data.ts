/**
 * Quran Data Catalog — Complete metadata for all 114 Surahs and offline seed data.
 */

export type RevelationType = "Meccan" | "Medinan";

export type Ayah = {
  n: number;
  ar: string;
  en: string;
  juz?: number | undefined;
  page?: number | undefined;
};

export type SurahMeta = {
  n: number;
  name: string;
  arabicName: string;
  meaning: string;
  numberOfAyahs: number;
  revelationType: RevelationType;
};

export type SurahDetail = SurahMeta & {
  ayahs: Ayah[];
};

export const ALL_SURAHS: SurahMeta[] = [
  { n: 1, name: "Al-Fatihah", arabicName: "الفاتحة", meaning: "The Opening", numberOfAyahs: 7, revelationType: "Meccan" },
  { n: 2, name: "Al-Baqarah", arabicName: "البقرة", meaning: "The Cow", numberOfAyahs: 286, revelationType: "Medinan" },
  { n: 3, name: "Ali 'Imran", arabicName: "آل عمران", meaning: "Family of Imran", numberOfAyahs: 200, revelationType: "Medinan" },
  { n: 4, name: "An-Nisa", arabicName: "النساء", meaning: "The Women", numberOfAyahs: 176, revelationType: "Medinan" },
  { n: 5, name: "Al-Ma'idah", arabicName: "المائدة", meaning: "The Table Spread", numberOfAyahs: 120, revelationType: "Medinan" },
  { n: 6, name: "Al-An'am", arabicName: "الأنعام", meaning: "The Cattle", numberOfAyahs: 165, revelationType: "Meccan" },
  { n: 7, name: "Al-A'raf", arabicName: "الأعراف", meaning: "The Heights", numberOfAyahs: 206, revelationType: "Meccan" },
  { n: 8, name: "Al-Anfal", arabicName: "الأنفال", meaning: "The Spoils of War", numberOfAyahs: 75, revelationType: "Medinan" },
  { n: 9, name: "At-Tawbah", arabicName: "التوبة", meaning: "The Repentance", numberOfAyahs: 129, revelationType: "Medinan" },
  { n: 10, name: "Yunus", arabicName: "يونس", meaning: "Jonah", numberOfAyahs: 109, revelationType: "Meccan" },
  { n: 11, name: "Hud", arabicName: "هود", meaning: "Hud", numberOfAyahs: 123, revelationType: "Meccan" },
  { n: 12, name: "Yusuf", arabicName: "يوسف", meaning: "Joseph", numberOfAyahs: 111, revelationType: "Meccan" },
  { n: 13, name: "Ar-Ra'd", arabicName: "الرعد", meaning: "The Thunder", numberOfAyahs: 43, revelationType: "Medinan" },
  { n: 14, name: "Ibrahim", arabicName: "إبراهيم", meaning: "Abraham", numberOfAyahs: 52, revelationType: "Meccan" },
  { n: 15, name: "Al-Hijr", arabicName: "الحجر", meaning: "The Rocky Tract", numberOfAyahs: 99, revelationType: "Meccan" },
  { n: 16, name: "An-Nahl", arabicName: "النحل", meaning: "The Bee", numberOfAyahs: 128, revelationType: "Meccan" },
  { n: 17, name: "Al-Isra", arabicName: "الإسراء", meaning: "The Night Journey", numberOfAyahs: 111, revelationType: "Meccan" },
  { n: 18, name: "Al-Kahf", arabicName: "الكهف", meaning: "The Cave", numberOfAyahs: 110, revelationType: "Meccan" },
  { n: 19, name: "Maryam", arabicName: "مريم", meaning: "Mary", numberOfAyahs: 98, revelationType: "Meccan" },
  { n: 20, name: "Ta-Ha", arabicName: "طه", meaning: "Ta-Ha", numberOfAyahs: 135, revelationType: "Meccan" },
  { n: 21, name: "Al-Anbiya", arabicName: "الأنبياء", meaning: "The Prophets", numberOfAyahs: 112, revelationType: "Meccan" },
  { n: 22, name: "Al-Hajj", arabicName: "الحج", meaning: "The Pilgrimage", numberOfAyahs: 78, revelationType: "Medinan" },
  { n: 23, name: "Al-Mu'minun", arabicName: "المؤمنون", meaning: "The Believers", numberOfAyahs: 118, revelationType: "Meccan" },
  { n: 24, name: "An-Nur", arabicName: "النور", meaning: "The Light", numberOfAyahs: 64, revelationType: "Medinan" },
  { n: 25, name: "Al-Furqan", arabicName: "الفرقان", meaning: "The Criterion", numberOfAyahs: 77, revelationType: "Meccan" },
  { n: 26, name: "Ash-Shu'ara", arabicName: "الشعراء", meaning: "The Poets", numberOfAyahs: 227, revelationType: "Meccan" },
  { n: 27, name: "An-Naml", arabicName: "النمل", meaning: "The Ant", numberOfAyahs: 93, revelationType: "Meccan" },
  { n: 28, name: "Al-Qasas", arabicName: "القصص", meaning: "The Stories", numberOfAyahs: 88, revelationType: "Meccan" },
  { n: 29, name: "Al-Ankabut", arabicName: "العنكبوت", meaning: "The Spider", numberOfAyahs: 69, revelationType: "Meccan" },
  { n: 30, name: "Ar-Rum", arabicName: "الروم", meaning: "The Romans", numberOfAyahs: 60, revelationType: "Meccan" },
  { n: 31, name: "Luqman", arabicName: "لقمان", meaning: "Luqman", numberOfAyahs: 34, revelationType: "Meccan" },
  { n: 32, name: "As-Sajdah", arabicName: "السجدة", meaning: "The Prostration", numberOfAyahs: 30, revelationType: "Meccan" },
  { n: 33, name: "Al-Ahzab", arabicName: "الأحزاب", meaning: "The Combined Forces", numberOfAyahs: 73, revelationType: "Medinan" },
  { n: 34, name: "Saba", arabicName: "سبأ", meaning: "Sheba", numberOfAyahs: 54, revelationType: "Meccan" },
  { n: 35, name: "Fatir", arabicName: "فاطر", meaning: "The Originator", numberOfAyahs: 45, revelationType: "Meccan" },
  { n: 36, name: "Ya-Sin", arabicName: "يس", meaning: "Ya-Sin", numberOfAyahs: 83, revelationType: "Meccan" },
  { n: 37, name: "As-Saffat", arabicName: "الصافات", meaning: "Those Who Set The Ranks", numberOfAyahs: 182, revelationType: "Meccan" },
  { n: 38, name: "Sad", arabicName: "ص", meaning: "The Letter Sad", numberOfAyahs: 88, revelationType: "Meccan" },
  { n: 39, name: "Az-Zumar", arabicName: "الزمر", meaning: "The Troops", numberOfAyahs: 75, revelationType: "Meccan" },
  { n: 40, name: "Ghafir", arabicName: "غافر", meaning: "The Forgiver", numberOfAyahs: 85, revelationType: "Meccan" },
  { n: 41, name: "Fussilat", arabicName: "فصلت", meaning: "Explained in Detail", numberOfAyahs: 54, revelationType: "Meccan" },
  { n: 42, name: "Ash-Shura", arabicName: "الشورى", meaning: "The Consultation", numberOfAyahs: 53, revelationType: "Meccan" },
  { n: 43, name: "Az-Zukhruf", arabicName: "الزخرف", meaning: "The Ornaments of Gold", numberOfAyahs: 89, revelationType: "Meccan" },
  { n: 44, name: "Ad-Dukhan", arabicName: "الدخان", meaning: "The Smoke", numberOfAyahs: 59, revelationType: "Meccan" },
  { n: 45, name: "Al-Jathiyah", arabicName: "الجاثية", meaning: "The Crouching", numberOfAyahs: 37, revelationType: "Meccan" },
  { n: 46, name: "Al-Ahqaf", arabicName: "الأحقاف", meaning: "The Wind-Curved Sandhills", numberOfAyahs: 35, revelationType: "Meccan" },
  { n: 47, name: "Muhammad", arabicName: "محمد", meaning: "Muhammad", numberOfAyahs: 38, revelationType: "Medinan" },
  { n: 48, name: "Al-Fath", arabicName: "الفتح", meaning: "The Victory", numberOfAyahs: 29, revelationType: "Medinan" },
  { n: 49, name: "Al-Hujurat", arabicName: "الحجرات", meaning: "The Rooms", numberOfAyahs: 18, revelationType: "Medinan" },
  { n: 50, name: "Qaf", arabicName: "ق", meaning: "The Letter Qaf", numberOfAyahs: 45, revelationType: "Meccan" },
  { n: 51, name: "Adh-Dhariyat", arabicName: "الذاريات", meaning: "The Winnowing Winds", numberOfAyahs: 60, revelationType: "Meccan" },
  { n: 52, name: "At-Tur", arabicName: "الطور", meaning: "The Mount", numberOfAyahs: 49, revelationType: "Meccan" },
  { n: 53, name: "An-Najm", arabicName: "النجم", meaning: "The Star", numberOfAyahs: 62, revelationType: "Meccan" },
  { n: 54, name: "Al-Qamar", arabicName: "القمر", meaning: "The Moon", numberOfAyahs: 55, revelationType: "Meccan" },
  { n: 55, name: "Ar-Rahman", arabicName: "الرحمن", meaning: "The Beneficent", numberOfAyahs: 78, revelationType: "Medinan" },
  { n: 56, name: "Al-Waqi'ah", arabicName: "الواقعة", meaning: "The Inevitable", numberOfAyahs: 96, revelationType: "Meccan" },
  { n: 57, name: "Al-Hadid", arabicName: "الحديد", meaning: "The Iron", numberOfAyahs: 29, revelationType: "Medinan" },
  { n: 58, name: "Al-Mujadila", arabicName: "المجادلة", meaning: "The Pleading Woman", numberOfAyahs: 22, revelationType: "Medinan" },
  { n: 59, name: "Al-Hashr", arabicName: "الحشر", meaning: "The Exile", numberOfAyahs: 24, revelationType: "Medinan" },
  { n: 60, name: "Al-Mumtahanah", arabicName: "الممتحنة", meaning: "She That Is To Be Examined", numberOfAyahs: 13, revelationType: "Medinan" },
  { n: 61, name: "As-Saff", arabicName: "الصف", meaning: "The Ranks", numberOfAyahs: 14, revelationType: "Medinan" },
  { n: 62, name: "Al-Jumu'ah", arabicName: "الجمعة", meaning: "The Congregation", numberOfAyahs: 11, revelationType: "Medinan" },
  { n: 63, name: "Al-Munafiqun", arabicName: "المنافقون", meaning: "The Hypocrites", numberOfAyahs: 11, revelationType: "Medinan" },
  { n: 64, name: "At-Taghabun", arabicName: "التغابن", meaning: "The Mutual Disillusion", numberOfAyahs: 18, revelationType: "Medinan" },
  { n: 65, name: "At-Talaq", arabicName: "الطلاق", meaning: "The Divorce", numberOfAyahs: 12, revelationType: "Medinan" },
  { n: 66, name: "At-Tahrim", arabicName: "التحريم", meaning: "The Prohibition", numberOfAyahs: 12, revelationType: "Medinan" },
  { n: 67, name: "Al-Mulk", arabicName: "الملك", meaning: "The Sovereignty", numberOfAyahs: 30, revelationType: "Meccan" },
  { n: 68, name: "Al-Qalam", arabicName: "القلم", meaning: "The Pen", numberOfAyahs: 52, revelationType: "Meccan" },
  { n: 69, name: "Al-Haqqah", arabicName: "الحاقة", meaning: "The Reality", numberOfAyahs: 52, revelationType: "Meccan" },
  { n: 70, name: "Al-Ma'arij", arabicName: "المعارج", meaning: "The Ascending Stairways", numberOfAyahs: 44, revelationType: "Meccan" },
  { n: 71, name: "Nuh", arabicName: "نوح", meaning: "Noah", numberOfAyahs: 28, revelationType: "Meccan" },
  { n: 72, name: "Al-Jinn", arabicName: "الجن", meaning: "The Jinn", numberOfAyahs: 28, revelationType: "Meccan" },
  { n: 73, name: "Al-Muzzammil", arabicName: "المزمل", meaning: "The Enshrouded One", numberOfAyahs: 20, revelationType: "Meccan" },
  { n: 74, name: "Al-Muddaththir", arabicName: "المدثر", meaning: "The Cloaked One", numberOfAyahs: 56, revelationType: "Meccan" },
  { n: 75, name: "Al-Qiyamah", arabicName: "القيامة", meaning: "The Resurrection", numberOfAyahs: 40, revelationType: "Meccan" },
  { n: 76, name: "Al-Insan", arabicName: "الإنسان", meaning: "The Human", numberOfAyahs: 31, revelationType: "Medinan" },
  { n: 77, name: "Al-Mursalat", arabicName: "المرسلات", meaning: "The Emissaries", numberOfAyahs: 50, revelationType: "Meccan" },
  { n: 78, name: "An-Naba", arabicName: "النبأ", meaning: "The Tidings", numberOfAyahs: 40, revelationType: "Meccan" },
  { n: 79, name: "An-Nazi'at", arabicName: "النازعات", meaning: "Those Who Drag Forth", numberOfAyahs: 46, revelationType: "Meccan" },
  { n: 80, name: "Abasa", arabicName: "عبس", meaning: "He Frowned", numberOfAyahs: 42, revelationType: "Meccan" },
  { n: 81, name: "At-Takwir", arabicName: "التكوير", meaning: "The Overthrowing", numberOfAyahs: 29, revelationType: "Meccan" },
  { n: 82, name: "Al-Infitar", arabicName: "الانفطار", meaning: "The Cleaving", numberOfAyahs: 19, revelationType: "Meccan" },
  { n: 83, name: "Al-Mutaffifin", arabicName: "المطففين", meaning: "The Defrauding", numberOfAyahs: 36, revelationType: "Meccan" },
  { n: 84, name: "Al-Inshiqaq", arabicName: "الانشقاق", meaning: "The Splitting Open", numberOfAyahs: 25, revelationType: "Meccan" },
  { n: 85, name: "Al-Buruj", arabicName: "البروج", meaning: "The Mansions of the Stars", numberOfAyahs: 22, revelationType: "Meccan" },
  { n: 86, name: "At-Tariq", arabicName: "الطارق", meaning: "The Nightcomer", numberOfAyahs: 17, revelationType: "Meccan" },
  { n: 87, name: "Al-A'la", arabicName: "الأعلى", meaning: "The Most High", numberOfAyahs: 19, revelationType: "Meccan" },
  { n: 88, name: "Al-Ghashiyah", arabicName: "الغاشية", meaning: "The Overwhelming", numberOfAyahs: 26, revelationType: "Meccan" },
  { n: 89, name: "Al-Fajr", arabicName: "الفجر", meaning: "The Dawn", numberOfAyahs: 30, revelationType: "Meccan" },
  { n: 90, name: "Al-Balad", arabicName: "البلد", meaning: "The City", numberOfAyahs: 20, revelationType: "Meccan" },
  { n: 91, name: "Ash-Shams", arabicName: "الشمس", meaning: "The Sun", numberOfAyahs: 15, revelationType: "Meccan" },
  { n: 92, name: "Al-Layl", arabicName: "الليل", meaning: "The Night", numberOfAyahs: 21, revelationType: "Meccan" },
  { n: 93, name: "Ad-Duha", arabicName: "الضحى", meaning: "The Morning Hours", numberOfAyahs: 11, revelationType: "Meccan" },
  { n: 94, name: "Ash-Sharh", arabicName: "الشرح", meaning: "The Relief", numberOfAyahs: 8, revelationType: "Meccan" },
  { n: 95, name: "At-Tin", arabicName: "التين", meaning: "The Fig", numberOfAyahs: 8, revelationType: "Meccan" },
  { n: 96, name: "Al-Alaq", arabicName: "العلق", meaning: "The Clot", numberOfAyahs: 19, revelationType: "Meccan" },
  { n: 97, name: "Al-Qadr", arabicName: "القدر", meaning: "The Power", numberOfAyahs: 5, revelationType: "Meccan" },
  { n: 98, name: "Al-Bayyinah", arabicName: "البينة", meaning: "The Clear Proof", numberOfAyahs: 8, revelationType: "Medinan" },
  { n: 99, name: "Az-Zalzalah", arabicName: "الزلزلة", meaning: "The Earthquake", numberOfAyahs: 8, revelationType: "Medinan" },
  { n: 100, name: "Al-Adiyat", arabicName: "العاديات", meaning: "The Courser", numberOfAyahs: 11, revelationType: "Meccan" },
  { n: 101, name: "Al-Qari'ah", arabicName: "القارعة", meaning: "The Calamity", numberOfAyahs: 11, revelationType: "Meccan" },
  { n: 102, name: "At-Takathur", arabicName: "التكاثر", meaning: "The Rivalry in World Increase", numberOfAyahs: 8, revelationType: "Meccan" },
  { n: 103, name: "Al-Asr", arabicName: "العصر", meaning: "The Declining Day", numberOfAyahs: 3, revelationType: "Meccan" },
  { n: 104, name: "Al-Humazah", arabicName: "الهمزة", meaning: "The Traducer", numberOfAyahs: 9, revelationType: "Meccan" },
  { n: 105, name: "Al-Fil", arabicName: "الفيل", meaning: "The Elephant", numberOfAyahs: 5, revelationType: "Meccan" },
  { n: 106, name: "Quraysh", arabicName: "قريش", meaning: "Quraysh", numberOfAyahs: 4, revelationType: "Meccan" },
  { n: 107, name: "Al-Ma'un", arabicName: "الماعون", meaning: "The Small Kindnesses", numberOfAyahs: 7, revelationType: "Meccan" },
  { n: 108, name: "Al-Kawthar", arabicName: "الكوثر", meaning: "The Abundance", numberOfAyahs: 3, revelationType: "Meccan" },
  { n: 109, name: "Al-Kafirun", arabicName: "الكافرون", meaning: "The Disbelievers", numberOfAyahs: 6, revelationType: "Meccan" },
  { n: 110, name: "An-Nasr", arabicName: "النصر", meaning: "The Divine Support", numberOfAyahs: 3, revelationType: "Medinan" },
  { n: 111, name: "Al-Masad", arabicName: "المسد", meaning: "The Palm Fiber", numberOfAyahs: 5, revelationType: "Meccan" },
  { n: 112, name: "Al-Ikhlas", arabicName: "الإخلاص", meaning: "Sincerity", numberOfAyahs: 4, revelationType: "Meccan" },
  { n: 113, name: "Al-Falaq", arabicName: "الفلق", meaning: "The Daybreak", numberOfAyahs: 5, revelationType: "Meccan" },
  { n: 114, name: "An-Nas", arabicName: "الناس", meaning: "Mankind", numberOfAyahs: 6, revelationType: "Meccan" },
];

export const INITIAL_OFFLINE_SURAHS: Record<number, SurahDetail> = {
  1: {
    n: 1,
    name: "Al-Fatihah",
    arabicName: "الفاتحة",
    meaning: "The Opening",
    numberOfAyahs: 7,
    revelationType: "Meccan",
    ayahs: [
      { n: 1, ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", en: "In the name of Allah, the Entirely Merciful, the Especially Merciful." },
      { n: 2, ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", en: "All praise is due to Allah, Lord of the worlds." },
      { n: 3, ar: "الرَّحْمَٰنِ الرَّحِيمِ", en: "The Entirely Merciful, the Especially Merciful." },
      { n: 4, ar: "مَالِكِ يَوْمِ الدِّينِ", en: "Sovereign of the Day of Recompense." },
      { n: 5, ar: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", en: "It is You we worship and You we ask for help." },
      { n: 6, ar: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", en: "Guide us to the straight path." },
      { n: 7, ar: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", en: "The path of those upon whom You have bestowed favour, not of those who have earned Your anger, nor of those who go astray." },
    ],
  },
  108: {
    n: 108,
    name: "Al-Kawthar",
    arabicName: "الكوثر",
    meaning: "The Abundance",
    numberOfAyahs: 3,
    revelationType: "Meccan",
    ayahs: [
      { n: 1, ar: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ", en: "Indeed, We have granted you, [O Muhammad], al-Kawthar." },
      { n: 2, ar: "فَصَلِّ لِرَبِّكَ وَانْحَرْ", en: "So pray to your Lord and sacrifice [to Him alone]." },
      { n: 3, ar: "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ", en: "Indeed, your enemy is the one cut off." },
    ],
  },
  112: {
    n: 112,
    name: "Al-Ikhlas",
    arabicName: "الإخلاص",
    meaning: "Sincerity",
    numberOfAyahs: 4,
    revelationType: "Meccan",
    ayahs: [
      { n: 1, ar: "قُلْ هُوَ اللَّهُ أَحَدٌ", en: "Say, He is Allah, [who is] One." },
      { n: 2, ar: "اللَّهُ الصَّمَدُ", en: "Allah, the Eternal Refuge." },
      { n: 3, ar: "لَمْ يَلِدْ وَلَمْ يُولَدْ", en: "He neither begets nor is born." },
      { n: 4, ar: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", en: "Nor is there to Him any equivalent." },
    ],
  },
  113: {
    n: 113,
    name: "Al-Falaq",
    arabicName: "الفلق",
    meaning: "The Daybreak",
    numberOfAyahs: 5,
    revelationType: "Meccan",
    ayahs: [
      { n: 1, ar: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ", en: "Say, I seek refuge in the Lord of daybreak." },
      { n: 2, ar: "مِن شَرِّ مَا خَلَقَ", en: "From the evil of that which He created." },
      { n: 3, ar: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ", en: "And from the evil of darkness when it settles." },
      { n: 4, ar: "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ", en: "And from the evil of the blowers in knots." },
      { n: 5, ar: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", en: "And from the evil of an envier when he envies." },
    ],
  },
  114: {
    n: 114,
    name: "An-Nas",
    arabicName: "الناس",
    meaning: "Mankind",
    numberOfAyahs: 6,
    revelationType: "Meccan",
    ayahs: [
      { n: 1, ar: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ", en: "Say, I seek refuge in the Lord of mankind." },
      { n: 2, ar: "مَلِكِ النَّاسِ", en: "The Sovereign of mankind." },
      { n: 3, ar: "إِلَٰهِ النَّاسِ", en: "The God of mankind." },
      { n: 4, ar: "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ", en: "From the evil of the retreating whisperer." },
      { n: 5, ar: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ", en: "Who whispers into the breasts of mankind." },
      { n: 6, ar: "مِنَ الْجِنَّةِ وَالنَّاسِ", en: "From among the jinn and mankind." },
    ],
  },
};

export function getSurahMeta(n: number): SurahMeta | undefined {
  return ALL_SURAHS.find((s) => s.n === n);
}

export function searchSurahs(query: string): SurahMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_SURAHS;

  const num = parseInt(q, 10);
  if (!isNaN(num)) {
    const byNum = ALL_SURAHS.filter((s) => s.n === num || s.n.toString().includes(q));
    if (byNum.length > 0) return byNum;
  }

  return ALL_SURAHS.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.meaning.toLowerCase().includes(q) ||
      s.arabicName.includes(q)
  );
}
