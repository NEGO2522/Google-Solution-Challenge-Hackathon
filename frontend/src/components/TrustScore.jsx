import "./TrustScore.css";

export default function TrustScore({ volunteer }) {
  const score       = volunteer?.trust_score     || 0;
  const avgRating   = volunteer?.avg_rating      || 0;
  const totalRatings= volunteer?.total_ratings   || 0;
  const completed   = volunteer?.tasks_completed || 0;
  const accepted    = volunteer?.tasks_accepted  || 0;

  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#f43f5e";
  const label = pct >= 70 ? "Highly Trusted" : pct >= 40 ? "Building Trust" : "New Volunteer";

  const circumference = 2 * Math.PI * 42; // r=42
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div className="ts-card">
      <div className="ts-header">🏅 Trust Score</div>

      <div className="ts-main">
        <div className="ts-ring-wrap">
          <svg viewBox="0 0 100 100" width="80" height="80">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a1a" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={color} strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div className="ts-ring-center">
            <div className="ts-score-val" style={{ color }}>{Math.round(pct)}</div>
            <div className="ts-score-max">/100</div>
          </div>
        </div>

        <div className="ts-info">
          <div className="ts-label" style={{ color }}>{label}</div>
          <div className="ts-breakdown">
            <div className="ts-row">
              <span>⭐ Avg Rating</span>
              <strong>{avgRating > 0 ? `${avgRating} (${totalRatings})` : "—"}</strong>
            </div>
            <div className="ts-row">
              <span>✅ Completed</span>
              <strong>{completed}</strong>
            </div>
            <div className="ts-row">
              <span>📋 Accepted</span>
              <strong>{accepted}</strong>
            </div>
            <div className="ts-row">
              <span>🔄 Completion Rate</span>
              <strong>{accepted > 0 ? `${Math.round(completed / accepted * 100)}%` : "—"}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="ts-formula">
        <div className="ts-formula-title">How it's calculated</div>
        <div className="ts-formula-items">
          <div className="ts-fi"><span className="ts-fi-pct">40%</span> Average rating from NGOs</div>
          <div className="ts-fi"><span className="ts-fi-pct">40%</span> Task completion rate</div>
          <div className="ts-fi"><span className="ts-fi-pct">20%</span> Number of tasks done</div>
        </div>
      </div>
    </div>
  );
}
