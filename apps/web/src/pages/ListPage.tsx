import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, assetUrl } from "../lib/client";
export function ListPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>();
  const [name, setName] = useState("");
  useEffect(() => {
    api(`/lists/${id}`).then((x) => {
      setData(x);
      setName(x.list.name);
    });
  }, [id]);
  if (!data) return <p className="loading">Loading list…</p>;
  const list = data.list;
  const save = async () => {
    const x = await api(`/lists/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    setData((v: any) => ({ ...v, list: { ...v.list, ...x.list } }));
  };
  const remove = async (item: any) => {
    await api(`/lists/${id}/items/${item.anime.id}`, { method: "DELETE" });
    setData((v: any) => ({
      ...v,
      list: {
        ...v.list,
        items: v.list.items.filter((x: any) => x.id !== item.id),
      },
    }));
  };
  return (
    <section className="portfolio list-page">
      <p className="eyebrow">
        CUSTOM LIST / {list.isPublic ? "PUBLIC" : "PRIVATE"}
      </p>
      {list.isOwner ? (
        <div className="list-edit">
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <button className="primary" onClick={save}>
            Save
          </button>
        </div>
      ) : (
        <h1>{list.name}</h1>
      )}
      <p className="lede">
        {list.description || "A curated shelf from the archive."}
      </p>
      <p>
        By{" "}
        <Link to={`/profile/${list.user.username}`}>{list.user.username}</Link>{" "}
        · {list.items.length} titles
      </p>
      <div className="anime-grid">
        {list.items.map((item: any) => (
          <div key={item.id}>
            <Link className="anime-tile" to={`/anime/${item.anime.anilistId}`}>
              <img src={assetUrl(item.anime.coverImage)} alt="" />
              <div>
                <h3>{item.anime.titleEnglish || item.anime.titleRomaji}</h3>
                <p>{item.note}</p>
              </div>
            </Link>
            {list.isOwner && (
              <button className="list-add-button" onClick={() => remove(item)}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
