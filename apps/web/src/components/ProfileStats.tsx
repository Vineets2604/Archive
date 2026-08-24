export function ProfileStats({ stats }: { stats: any }) {
  const max = Math.max(
    ...(stats.genreBreakdown || []).map((item: any) => item.count),
    1,
  );
  return (
    <section className="profile-stats">
      <div className="section-head">
        <div>
          <p className="eyebrow">PROFILE SIGNALS</p>
          <h2>Stats</h2>
        </div>
        <span>{stats.totalAnimeTracked} tracked</span>
      </div>
      <div className="stat-overview">
        <div>
          <strong>{stats.totalAnimeTracked}</strong>
          <small>Anime tracked</small>
        </div>
        <div>
          <strong>{stats.averageRatingGiven ?? "—"}</strong>
          <small>Average rating</small>
        </div>
        <div>
          <strong>{stats.totalReviewsWritten}</strong>
          <small>Reviews written</small>
        </div>
      </div>
      <div className="stat-columns">
        <div>
          <label>Status breakdown</label>
          {Object.entries(stats.statusBreakdown || {}).map(
            ([status, count]) => (
              <div className="bar-row" key={status}>
                <span>{status.replaceAll("_", " ")}</span>
                <div>
                  <i
                    style={{
                      width: `${stats.totalAnimeTracked ? (Number(count) / stats.totalAnimeTracked) * 100 : 0}%`,
                    }}
                  />
                </div>
                <b>{String(count)}</b>
              </div>
            ),
          )}
        </div>
        <div>
          <label>Top genres</label>
          {(stats.genreBreakdown || []).map((item: any) => (
            <div className="bar-row" key={item.genre}>
              <span>{item.genre}</span>
              <div>
                <i style={{ width: `${(item.count / max) * 100}%` }} />
              </div>
              <b>{item.count}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
