import { useState } from "react";
import { ReviewLikeButton } from "./ReviewLikeButton";
export function SpoilerReview({
  review,
  compact = false,
}: {
  review: any;
  compact?: boolean;
}) {
  const [revealed, setRevealed] = useState(!review.containsSpoilers);
  return (
    <article
      className={`spoiler-review ${review.containsSpoilers && !revealed ? "is-hidden" : ""} ${compact ? "is-compact" : ""}`}
    >
      <div className="spoiler-review-meta">
        <b>{review.user?.username || review.actor?.username || "Anonymous"}</b>
        <span>{review.rating}/10</span>
        <ReviewLikeButton review={review} />
      </div>
      {review.containsSpoilers && !revealed ? (
        <button className="spoiler-reveal" onClick={() => setRevealed(true)}>
          Show spoiler
        </button>
      ) : (
        <p>{review.body}</p>
      )}
    </article>
  );
}
