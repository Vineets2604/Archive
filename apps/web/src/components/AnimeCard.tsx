import { Link } from "react-router-dom";
import { ArrowUpRight, ListPlus } from "lucide-react";
import { useState } from "react";
import { ListPicker } from "./ListPicker";
export function AnimeCard({ anime }: { anime: any }) {
  const [lists, setLists] = useState(false);
  const title =
    anime.title?.english ||
    anime.title?.romaji ||
    anime.titleEnglish ||
    anime.titleRomaji;
  const image = anime.coverImage?.large || anime.coverImage;
  const id = anime.id || anime.anilistId;
  return (
    <div className="anime-card">
      <Link to={`/anime/${id}`} className="anime-tile">
        <img src={image} alt="" />
        <div>
          <h3>{title}</h3>
          <p>{anime.genres?.slice(0, 2).join(" · ")}</p>
        </div>
        <ArrowUpRight size={18} />
      </Link>
      {localStorage.token && (
        <button className="list-add-button" onClick={() => setLists(true)}>
          <ListPlus size={15} /> Add to list
        </button>
      )}
      {lists && <ListPicker anime={anime} onClose={() => setLists(false)} />}
    </div>
  );
}
