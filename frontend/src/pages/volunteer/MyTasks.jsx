import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useNotifications } from "../../context/NotificationContext";
import "./MyTasks.css";

const STATUS_LABEL = {
  pending:     { label: "Pending",     color: "#f59e0b", icon: "⏳" },
  accepted:    { label: "Accepted",    color: "#60a5fa", icon: "✅" },
  declined:    { label: "Declined",    color: "#f43f5e", icon: "✗" },
  in_progress: { label: "In Progress", color: "#fb923c", icon: "🔄" },
  completed:   { label: "Completed",   color: "#22c55e", icon: "🎉" },
  cancelled:   { label: "Cancelled",   color: "#555",    icon: "✗" },
};

const URGENCY_COLOR = { low: "#22c55e", medium: "#f59e0b", high: "#f97316", critical: "#f43f5e" };

export default function MyTasks({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [active, setActive]           = useState(null); // selected assignment
  const [proofModal, setProofModal]   = useState(null);
  const { pushNotification }          = useNotifications();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("task_assignments")
      .select("*, issues(title, description, category, urgency, address, lat, lng, reported_by, reporter_name)")
      .eq("volunteer_id", user.id)
      .order("created_at", { ascending: false });
    setAssignments(data || []);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  // Real-time — new assignments pushed
  useEffect(() => {
    const ch = supabase.channel(`my-tasks:${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "task_assignments",
        filter: `volunteer_id=eq.${user.id}`,
      }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user.id, load]);

  const respond = async (assignmentId, issueId, accept) => {
    const status = accept ? "accepted" : "declined";
    await supabase.from("task_assignments").update({
      status,
      accepted_at: accept ? new Date().toISOString() : null,
    }).eq("id", assignmentId);

    if (accept) {
      await supabase.from("issues").update({ status: "assigned" }).eq("id", issueId);
    } else {
      // Reopen so admin can reassign
      await supabase.from("issues").update({ status: "open", assigned_to: null }).eq("id", issueId);
    }
    load();
    setActive(null);
  };

  const startWork = async (assignmentId, issueId) => {
    await supabase.from("task_assignments").update({ status: "in_progress", started_at: new Date().toISOString() }).eq("id", assignmentId);
    await supabase.from("issues").update({ status: "in_progress" }).eq("id", issueId);
    load();
  };

  const openProof = (assignment) => setProofModal(assignment);

  const stats = {
    total:    assignments.length,
    pending:  assignments.filter((a) => a.status === "pending").length,
    active:   assignments.filter((a) => ["accepted","in_progress"].includes(a.status)).length,
    done:     assignments.filter((a) => a.status === "completed").length,
  };

  return (
    <div className="mt-root">
      <div className="mt-header">
        <h2>My Tasks</h2>
        <p>Tasks assigned to you by NGO admins. Accept, work on them, and submit proof when done.</p>
      </div>

      <div className="mt-stats-row">
        {[
          { icon:"📋", label:"Total",      val: stats.total },
          { icon:"⏳", label:"Pending",    val: stats.pending, accent: stats.pending > 0 },
          { icon:"🔄", label:"In Progress",val: stats.active },
          { icon:"🎉", label:"Completed",  val: stats.done },
        ].map((s, i) => (
          <div key={i} className={`mt-stat ${s.accent ? "accent" : ""}`}>
            <div className="mt-stat-icon">{s.icon}</div>
            <div className="mt-stat-val">{s.val}</div>
            <div className="mt-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mt-loader">Loading your tasks…</div>
      ) : assignments.length === 0 ? (
        <div className="mt-empty-state">
          <div className="mt-empty-icon">📭</div>
          <h3>No tasks yet</h3>
          <p>When an NGO admin assigns you a task, it will appear here.</p>
        </div>
      ) : (
        <div className="mt-list">
          {assignments.map((a) => {
            const st = STATUS_LABEL[a.status] || STATUS_LABEL.pending;
            const issue = a.issues;
            return (
              <div key={a.id} className={`mt-card ${active === a.id ? "expanded" : ""}`}>
                <div className="mt-card-top" onClick={() => setActive(active === a.id ? null : a.id)}>
                  <div className="mt-card-status-dot" style={{ background: st.color }} />
                  <div className="mt-card-main">
                    <div className="mt-card-title">{issue?.title || "Unknown Issue"}</div>
                    <div className="mt-card-meta">
                      {issue?.category && <span className="mt-cat">{issue.category}</span>}
                      {issue?.urgency && (
                        <span style={{ color: URGENCY_COLOR[issue.urgency], fontSize: 11, fontWeight: 600 }}>
                          {issue.urgency}
                        </span>
                      )}
                      {issue?.address && <span className="mt-addr">📍 {issue.address}</span>}
                    </div>
                  </div>
                  <div className="mt-card-right">
                    <span className="mt-status-badge" style={{ color: st.color, borderColor: st.color + "44", background: st.color + "15" }}>
                      {st.icon} {st.label}
                    </span>
                    <span className="mt-card-date">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {active === a.id && (
                  <div className="mt-card-detail">
                    {issue?.description && (
                      <div className="mt-detail-block">
                        <div className="mt-detail-label">Description</div>
                        <div className="mt-detail-text">{issue.description}</div>
                      </div>
                    )}
                    {issue?.reporter_name && (
                      <div className="mt-detail-block">
                        <div className="mt-detail-label">Reported By</div>
                        <div className="mt-detail-text">{issue.reporter_name}</div>
                      </div>
                    )}
                    {a.match_score != null && (
                      <div className="mt-detail-block">
                        <div className="mt-detail-label">Match Score</div>
                        <div className="mt-detail-text">🤖 {Math.round(a.match_score)}/100 — AI-matched based on your skills &amp; location</div>
                      </div>
                    )}

                    <div className="mt-actions">
                      {a.status === "pending" && (
                        <>
                          <button className="mt-btn-accept" onClick={() => respond(a.id, issue?.id || a.issue_id, true)}>
                            ✓ Accept Task
                          </button>
                          <button className="mt-btn-decline" onClick={() => respond(a.id, issue?.id || a.issue_id, false)}>
                            ✗ Decline
                          </button>
                        </>
                      )}
                      {a.status === "accepted" && (
                        <button className="mt-btn-start" onClick={() => startWork(a.id, issue?.id || a.issue_id)}>
                          🔄 Start Working
                        </button>
                      )}
                      {a.status === "in_progress" && (
                        <button className="mt-btn-proof" onClick={() => openProof(a)}>
                          📸 Submit Proof & Complete
                        </button>
                      )}
                      {a.status === "completed" && !a._rated && (
                        <div className="mt-completed-msg">🎉 Task completed! Check your trust score update.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {proofModal && (
        <ProofModal
          assignment={proofModal}
          user={user}
          onClose={() => setProofModal(null)}
          onDone={() => { setProofModal(null); load(); }}
          pushNotification={pushNotification}
        />
      )}
    </div>
  );
}

/* ── Proof Submission Modal ── */
function ProofModal({ assignment, user, onClose, onDone, pushNotification }) {
  const [text, setText]         = useState("");
  const [submitting, setSub]    = useState(false);
  const [error, setError]       = useState("");

  const submit = async () => {
    if (!text.trim()) { setError("Please describe what you did."); return; }
    setSub(true);

    await supabase.from("task_assignments").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      proof_text: text,
    }).eq("id", assignment.id);

    // Update issue to resolved
    await supabase.from("issues").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", assignment.issue_id);

    // Recalculate trust score
    await supabase.rpc("recalculate_trust_score", { p_volunteer_id: user.id }).catch(() => {});

    // Notify reporter if available
    const issue = assignment.issues;
    if (issue?.reported_by) {
      await pushNotification({
        userId: issue.reported_by,
        type: "issue_resolved",
        title: "Issue Resolved ✅",
        body: `Your issue "${issue.title}" has been resolved by a volunteer.`,
      });
    }

    setSub(false);
    onDone();
  };

  return (
    <div className="mt-modal-overlay" onClick={onClose}>
      <div className="mt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mt-modal-header">
          <h3>📸 Submit Proof of Completion</h3>
          <button className="mt-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="mt-modal-body">
          <div className="mt-modal-issue">
            Task: <strong>{assignment.issues?.title}</strong>
          </div>

          <label className="mt-modal-label">What did you do? (required)</label>
          <textarea
            className="mt-modal-textarea"
            placeholder="Describe what actions you took to resolve this issue. Be specific — this builds your trust score."
            value={text}
            onChange={(e) => { setText(e.target.value); setError(""); }}
            rows={5}
          />
          {error && <div className="mt-modal-err">{error}</div>}

          <div className="mt-modal-note">
            💡 After submission, the NGO admin may rate your work. Ratings affect your Trust Score.
          </div>
        </div>
        <div className="mt-modal-footer">
          <button className="mt-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="mt-modal-submit" onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "✅ Mark as Completed"}
          </button>
        </div>
      </div>
    </div>
  );
}
