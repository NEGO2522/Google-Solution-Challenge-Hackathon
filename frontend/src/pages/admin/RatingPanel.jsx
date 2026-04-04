import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useNotifications } from "../../context/NotificationContext";
import "./RatingPanel.css";

export default function RatingPanel({ user }) {
  const [completed, setCompleted]  = useState([]);
  const [loading, setLoading]      = useState(true);
  const [rating, setRating]        = useState({}); // { [assignmentId]: { score, comment } }
  const [submitting, setSubmitting] = useState(null);
  const { pushNotification }       = useNotifications();

  useEffect(() => {
    (async () => {
      // Get completed assignments that haven't been rated yet
      const { data } = await supabase
        .from("task_assignments")
        .select("*, volunteer_profiles(id, name, avg_rating, trust_score), issues(title, category, urgency)")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(50);

      // Filter out already-rated ones
      const assignmentIds = (data || []).map((a) => a.id);
      let ratedIds = [];
      if (assignmentIds.length > 0) {
        const { data: existingRatings } = await supabase
          .from("ratings")
          .select("assignment_id")
          .in("assignment_id", assignmentIds);
        ratedIds = (existingRatings || []).map((r) => r.assignment_id);
      }

      setCompleted((data || []).map((a) => ({ ...a, already_rated: ratedIds.includes(a.id) })));
      setLoading(false);
    })();
  }, []);

  const updateRating = (assignmentId, field, value) => {
    setRating((prev) => ({ ...prev, [assignmentId]: { ...(prev[assignmentId] || {}), [field]: value } }));
  };

  const submitRating = async (assignment) => {
    const r = rating[assignment.id];
    if (!r?.score) return;
    setSubmitting(assignment.id);

    await supabase.from("ratings").insert({
      assignment_id: assignment.id,
      rated_by: user.id,
      volunteer_id: assignment.volunteer_id,
      rating: r.score,
      comment: r.comment || null,
    });

    // Recalculate trust score
    await supabase.rpc("recalculate_trust_score", { p_volunteer_id: assignment.volunteer_id }).catch(() => {});

    // Notify volunteer
    await pushNotification({
      userId: assignment.volunteer_id,
      type: "rating_received",
      title: `You received a ${r.score}⭐ rating!`,
      body: r.comment ? `"${r.comment}"` : `For completing: ${assignment.issues?.title}`,
    });

    setCompleted((prev) => prev.map((a) => a.id === assignment.id ? { ...a, already_rated: true } : a));
    setSubmitting(null);
  };

  if (loading) return <div style={{ padding: 32, color: "#555", textAlign: "center" }}>Loading completed tasks…</div>;

  const toRate  = completed.filter((a) => !a.already_rated);
  const rated   = completed.filter((a) => a.already_rated);

  return (
    <div className="rp-root">
      <div className="rp-header">
        <h3>⭐ Rate Volunteers</h3>
        <p>Rate completed tasks to build volunteer trust scores and encourage quality work.</p>
      </div>

      {toRate.length === 0 && (
        <div className="rp-all-rated">
          <div className="rp-all-icon">🏅</div>
          <h4>All tasks rated!</h4>
          <p>No pending ratings at the moment.</p>
        </div>
      )}

      <div className="rp-list">
        {toRate.map((assignment) => {
          const r = rating[assignment.id] || {};
          const vol = assignment.volunteer_profiles;
          const issue = assignment.issues;
          return (
            <div key={assignment.id} className="rp-card">
              <div className="rp-card-top">
                <div className="rp-vol-avatar">{vol?.name?.[0]?.toUpperCase()}</div>
                <div className="rp-vol-info">
                  <div className="rp-vol-name">{vol?.name || "Unknown Volunteer"}</div>
                  <div className="rp-vol-meta">
                    {issue?.title && <span>📋 {issue.title}</span>}
                    {assignment.completed_at && <span>✅ {new Date(assignment.completed_at).toLocaleDateString()}</span>}
                    {vol?.trust_score != null && <span>🏅 Trust: {vol.trust_score}</span>}
                  </div>
                </div>
              </div>

              {assignment.proof_text && (
                <div className="rp-proof">
                  <div className="rp-proof-label">Volunteer's report:</div>
                  <div className="rp-proof-text">{assignment.proof_text}</div>
                </div>
              )}

              <div className="rp-stars-row">
                <div className="rp-stars-label">Your rating:</div>
                <div className="rp-stars">
                  {[1,2,3,4,5].map((s) => (
                    <button
                      key={s}
                      className={`rp-star ${(r.score || 0) >= s ? "filled" : ""}`}
                      onClick={() => updateRating(assignment.id, "score", s)}
                    >★</button>
                  ))}
                  {r.score && <span className="rp-score-label">{["","Poor","Fair","Good","Great","Excellent"][r.score]}</span>}
                </div>
              </div>

              <textarea
                className="rp-comment"
                placeholder="Optional feedback for the volunteer…"
                value={r.comment || ""}
                onChange={(e) => updateRating(assignment.id, "comment", e.target.value)}
                rows={2}
              />

              <button
                className="rp-submit-btn"
                onClick={() => submitRating(assignment)}
                disabled={!r.score || submitting === assignment.id}
              >
                {submitting === assignment.id ? "Submitting…" : "Submit Rating"}
              </button>
            </div>
          );
        })}
      </div>

      {rated.length > 0 && (
        <div className="rp-rated-section">
          <div className="rp-rated-header">Previously Rated ({rated.length})</div>
          {rated.map((a) => (
            <div key={a.id} className="rp-rated-row">
              <div className="rp-vol-avatar small">{a.volunteer_profiles?.name?.[0]?.toUpperCase()}</div>
              <span className="rp-rated-name">{a.volunteer_profiles?.name}</span>
              <span className="rp-rated-issue">{a.issues?.title}</span>
              <span className="rp-rated-badge">Rated ✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
