import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ALL_SURAHS, INITIAL_OFFLINE_SURAHS, getSurahMeta, searchSurahs } from "./quran-data";
import { fetchSurah, getSurahCached, isSurahCached, preloadBookmarkedSurahs } from "./quran-service";

describe("Quran Data Catalog", () => {
  test("contains all 114 Surahs with complete metadata", () => {
    assert.equal(ALL_SURAHS.length, 114, "Quran has exactly 114 Surahs");

    for (let i = 1; i <= 114; i++) {
      const surah = ALL_SURAHS[i - 1];
      assert.ok(surah, `Surah ${i} must exist`);
      assert.equal(surah.n, i);
      assert.ok(surah.name.length > 0, `Surah ${i} must have transliterated name`);
      assert.ok(surah.arabicName.length > 0, `Surah ${i} must have Arabic name`);
      assert.ok(surah.meaning.length > 0, `Surah ${i} must have meaning`);
      assert.ok(surah.numberOfAyahs > 0, `Surah ${i} must have ayahs`);
      assert.ok(
        surah.revelationType === "Meccan" || surah.revelationType === "Medinan",
        `Surah ${i} revelation type must be Meccan or Medinan`
      );
    }
  });

  test("getSurahMeta returns correct surah", () => {
    const fatihah = getSurahMeta(1);
    assert.equal(fatihah?.name, "Al-Fatihah");
    assert.equal(fatihah?.numberOfAyahs, 7);

    const ikhlas = getSurahMeta(112);
    assert.equal(ikhlas?.name, "Al-Ikhlas");
    assert.equal(ikhlas?.numberOfAyahs, 4);

    const nonExistent = getSurahMeta(999);
    assert.equal(nonExistent, undefined);
  });

  test("searchSurahs filters by name, number, meaning and arabic text", () => {
    // By number
    const byNum = searchSurahs("18");
    assert.ok(byNum.some((s) => s.n === 18 && s.name === "Al-Kahf"));

    // By name
    const byName = searchSurahs("Yusuf");
    assert.equal(byName.length, 1);
    assert.equal(byName[0]?.n, 12);

    // By meaning
    const byMeaning = searchSurahs("Opening");
    assert.ok(byMeaning.some((s) => s.n === 1));

    // By Arabic name
    const byArabic = searchSurahs("الفاتحة");
    assert.ok(byArabic.some((s) => s.n === 1));

    // Empty search returns all
    assert.equal(searchSurahs("").length, 114);
  });

  test("INITIAL_OFFLINE_SURAHS contains essential seed surahs", () => {
    assert.ok(INITIAL_OFFLINE_SURAHS[1], "Al-Fatihah must be seeded");
    assert.equal(INITIAL_OFFLINE_SURAHS[1].ayahs.length, 7);

    assert.ok(INITIAL_OFFLINE_SURAHS[112], "Al-Ikhlas must be seeded");
    assert.equal(INITIAL_OFFLINE_SURAHS[112].ayahs.length, 4);

    assert.ok(INITIAL_OFFLINE_SURAHS[113], "Al-Falaq must be seeded");
    assert.equal(INITIAL_OFFLINE_SURAHS[113].ayahs.length, 5);

    assert.ok(INITIAL_OFFLINE_SURAHS[114], "An-Nas must be seeded");
    assert.equal(INITIAL_OFFLINE_SURAHS[114].ayahs.length, 6);
  });
});

describe("Quran Service Layer", () => {
  test("getSurahCached returns seeded offline Surahs without network", () => {
    const fatihah = getSurahCached(1);
    assert.ok(fatihah);
    assert.equal(fatihah.n, 1);
    assert.equal(fatihah.ayahs.length, 7);
    assert.ok(fatihah.ayahs[0]?.ar.includes("الرَّحِيمِ"));
    assert.ok(fatihah.ayahs[0]?.en.includes("Merciful"));
  });

  test("isSurahCached reports true for seeded surahs", () => {
    assert.equal(isSurahCached(1), true);
    assert.equal(isSurahCached(112), true);
    assert.equal(isSurahCached(113), true);
    assert.equal(isSurahCached(114), true);
  });

  test("fetchSurah rejects out of bound surah numbers", async () => {
    await assert.rejects(async () => fetchSurah(0), /Invalid Surah number/);
    await assert.rejects(async () => fetchSurah(115), /Invalid Surah number/);
    await assert.rejects(async () => fetchSurah(-5), /Invalid Surah number/);
  });

  test("preloadBookmarkedSurahs handles empty or valid bookmarks safely", async () => {
    await preloadBookmarkedSurahs([]);
    await preloadBookmarkedSurahs(["1:1", "112:3", "113:5"]);
    assert.equal(isSurahCached(1), true);
    assert.equal(isSurahCached(112), true);
  });
});
