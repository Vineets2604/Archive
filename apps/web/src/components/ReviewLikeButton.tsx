import { useState } from "react";
import { Heart } from "lucide-react";
import { api } from "../lib/client";
export function ReviewLikeButton({ review }: { review: any }) {
  const [count, setCount] = useState(review.likeCount || 0);
  const [liked, setLiked] = useState(!!review.likedByMe);
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    if (busy || !localStorage.token) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setCount((value: number) => value + (next ? 1 : -1));
    try {
      await api(`/reviews/${review.id}/like`, {
        method: next ? "POST" : "DELETE",
      });
    } catch {
      setLiked(!next);
      setCount((value: number) => value + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      className={`like-button ${liked ? "liked" : ""}`}
      onClick={toggle}
      disabled={busy}
      title={localStorage.token ? "Like review" : "Sign in to like"}
    >
      <Heart size={14} fill={liked ? "currentColor" : "none"} />
      {count}
    </button>
  );
}
