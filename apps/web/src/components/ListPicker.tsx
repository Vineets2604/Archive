import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "../lib/client";
export function ListPicker({
  anime,
  onClose,
}: {
  anime: any;
  onClose: () => void;
}) {
  const [lists, setLists] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    api("/lists/mine")
      .then((x) => setLists(x.lists || []))
      .catch(() => setMessage("Sign in to use lists."));
  }, []);
  const create = async (e: any) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const x = await api("/lists", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setLists((v) => [x.list, ...v]);
      setName("");
    } catch {
      setMessage("Could not create list.");
    }
  };
  const add = async (list: any) => {
    try {
      await api(`/lists/${list.id}/items`, {
        method: "POST",
        body: JSON.stringify({
          anilistId: Number(anime.anilistId || anime.id),
        }),
      });
      setMessage(`Added to ${list.name}`);
    } catch (e: any) {
      setMessage("Already on this list or unavailable.");
    }
  };
  return (
    <div className="list-picker-backdrop" onClick={onClose}>
      <div className="list-picker" onClick={(e) => e.stopPropagation()}>
        <button className="icon-button" onClick={onClose}>
          <X size={18} />
        </button>
        <p className="eyebrow">CURATE THE ARCHIVE</p>
        <h3>Add to a list</h3>
        {lists.map((list) => (
          <button
            className="list-option"
            key={list.id}
            onClick={() => add(list)}
          >
            {list.name}
            <small>{list._count?.items || 0} titles</small>
          </button>
        ))}
        <form onSubmit={create}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New list name"
          />
          <button className="primary">Create list</button>
        </form>
        {message && <small>{message}</small>}
      </div>
    </div>
  );
}
