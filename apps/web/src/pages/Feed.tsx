import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ActivityItem } from "../components/ActivityItem";
import { api } from "../lib/client";
export function Feed() {
  const [data, setData] = useState<any>();
  const [error, setError] = useState("");
  useEffect(() => {
    api("/feed")
      .then(setData)
      .catch(() => setError("Sign in to see activity from people you follow."));
  }, []);
  return (
    <section className="feed-page">
      <p className="eyebrow">YOUR NETWORK</p>
      <h1>
        What’s
        <br />
        <i>moving.</i>
      </h1>
      {error ? (
        <p className="feed-empty">
          {error} <Link to="/login">Sign in</Link>
        </p>
      ) : !data ? (
        <p className="loading">Loading activity…</p>
      ) : (
        <>
          {data.items.length ? (
            data.items.map((item: any) => (
              <ActivityItem item={item} key={item.id} />
            ))
          ) : (
            <p className="feed-empty">Follow people to build your feed.</p>
          )}
        </>
      )}
    </section>
  );
}
