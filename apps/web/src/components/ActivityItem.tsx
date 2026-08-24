import { Link } from "react-router-dom";
import { assetUrl } from "../lib/client";
import { SpoilerReview } from "./SpoilerReview";
export function ActivityItem({ item }: { item: any }) {
  if (item.type === "review_created" && item.target)
    return (
      <div className="activity-item">
        <div className="activity-actor">
          <img src={assetUrl(item.actor.avatarUrl)} alt="" />
          <Link to={`/profile/${item.actor.username}`}>
            {item.actor.username}
          </Link>
          <span>reviewed</span>
          <Link to={`/anime/${item.target.anime.anilistId}`}>
            {item.target.anime.titleEnglish || item.target.anime.titleRomaji}
          </Link>
        </div>
        <SpoilerReview review={{ ...item.target, user: item.actor }} compact />
      </div>
    );
  if (item.type === "portfolio_added" && item.target)
    return (
      <div className="activity-item">
        <div className="activity-actor">
          <img src={assetUrl(item.actor.avatarUrl)} alt="" />
          <Link to={`/profile/${item.actor.username}`}>
            {item.actor.username}
          </Link>
          <span>added to their portfolio</span>
          <Link to={`/anime/${item.target.anilistId}`}>
            {item.target.titleEnglish || item.target.titleRomaji}
          </Link>
        </div>
        <small>{item.metadata?.status?.replaceAll("_", " ")}</small>
      </div>
    );
  if (item.type === "followed_user" && item.target)
    return (
      <div className="activity-item">
        <div className="activity-actor">
          <img src={assetUrl(item.actor.avatarUrl)} alt="" />
          <Link to={`/profile/${item.actor.username}`}>
            {item.actor.username}
          </Link>
          <span>followed</span>
          <Link to={`/profile/${item.target.username}`}>
            {item.target.username}
          </Link>
        </div>
      </div>
    );
  return null;
}
