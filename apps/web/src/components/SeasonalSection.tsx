import { useEffect, useState } from "react";
import { AnimeCard } from "./AnimeCard";
import { api } from "../lib/client";
export function SeasonalSection() {
  const [data, setData] = useState<any>();
  useEffect(() => {
    api("/anime/seasonal")
      .then(setData)
      .catch(() => {});
  }, []);
  if (!data?.results?.length) return null;
  return (
    <section className="seasonal-section">
      <div className="section-head">
        <div>
          <p className="eyebrow">
            NOW IN ROTATION / {data.season} {data.year}
          </p>
          <h2>Seasonal pulse</h2>
        </div>
        <span>Cached daily</span>
      </div>
      <div className="seasonal-grid">
        {data.results.map((anime: any) => (
          <AnimeCard key={anime.id} anime={anime} />
        ))}
      </div>
    </section>
  );
}
