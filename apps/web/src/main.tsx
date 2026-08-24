import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  Search,
  ArrowUpRight,
  Star,
  Plus,
  Compass,
  Library,
  UserRound,
} from "lucide-react";
import "./styles.css";
import "./video.css";
import {SpoilerReview} from "./components/SpoilerReview";
import {ProfileStats} from "./components/ProfileStats";
import {Feed} from "./pages/Feed";
import {ActivityItem} from "./components/ActivityItem";
import {SeasonalSection} from "./components/SeasonalSection";
import {ListPicker} from "./components/ListPicker";
import {ListPage} from "./pages/ListPage";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_ORIGIN = API.replace(/\/api\/?$/, "");
const assetUrl = (value?: string | null) =>
  value?.startsWith("/") ? `${API_ORIGIN}${value}` : value || "";
const api = (p: string, o: RequestInit = {}) => {
  const isForm = o.body instanceof FormData;
  return fetch(API + p, {
    ...o,
    headers: {
      ...(isForm ? {} : { "content-type": "application/json" }),
      ...(o.headers || {}),
      ...(localStorage.token
        ? { authorization: `Bearer ${localStorage.token}` }
        : {}),
    },
  }).then((r) => (r.ok ? r.json() : Promise.reject(r)));
};
function Atmosphere() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!,
      x = c.getContext("2d")!;
    let w = 0,
      h = 0,
      pts: Array<{ x: number; y: number; r: number; v: number }> = [];
    const resize = () => {
      w = c.width = innerWidth * devicePixelRatio;
      h = c.height = innerHeight * devicePixelRatio;
      x.scale(devicePixelRatio, devicePixelRatio);
      pts = Array.from({ length: 55 }, () => ({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        r: Math.random() * 2,
        v: 0.15 + Math.random() * 0.3,
      }));
    };
    resize();
    addEventListener("resize", resize);
    let id = 0;
    const draw = () => {
      x.clearRect(0, 0, innerWidth, innerHeight);
      pts.forEach((p) => {
        p.y -= p.v;
        if (p.y < 0) p.y = innerHeight;
        x.fillStyle = "rgba(206,186,255,.28)";
        x.beginPath();
        x.arc(p.x, p.y, p.r, 0, 7);
        x.fill();
      });
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(id);
      removeEventListener("resize", resize);
    };
  }, []);
  return <canvas className="atmosphere" ref={ref} />;
}
function Nav() {
  const [me, setMe] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (localStorage.token)
      api("/auth/me")
        .then((x) => setMe(x.user))
        .catch(() => {
          localStorage.removeItem("token");
          setMe(null);
        });
  }, []);
  return (
    <header>
      <Link className="brand" to="/">
        <span>OTA</span>KU ARCHIVE
      </Link>
      <nav>
        <Link to="/">
          <Compass size={16} />
          Discover
        </Link>
        <Link to="/people">
          <UserRound size={16} />
          People
        </Link>
        <Link to="/feed">
          <Library size={16} />
          Feed
        </Link>
        <Link to="/portfolio">
          <Library size={16} />
          Portfolio
        </Link>
      </nav>
      {me ? (
        <div className="account-menu-wrap">
          <button className="profile-link profile-chip account-trigger" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-haspopup="menu">
            {me.avatarUrl ? <img src={assetUrl(me.avatarUrl)} alt="" /> : <UserRound size={18} />}
            <span>{me.username}</span>
          </button>
          {menuOpen && <div className="account-menu" role="menu">
            <Link to={`/profile/${me.username}`} onClick={() => setMenuOpen(false)}>View profile</Link>
            <Link to="/portfolio" onClick={() => setMenuOpen(false)}>Portfolio</Link>
            <button role="menuitem" onClick={() => { localStorage.removeItem("token"); setMe(null); setMenuOpen(false); navigate("/"); }}>Sign out</button>
          </div>}
        </div>
      ) : (
        <Link className="profile-link" to="/login">
          <UserRound size={18} />
          <span>Sign in</span>
        </Link>
      )}
    </header>
  );
}
function youtubeId(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0];
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const parts = url.pathname.split("/");
      const index = parts.findIndex(
        (part) => part === "embed" || part === "shorts" || part === "live",
      );
      if (index >= 0) return parts[index + 1] || null;
    }
  } catch {}
  return null;
}
function BackgroundVisual() {
  const video = import.meta.env.VITE_BACKGROUND_VIDEO_URL || "";
  const youtube = video ? youtubeId(video) : null;
  return (
    <>
      {youtube ? (
        <iframe
          className="youtube-background"
          src={`https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtube}&playsinline=1&rel=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&autohide=1`}
          title="Ambient background video"
          allow="autoplay; encrypted-media"
        />
      ) : (
        video && (
          <video
            className="background-video"
            src={video}
            autoPlay
            muted
            loop
            playsInline
            aria-label="Ambient background video"
          />
        )
      )}
      {youtube && <div className="video-ui-mask" aria-hidden="true" />}
      <Atmosphere />
    </>
  );
}
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const profileUsername = location.pathname.startsWith('/profile/') ? location.pathname.split('/')[2] : undefined;
  const [profileOwner, setProfileOwner] = useState(false);
  useEffect(() => { if (profileUsername && localStorage.token) api('/auth/me').then(x => setProfileOwner(x.user?.username === profileUsername)).catch(() => setProfileOwner(false)); }, [profileUsername]);
  return (
    <>
      <Nav />
      <main>{children}{profileUsername && <ListsSection username={profileUsername} isOwner={profileOwner} />}{profileOwner && <ListManager />}</main>
    </>
  );
}
function UserSearch() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setSearched(true);
    try {
      setUsers((await api(`/users/search?q=${encodeURIComponent(q)}`)).users);
    } catch {
      setUsers([]);
    }
  };
  return (
    <section className="people-search">
      <div className="section-head">
        <div>
          <p className="eyebrow">FIND PEOPLE</p>
          <h2>Search usernames</h2>
        </div>
        <span>Public profiles</span>
      </div>
      <form onSubmit={search} className="people-search-form">
        <UserRound size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by username"
        />
        <button>Find</button>
      </form>
      {searched && (
        <div className="people-results">
          {users.length ? (
            users.map((user) => (
              <Link
                to={`/profile/${user.username}`}
                className="person-result"
                key={user.username}
              >
                {user.avatarUrl ? (
                  <img src={assetUrl(user.avatarUrl)} alt="" />
                ) : (
                  <UserRound size={20} />
                )}
                <div>
                  <b>{user.username}</b>
                  <small>{user.bio || "View public archive"}</small>
                </div>
                <ArrowUpRight size={16} />
              </Link>
            ))
          ) : (
            <p className="empty-search">No public profiles found.</p>
          )}
        </div>
      )}
    </section>
  );
}
function Home() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!q.trim()) return;
    try {
      setResults(
        (await api(`/anime/search?q=${encodeURIComponent(q)}`)).results,
      );
    } catch {
      setResults([]);
      setError("Search is temporarily unavailable. Try again in a moment.");
    }
  };
  return (
    <Layout>
      <section className="hero">
        <p className="eyebrow">YOUR ANIME, YOUR STORY</p>
        <h1>
          Keep the worlds
          <br />
          <i>you love</i> close.
        </h1>
        <p className="lede">
          A personal archive for every series that stayed with you. Track the
          journey, rate the moments, and share your take.
        </p>
        <form onSubmit={search} className="search">
          <Search size={20} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search anime, studios, or characters"
          />
          <button>Search</button>
        </form>
        {error && <p className="search-error">{error}</p>}
      </section>
      {results.length > 0 && (
        <section className="results">
          <div className="section-head">
            <div>
              <p className="eyebrow">FREE ANIME DISCOVERY</p>
              <h2>Found for you</h2>
            </div>
            <span>{results.length} titles</span>
          </div>
          <div className="anime-grid">
            {results.map((a) => (
              <div key={a.id} className="anime-card"><Link to={`/anime/${a.id}`} className="anime-tile"><img src={a.coverImage?.large} /><div><h3>{a.title.english || a.title.romaji}</h3><p>{a.genres?.slice(0, 2).join(" · ")}</p></div><ArrowUpRight size={18} /></Link>{localStorage.token&&<ListPickerButton anime={a}/>}</div>
            ))}
          </div>
        </section>
      )}
      <SeasonalSection />
    </Layout>
  );
}
function ListPickerButton({anime}:{anime:any}){const [open,setOpen]=useState(false);return <>{<button className="list-add-button" onClick={()=>setOpen(true)}><Plus size={15}/> Add to list</button>}{open&&<ListPicker anime={anime} onClose={()=>setOpen(false)}/>}</>}
function AnimeDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>();
  const [rating, setRating] = useState(8);
  const [body, setBody] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [status, setStatus] = useState("completed");
  const [message, setMessage] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [inPortfolio, setInPortfolio] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api(`/anime/${id}`)
      .then(setData)
      .catch(() => setMessage("Could not load this anime."));
    if (localStorage.token)
      api("/portfolio")
        .then((x) => {
          const entry = x.entries?.find(
            (item: any) => String(item.anime.anilistId) === String(id),
          );
          if (entry) {
            setInPortfolio(true);
            setStatus(entry.status);
            setRating(entry.personalRating || 8);
          }
        })
        .catch(() => {});
  }, [id]);
  if (!data)
    return (
      <Layout>
        <p className="loading">Loading archive entry…</p>
      </Layout>
    );
  const a = data.anime;
  const add = async () => {
    if (saving || inPortfolio) return;
    setSaving(true);
    setMessage("");
    try {
      await api("/portfolio", {
        method: "POST",
        body: JSON.stringify({
          anilistId: a.anilistId,
          status,
          personalRating: rating,
        }),
      });
      setInPortfolio(true);
      setMessage("Saved to your portfolio");
    } catch {
      setMessage("Sign in to add this anime.");
    } finally {
      setSaving(false);
    }
  };
  const review = async () => {
    if (!localStorage.token) { setReviewError("Sign in to publish a review."); return; }
    if (!body.trim()) { setReviewError("Write a review before publishing."); return; }
    if (reviewSubmitting) return;
    setReviewSubmitting(true); setReviewError("");
    try {
      const response = await api(`/anime/${a.id}/review`, {
        method: "POST",
        body: JSON.stringify({ rating, body, containsSpoilers }),
      });
      setData((current:any)=>({...current,reviews:[response.review,...current.reviews],reviewCount:current.reviewCount+1,communityRating:current.reviewCount?((current.communityRating||0)*current.reviewCount+rating)/(current.reviewCount+1):rating}));
      setBody("");
      setMessage("Review published");
    } catch (error:any) {
      try { const parsed=JSON.parse(error.message); setReviewError(parsed.error||"Could not publish review."); } catch { setReviewError("Could not publish review."); }
    } finally { setReviewSubmitting(false);
    }
  };
  return (
    <Layout>
      <article className="detail">
        <div className="detail-art">
          <img src={a.coverImage} />
          <label className="status-picker">
            Watch status
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setInPortfolio(false);
              }}
            >
              <option value="watching">Watching</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
              <option value="plan_to_watch">Plan to watch</option>
            </select>
          </label>
          <button
            disabled={saving || inPortfolio}
            onClick={add}
            className={`primary portfolio-cta ${inPortfolio ? "is-added" : ""}`}
          >
            {inPortfolio ? (
              "✓ In your portfolio"
            ) : saving ? (
              "Saving…"
            ) : (
              <>
                <Plus size={18} />
                Add to portfolio
              </>
            )}
          </button>
          {message && <small className="detail-message">{message}</small>}
          {localStorage.token&&<ListPickerButton anime={a}/>} 
        </div>
        <div className="detail-copy">
          <p className="eyebrow">
            ANIME ARCHIVE / {a.studio || "UNKNOWN STUDIO"}
          </p>
          <h1>{a.titleEnglish || a.titleRomaji}</h1>
          <p className="native">{a.titleNative}</p>
          <div className="scores">
            <div>
              <span>AniList score</span>
              <strong>{a.anilistScore ? `${a.anilistScore}%` : "—"}</strong>
              <small>Global community</small>
            </div>
            <div className="score-accent">
              <span>Our rating</span>
              <strong>
                {data.communityRating ? data.communityRating.toFixed(1) : "—"}
              </strong>
              <small>{data.reviewCount} site reviews</small>
            </div>
          </div>
          <p className="synopsis">
            {a.synopsis?.replace(/<[^>]*>/g, "") || "No synopsis available."}
          </p>
          <div className="tags">
            {a.genres?.map((g: string) => (
              <span key={g}>{g}</span>
            ))}
          </div>
        </div>
      </article>
      <section className="reviews">
        <div className="section-head">
          <div>
            <p className="eyebrow">FROM THE ARCHIVE</p>
            <h2>Community reviews</h2>
          </div>
          <span>{data.reviewCount} reviews</span>
        </div>
        <div className="review-write">
          <div>
            <label>
              Your rating <b>{rating}/10</b>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={rating}
              onChange={(e) => {
                setRating(+e.target.value);
                if (inPortfolio) setInPortfolio(false);
              }}
            />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did this series leave you with?"
          />
          <label className="spoiler-check"><input type="checkbox" checked={containsSpoilers} onChange={(e)=>setContainsSpoilers(e.target.checked)} /> Contains spoilers</label>
          <button onClick={review} className="primary" disabled={reviewSubmitting}>
            {reviewSubmitting ? "Publishing…" : "Publish review"}
          </button>
          {reviewError&&<small className="review-error">{reviewError}</small>}
        </div>
        {data.reviews.map((r: any) => <SpoilerReview review={r} key={r.id} />)}
      </section>
    </Layout>
  );
}
function Anime() {
  const { id } = useParams();
  const [data, setData] = useState<any>();
  const [rating, setRating] = useState(8);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("completed");
  const [message, setMessage] = useState("");
  useEffect(() => {
    api(`/anime/${id}`).then(setData);
  }, [id]);
  if (!data)
    return (
      <Layout>
        <p className="loading">Loading archive entry…</p>
      </Layout>
    );
  const a = data.anime;
  const review = async () => {
    try {
      await api(`/anime/${a.id}/review`, {
        method: "POST",
        body: JSON.stringify({ rating, body }),
      });
      setMessage("Review published");
    } catch {
      setMessage("Sign in to publish a review.");
    }
  };
  const add = async () => {
    try {
      await api("/portfolio", {
        method: "POST",
        body: JSON.stringify({
          anilistId: a.anilistId,
          status,
          personalRating: rating,
        }),
      });
      setMessage("Added to your portfolio");
    } catch {
      setMessage("Sign in to add this anime.");
    }
  };
  return (
    <Layout>
      <article className="detail">
        <div className="detail-art">
          <img src={a.coverImage} />
          <button onClick={add} className="primary">
            <Plus size={18} />
            Add to portfolio
          </button>
        </div>
        <div className="detail-copy">
          <p className="eyebrow">
            ANIME ARCHIVE / {a.studio || "UNKNOWN STUDIO"}
          </p>
          <h1>{a.titleEnglish || a.titleRomaji}</h1>
          <p className="native">{a.titleNative}</p>
          <div className="scores">
            <div>
              <span>AniList score</span>
              <strong>{a.anilistScore ? `${a.anilistScore}%` : "—"}</strong>
              <small>Global community</small>
            </div>
            <div className="score-accent">
              <span>Our rating</span>
              <strong>
                {data.communityRating ? data.communityRating.toFixed(1) : "—"}
              </strong>
              <small>{data.reviewCount} site reviews</small>
            </div>
          </div>
          <p className="synopsis">
            {a.synopsis?.replace(/<[^>]*>/g, "") || "No synopsis available."}
          </p>
          <div className="tags">
            {a.genres?.map((g: string) => (
              <span key={g}>{g}</span>
            ))}
          </div>
        </div>
      </article>
      <section className="reviews">
        <div className="section-head">
          <div>
            <p className="eyebrow">FROM THE ARCHIVE</p>
            <h2>Community reviews</h2>
          </div>
          <span>{data.reviewCount} reviews</span>
        </div>
        <div className="review-write">
          <div>
            <label>
              Your rating <b>{rating}/10</b>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={rating}
              onChange={(e) => setRating(+e.target.value)}
            />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did this series leave you with?"
          />
          <button onClick={review} className="primary">
            Publish review
          </button>
          {message && <small>{message}</small>}
        </div>
        {data.reviews.map((r: any) => (
          <div className="review" key={r.id}>
            <div className="review-meta">
              <b>{r.user.username}</b>
              <span>
                <Star size={14} fill="currentColor" /> {r.rating}/10
              </span>
            </div>
            <p>{r.body}</p>
          </div>
        ))}
      </section>
    </Layout>
  );
}
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();
  return (
    <Layout>
      <section className="auth">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>
          Return to your
          <br />
          <i>archive.</i>
        </h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            try {
              const x = await api("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
              });
              localStorage.token = x.token;
              nav(`/profile/${x.user.username}`);
            } catch {
              setError("Invalid email or password.");
            }
          }}
        >
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            minLength={8}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="primary">Sign in</button>
          {error && <small className="auth-error">{error}</small>}
        </form>
        <p className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </Layout>
  );
}
function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();
  return (
    <Layout>
      <section className="auth">
        <p className="eyebrow">START YOUR ARCHIVE</p>
        <h1>
          Make it
          <br />
          <i>yours.</i>
        </h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            try {
              await api("/auth/register", {
                method: "POST",
                body: JSON.stringify({ email, username, password }),
              });
              nav("/login?registered=1");
            } catch {
              setError(
                "Could not create account. Check your details or choose another username.",
              );
            }
          }}
        >
          <input
            required
            type="text"
            minLength={3}
            maxLength={24}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            minLength={8}
            placeholder="Password (8+ characters)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="primary">Create account</button>
          {error && <small className="auth-error">{error}</small>}
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </Layout>
  );
}
function Portfolio() {
  const [data, setData] = useState<any>();
  useEffect(() => {
    api("/portfolio")
      .then(setData)
      .catch(() => setData({ entries: [] }));
  }, []);
  return (
    <Layout>
      <section className="portfolio">
        <p className="eyebrow">YOUR COLLECTION</p>
        <h1>
          The stories
          <br />
          <i>you keep.</i>
        </h1>
        <div className="section-head">
          <h2>Portfolio</h2>
          <span>{data?.entries?.length || 0} saved</span>
        </div>
        <div className="anime-grid">
          {data?.entries?.map((e: any) => (
            <Link
              className="anime-tile"
              to={`/anime/${e.anime.anilistId}`}
              key={e.id}
            >
              <img src={e.anime.coverImage} />
              <div>
                <h3>{e.anime.titleEnglish || e.anime.titleRomaji}</h3>
                <p>
                  {e.status.replaceAll("_", " ")} · {e.personalRating || "—"}/10
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
function Profile() {
  const { username } = useParams();
  const [data, setData] = useState<any>();
  const [me, setMe] = useState<any>();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File>();
  const [message, setMessage] = useState("");
  useEffect(() => {
    api(`/users/${username}`).then((x) => {
      setData(x);
      setBio(x.user.bio || "");
    });
  }, [username]);
  useEffect(() => {
    if (localStorage.token)
      api("/auth/me")
        .then((x) => setMe(x.user))
        .catch(() => {});
  }, []);
  if (!data)
    return (
      <Layout>
        <p className="loading">Loading profile…</p>
      </Layout>
    );
  const isOwner = me?.username === data.user.username;
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append("bio", bio);
    if (avatar) form.append("avatar", avatar);
    try {
      const x = await api("/users/me", { method: "PATCH", body: form });
      setData((current: any) => ({
        ...current,
        user: { ...current.user, ...x.user },
      }));
      setMe((current: any) => ({ ...current, ...x.user }));
      setEditing(false);
      setMessage("Profile saved");
    } catch {
      setMessage("Could not save profile. Use an image under 5MB.");
    }
  };
  return (
    <Layout>
      <section className="portfolio profile-page">
        <p className="eyebrow">PUBLIC ARCHIVE / PROFILE</p>
        <div className="profile-hero">
          <div className="profile-avatar">
            {data.user.avatarUrl ? (
              <img
                src={assetUrl(data.user.avatarUrl)}
                alt={`${data.user.username} avatar`}
              />
            ) : (
              <UserRound size={42} />
            )}
          </div>
          <div>
            <h1>
              {data.user.username}
              <br />
              <i>in motion.</i>
            </h1>
            <p className="lede">
              {data.user.bio ||
                "A quiet collection of stories, ratings, and reviews."}
            </p>
          </div>
          {isOwner && (
            <button
              className="profile-edit-button"
              onClick={() => setEditing((current) => !current)}
            >
              {editing ? "Close editor" : "Edit profile"}
            </button>
          )}
        </div>
        {isOwner && editing && (
          <form className="profile-editor" onSubmit={saveProfile}>
            <label>
              Profile photo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => setAvatar(e.target.files?.[0])}
              />
            </label>
            <label>
              Bio
              <textarea
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A sentence about your anime life"
              />
            </label>
            <button className="primary">Save profile</button>
          </form>
        )}
        {message && <p className="profile-message">{message}</p>}
        <div className="section-head">
          <h2>Portfolio</h2>
          <span>{data.user.portfolio.length} saved</span>
        </div>
        <div className="anime-grid">
          {data.user.portfolio.map((e: any) => (
            <Link
              className="anime-tile"
              to={`/anime/${e.anime.anilistId}`}
              key={e.id}
            >
              <img src={e.anime.coverImage} />
              <div>
                <h3>{e.anime.titleEnglish || e.anime.titleRomaji}</h3>
                <p>
                  {e.status.replaceAll("_", " ")} · {e.personalRating || "—"}/10
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="section-head profile-reviews-head">
          <h2>Reviews</h2>
          <span>{data.user.reviews.length} written</span>
        </div>
        {data.user.reviews.map((r: any) => (
          <Link
            className="profile-review"
            to={`/anime/${r.anime.anilistId}`}
            key={r.id}
          >
            <span>{r.rating}/10</span>
            <div>
              <b>{r.anime.titleEnglish || r.anime.titleRomaji}</b>
              <p>{r.body}</p>
            </div>
          </Link>
        ))}
      </section>
    </Layout>
  );
}
function People() {
  return (
    <Layout>
      <section className="people-page">
        <p className="eyebrow">COMMUNITY</p>
        <h1>
          Find your
          <br />
          <i>people.</i>
        </h1>
        <UserSearch />
      </section>
    </Layout>
  );
}
function SocialProfile(){const {username}=useParams();const [data,setData]=useState<any>();const [stats,setStats]=useState<any>();const [activity,setActivity]=useState<any>();const [me,setMe]=useState<any>();const [editing,setEditing]=useState(false);const [bio,setBio]=useState('');const [avatar,setAvatar]=useState<File>();const [message,setMessage]=useState('');useEffect(()=>{Promise.all([api(`/users/${username}`),api(`/users/${username}/stats`),api(`/users/${username}/activity`)]).then(([profile,profileStats,profileActivity])=>{setData(profile);setBio(profile.user.bio||'');setStats(profileStats);setActivity(profileActivity)});if(localStorage.token)api('/auth/me').then(x=>setMe(x.user)).catch(()=>{})},[username]);if(!data||!stats||!activity)return <Layout><p className="loading">Loading profile…</p></Layout>;const isOwner=me?.username===data.user.username;const toggleFollow=async()=>{try{if(data.isFollowing){await api(`/users/${username}/follow`,{method:'DELETE'});setData((current:any)=>({...current,isFollowing:false,followerCount:current.followerCount-1}))}else{await api(`/users/${username}/follow`,{method:'POST'});setData((current:any)=>({...current,isFollowing:true,followerCount:current.followerCount+1}))}}catch{setMessage('Sign in to follow people.')}};const save=async(e:React.FormEvent)=>{e.preventDefault();const form=new FormData();form.append('bio',bio);if(avatar)form.append('avatar',avatar);try{const x=await api('/users/me',{method:'PATCH',body:form});setData((current:any)=>({...current,user:{...current.user,...x.user}}));setEditing(false);setMessage('Profile saved')}catch{setMessage('Could not save profile')}};return <Layout><section className="portfolio profile-page"><p className="eyebrow">PUBLIC ARCHIVE / PROFILE</p><div className="profile-hero"><div className="profile-avatar">{data.user.avatarUrl?<img src={assetUrl(data.user.avatarUrl)} alt=""/>:<UserRound size={42}/>}</div><div><h1>{data.user.username}<br/><i>in motion.</i></h1><p className="lede">{data.user.bio||'A quiet collection of stories, ratings, and reviews.'}</p><div className="profile-counts"><span><b>{data.followerCount}</b> followers</span><span><b>{data.followingCount}</b> following</span></div></div>{isOwner?<button className="profile-edit-button" onClick={()=>setEditing(!editing)}>{editing?'Close editor':'Edit profile'}</button>:<button className="profile-edit-button follow-button" onClick={toggleFollow}>{data.isFollowing?'Following':'Follow'}</button>}</div>{isOwner&&editing&&<form className="profile-editor" onSubmit={save}><label>Profile photo<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setAvatar(e.target.files?.[0])}/></label><label>Bio<textarea maxLength={500} value={bio} onChange={e=>setBio(e.target.value)}/></label><button className="primary">Save profile</button></form>}{message&&<p className="profile-message">{message}</p>}<ProfileStats stats={stats}/><div className="section-head profile-reviews-head"><h2>Recent activity</h2><span>{activity.pagination.total} events</span></div>{activity.items.map((item:any)=><ActivityItem item={item} key={item.id}/>) }<div className="section-head profile-reviews-head"><h2>Reviews</h2><span>{data.user.reviews.length} written</span></div>{data.user.reviews.map((r:any)=><div className="profile-review" key={r.id}><div><Link to={`/anime/${r.anime.anilistId}`}><b>{r.anime.titleEnglish||r.anime.titleRomaji}</b></Link><SpoilerReview review={r}/></div></div>)}</section></Layout>}
function ListsSection({username,isOwner}:{username:string;isOwner:boolean}){const [lists,setLists]=useState<any[]>([]);useEffect(()=>{api(isOwner?'/lists/mine':`/users/${username}/lists`).then(x=>setLists(x.lists||[])).catch(()=>{})},[username,isOwner]);if(!lists.length)return null;return <section className="profile-lists"><div className="section-head"><h2>{isOwner?'My lists':'Public lists'}</h2><span>{lists.length}</span></div>{lists.map(list=><Link className="list-row" key={list.id} to={`/lists/${list.id}`}><b>{list.name}</b><span>{list._count?.items||0} titles</span></Link>)}</section>}
function ListManager(){const [name,setName]=useState('');const [message,setMessage]=useState('');const create=async(e:any)=>{e.preventDefault();try{await api('/lists',{method:'POST',body:JSON.stringify({name})});setName('');setMessage('List created — refresh to see it.')}catch{setMessage('Could not create list.')}};return <form className="list-manager" onSubmit={create}><h3>Create a list</h3><input value={name} onChange={e=>setName(e.target.value)} placeholder="List name" required/><button className="primary">Create</button>{message&&<small>{message}</small>}</form>}
function App() {
  return (
    <>
      <BackgroundVisual />
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/anime/:id" element={<AnimeDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/people" element={<People />} />
      <Route path="/profile/:username" element={<SocialProfile />} />
      <Route path="/lists/:id" element={<Layout><ListPage /></Layout>} />
      <Route path="/feed" element={<Layout><Feed /></Layout>} />
      </Routes>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
