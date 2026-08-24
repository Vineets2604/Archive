import { db } from "./db";
export const SEARCH_TTL_MS = 15 * 60 * 1000;
export const DETAIL_TTL_MS = 24 * 60 * 60 * 1000;
const endpoint = "https://graphql.anilist.co";
const searchQuery = `query($search:String){Page(perPage:20){media(search:$search,type:ANIME,sort:POPULARITY_DESC){id title{romaji english native} coverImage{large} averageScore episodes genres}}}`;
const detailQuery = `query($id:Int){Media(id:$id,type:ANIME){id title{romaji english native} coverImage{large} bannerImage description genres episodes averageScore studios(isMain:true){nodes{name}}}}`;
const seasonalQuery = `query($season:MediaSeason,$seasonYear:Int){Page(perPage:20){media(season:$season,seasonYear:$seasonYear,type:ANIME,sort:POPULARITY_DESC){id title{romaji english native} coverImage{large} bannerImage averageScore episodes genres}}}`;
async function upstream(query: string, variables: object) {
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!r.ok) throw new Error("AniList unavailable");
  const j = (await r.json()) as any;
  return j.data;
}
async function cached(key: string, ttl: number, load: () => Promise<any>) {
  try {
    const hit = await db.animeCache.findUnique({ where: { cacheKey: key } });
    if (hit && hit.expiresAt > new Date()) return hit.payload;
    const payload = await load();
    await db.animeCache.upsert({
      where: { cacheKey: key },
      create: { cacheKey: key, payload, expiresAt: new Date(Date.now() + ttl) },
      update: { payload, expiresAt: new Date(Date.now() + ttl) },
    });
    return payload;
  } catch (error) {
    return load();
  }
}
async function jikanSearch(search: string) {
  const r = await fetch(
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(
      search
    )}&limit=20&sfw=true`
  );
  if (!r.ok) throw new Error("Search providers unavailable");
  const j = (await r.json()) as any;
  return j.data.map((m: any) => ({
    id: m.mal_id,
    title: {
      romaji: m.title_english || m.title,
      english: m.title_english,
      native: m.title_japanese,
    },
    coverImage: {
      large: m.images?.jpg?.large_image_url || m.images?.jpg?.image_url,
    },
    averageScore: m.score ? Math.round(m.score * 10) : null,
    episodes: m.episodes,
    genres: m.genres?.map((g: any) => g.name) || [],
    source: "jikan",
  }));
}
export async function searchAnime(search: string) {
  const clean = search.trim();
  if (!clean) return [];
  try {
    const data = await cached(
      `search:${clean.toLowerCase()}`,
      SEARCH_TTL_MS,
      () => upstream(searchQuery, { search: clean })
    );
    return (data as any).Page.media;
  } catch {
    return jikanSearch(clean);
  }
}
export async function getAnime(anilistId: number) {
  const data = await cached(`detail:${anilistId}`, DETAIL_TTL_MS, () =>
    upstream(detailQuery, { id: anilistId })
  );
  const m = (data as any).Media;
  if (!m) return null;
  const record = normalize(m);
  try {
    return await db.anime.upsert({
      where: { anilistId },
      create: record,
      update: { ...record, cachedAt: new Date() },
    });
  } catch {
    return { id: String(anilistId), ...record };
  }
}
export type AnimeSeason = 'WINTER'|'SPRING'|'SUMMER'|'FALL';
export function getAnimeSeason(date = new Date()): {season: AnimeSeason; year: number} {
  const month = date.getMonth();
  return {season: month < 3 ? 'WINTER' : month < 6 ? 'SPRING' : month < 9 ? 'SUMMER' : 'FALL', year: date.getFullYear()};
}
export async function getSeasonalAnime(season?: AnimeSeason, year?: number) {
  const current = getAnimeSeason();
  const selectedSeason = season || current.season;
  const selectedYear = year || current.year;
  const data = await cached(`seasonal:${selectedSeason}:${selectedYear}`, DETAIL_TTL_MS, () => upstream(seasonalQuery, {season: selectedSeason, seasonYear: selectedYear}));
  return (data as any).Page?.media || [];
}
function normalize(m: any) {
  return {
    anilistId: m.id,
    titleRomaji: m.title.romaji,
    titleEnglish: m.title.english,
    titleNative: m.title.native,
    coverImage: m.coverImage?.large,
    bannerImage: m.bannerImage,
    synopsis: m.description,
    genres: m.genres || [],
    studio: m.studios?.nodes?.[0]?.name,
    episodeCount: m.episodes,
    anilistScore: m.averageScore,
  };
}
