import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useNotifications } from "../../context/NotificationContext";
import "./AdminDashboard.css";

/* ── helpers ── */
const URGENCY_COLOR = { low: "#22c55e", medium: "#f59e0b", high: "#f97316", critical: "#f43f5e" };
const STATUS_COLOR  = { open: "#60a5fa", assigned: "#a78bfa", in_progress: "#fb923c", resolved: "#22c55e" };



function Badge({ text, color }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600,
      textTransform: "capitalize", whiteSpace: "nowrap",
    }}>{text}</span>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className={`adc-stat ${accent ? "adc-stat-accent" : ""}`}>
      <div className="adc-stat-icon">{icon}</div>
      <div className="adc-stat-val">{value ?? "—"}</div>
      <div className="adc-stat-label">{label}</div>
      {sub && <div className="adc-stat-sub">{sub}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN ADMIN DASHBOARD
══════════════════════════════════════════════════════════ */
export default function AdminDashboard({ user }) {
  const [tab, setTab] = useState("issues");
  const tabs = [
    { id: "issues",     label: "🗂 Issues"      },
    { id: "create",     label: "➕ Create Issue" },
    { id: "volunteers", label: "👥 Volunteers"  },
    { id: "approvals",  label: "✅ Approvals"   },
    { id: "matching",   label: "🤖 Smart Match" },
  ];

  return (
    <div className="adc-root">
      <div className="adc-topbar">
        <div className="adc-topbar-left">
          <h2>Admin Console</h2>
          <p>{user.ngoName || "NGO"} · {user.ngoCity || "Global"}</p>
        </div>
        <div className="adc-tabs">
          {tabs.map((t) => (
            <button key={t.id} className={`adc-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="adc-body">
        {tab === "issues"     && <IssuesPanel     user={user} onNavigate={setTab} />}
        {tab === "create"     && <CreateIssuePanel user={user} onCreated={() => setTab("issues")} />}
        {tab === "volunteers" && <VolunteersPanel  user={user} />}
        {tab === "approvals"  && <ApprovalsPanel   user={user} />}
        {tab === "matching"   && <SmartMatchPanel  user={user} />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ISSUES PANEL
══════════════════════════════════════════════════════════ */
function IssuesPanel({ user, onNavigate }) {
  const [issues, setIssues]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [selected, setSelected] = useState(null);
  const { pushNotification }    = useNotifications();

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("issues").select("*, volunteer_profiles(name, city)").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q.limit(50);
    setIssues(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel("admin-issues")
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load]);

  const updateStatus = async (id, status, reportedBy, title) => {
    await supabase.from("issues").update({ status, ...(status === "resolved" ? { resolved_at: new Date().toISOString() } : {}) }).eq("id", id);
    if (reportedBy && status === "resolved") {
      await pushNotification({ userId: reportedBy, type: "issue_resolved", title: "Issue Resolved", body: `Your issue "${title}" has been marked as resolved.` });
    }
    load();
    setSelected(null);
  };

  const stats = {
    total:    issues.length,
    open:     issues.filter((i) => i.status === "open").length,
    active:   issues.filter((i) => ["assigned","in_progress"].includes(i.status)).length,
    resolved: issues.filter((i) => i.status === "resolved").length,
  };

  return (
    <div className="adc-panel">
      <div className="adc-stats-row">
        <StatCard icon="📋" label="Total Issues"  value={stats.total}    sub="all time" />
        <StatCard icon="🔵" label="Open"          value={stats.open}     sub="need action" accent />
        <StatCard icon="🟡" label="In Progress"   value={stats.active}   sub="being handled" />
        <StatCard icon="✅" label="Resolved"       value={stats.resolved} sub="this session" />
      </div>

      <div className="adc-toolbar">
        <div className="adc-filter-row">
          {["all","open","assigned","in_progress","resolved"].map((f) => (
            <button key={f} className={`adc-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f.replace("_"," ")}
            </button>
          ))}
        </div>
        <button className="adc-btn-sm adc-btn-primary" style={{ marginLeft: "auto" }} onClick={() => onNavigate("create")}>
          ➕ Create Issue
        </button>
      </div>

      {loading ? <div className="adc-loader">Loading issues…</div> : (
        <div className="adc-table-wrap">
          <table className="adc-table">
            <thead>
              <tr>
                <th>Issue</th><th>Category</th><th>Urgency</th><th>Status</th>
                <th>Assigned To</th><th>Reported</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className={selected === issue.id ? "selected" : ""}>
                  <td>
                    <div className="adc-issue-title">{issue.title}</div>
                    <div className="adc-issue-sub">{issue.address || "No address"}</div>
                  </td>
                  <td><span className="adc-cat-pill">{issue.category || "—"}</span></td>
                  <td><Badge text={issue.urgency || "—"} color={URGENCY_COLOR[issue.urgency] || "#aaa"} /></td>
                  <td><Badge text={issue.status} color={STATUS_COLOR[issue.status] || "#aaa"} /></td>
                  <td>{issue.volunteer_profiles?.name || <span className="adc-muted">Unassigned</span>}</td>
                  <td className="adc-muted">{new Date(issue.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="adc-action-btns">
                      {issue.status === "open" && (
                        <button className="adc-btn-sm adc-btn-primary" onClick={() => setSelected(selected === issue.id ? null : issue.id)}>
                          Assign
                        </button>
                      )}
                      {issue.status !== "resolved" && (
                        <button className="adc-btn-sm adc-btn-ghost" onClick={() => updateStatus(issue.id, "resolved", issue.reported_by, issue.title)}>
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {issues.length === 0 && <div className="adc-empty">No issues found for this filter.</div>}
        </div>
      )}

      {selected && (
        <AssignModal
          issueId={selected}
          user={user}
          onClose={() => setSelected(null)}
          onAssigned={() => { load(); setSelected(null); }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CREATE ISSUE PANEL (admin)
══════════════════════════════════════════════════════════ */
const CATEGORIES = [
  { value: "medical",   label: "🏥 Medical",    color: "#f87171" },
  { value: "food",      label: "🍱 Food",        color: "#fb923c" },
  { value: "shelter",   label: "🏠 Shelter",     color: "#a78bfa" },
  { value: "rescue",    label: "🚨 Rescue",      color: "#f43f5e" },
  { value: "education", label: "📚 Education",   color: "#60a5fa" },
  { value: "other",     label: "📌 Other",       color: "#94a3b8" },
];
const URGENCY_OPTS = [
  { value: "low",      label: "🟢 Low",      cls: "u-low"      },
  { value: "medium",   label: "🟡 Medium",   cls: "u-medium"   },
  { value: "high",     label: "🔴 High",     cls: "u-high"     },
  { value: "critical", label: "🚨 Critical", cls: "u-critical" },
];

function CreateIssuePanel({ user, onCreated }) {
  const [form, setForm] = useState({
    title: "", description: "", category: "", urgency: "",
    address: "", lat: null, lng: null,
  });
  const [errors, setErrors]     = useState({});
  const [submitting, setSub]    = useState(false);
  const [locating, setLocating] = useState(false);
  const [success, setSuccess]   = useState(false);

  const up = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: "" })); };

  const pickLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { up("lat", p.coords.latitude); up("lng", p.coords.longitude); setLocating(false); },
      ()  => { alert("Location denied."); setLocating(false); }
    );
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title    = "Title is required";
    if (!form.category)     e.category = "Select a category";
    if (!form.urgency)      e.urgency  = "Select urgency";
    if (!form.lat || !form.lng) e.location = "Location required — use button or enter manually";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSub(true);
    const { error } = await supabase.from("issues").insert({
      reported_by:   user.id,
      reporter_name: user.ngoName || user.name,
      title:         form.title,
      description:   form.description,
      category:      form.category,
      urgency:       form.urgency,
      address:       form.address,
      lat:           form.lat,
      lng:           form.lng,
      location:      `POINT(${form.lng} ${form.lat})`,
      status:        "open",
    });
    setSub(false);
    if (error) { alert("Error: " + error.message); return; }
    setSuccess(true);
  };

  if (success) return (
    <div className="adc-panel">
      <div className="adc-empty-state">
        <div className="adc-empty-icon">🎉</div>
        <h4>Issue Created!</h4>
        <p>The issue is now open and ready for volunteer matching.</p>
        <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:16 }}>
          <button className="adc-btn-approve" onClick={() => { setSuccess(false); setForm({ title:"", description:"", category:"", urgency:"", address:"", lat:null, lng:null }); }}>
            ➕ Create Another
          </button>
          <button className="adc-btn-assign" onClick={onCreated} style={{ background:"#60a5fa" }}>
            🗂 View All Issues
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="adc-panel">
      <div className="ci-container">
        <div className="adc-panel-header">
          <h3>➕ Create New Issue</h3>
          <p>Report a community problem directly as an NGO admin. It will appear in Issues and can be assigned to volunteers.</p>
        </div>

        <div className="ci-form">
          <div className="ci-left">
            {/* Title */}
            <div className="ci-field">
              <label>Issue Title *</label>
              <input className={`ci-input ${errors.title ? "err" : ""}`} value={form.title}
                placeholder="e.g. Flood victims need shelter in Mansarovar"
                onChange={(e) => up("title", e.target.value)} />
              {errors.title && <span className="ci-err">{errors.title}</span>}
            </div>

            {/* Description */}
            <div className="ci-field" style={{ flex: 1, display: "flex" }}>
              <label>Description</label>
              <textarea className="ci-textarea" style={{ flex: 1 }} value={form.description}
                placeholder="Describe the situation, number of people affected, immediate needs…"
                onChange={(e) => up("description", e.target.value)} />
            </div>

            {/* Address */}
            <div className="ci-field">
              <label>Address / Landmark</label>
              <input className="ci-input" value={form.address}
                placeholder="e.g. Near Birla Temple, Jaipur"
                onChange={(e) => up("address", e.target.value)} />
            </div>
          </div>

          <div className="ci-right">
            {/* Category */}
            <div className="ci-field">
              <label>Category *</label>
              <div className="ci-cat-grid">
                {CATEGORIES.map((c) => (
                  <button key={c.value} type="button"
                    className={`ci-cat-btn ${form.category === c.value ? "active" : ""}`}
                    onClick={() => up("category", c.value)}>
                    <span style={{ fontSize: 20 }}>{c.label.split(' ')[0]}</span>
                    <span>{c.label.split(' ')[1]}</span>
                  </button>
                ))}
              </div>
              {errors.category && <span className="ci-err">{errors.category}</span>}
            </div>

            {/* Urgency */}
            <div className="ci-field">
              <label>Urgency Level *</label>
              <div className="ci-urgency-row">
                {URGENCY_OPTS.map((u) => (
                  <button key={u.value} type="button"
                    className={`ci-urgency-btn ${u.cls} ${form.urgency === u.value ? "active" : ""}`}
                    onClick={() => up("urgency", u.value)}>
                    {u.label}
                  </button>
                ))}
              </div>
              {errors.urgency && <span className="ci-err">{errors.urgency}</span>}
            </div>

            {/* Location */}
            <div className="ci-field">
              <label>📍 Location *</label>
              <div className="ci-loc-block">
                <button type="button" className="ci-loc-btn" onClick={pickLocation} disabled={locating}>
                  {locating ? "📡 Detecting…" : "📍 Detect Current Location"}
                </button>
                
                <div className="ci-coord-row">
                  <input className="ci-input ci-coord" placeholder="Latitude" type="number"
                    value={form.lat || ""} onChange={(e) => up("lat", parseFloat(e.target.value) || null)} />
                  <input className="ci-input ci-coord" placeholder="Longitude" type="number"
                    value={form.lng || ""} onChange={(e) => up("lng", parseFloat(e.target.value) || null)} />
                </div>
                
                {form.lat && form.lng && (
                  <div className="ci-loc-pill">✅ Location Fixed: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}</div>
                )}
              </div>
              {errors.location && <span className="ci-err">{errors.location}</span>}
            </div>

            <button className="ci-submit-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "🚀 Dispatching..." : "🚀 Create Issue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ASSIGN MODAL
══════════════════════════════════════════════════════════ */
function AssignModal({ issueId, user, onClose, onAssigned }) {
  const [matches, setMatches]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [issue, setIssue]         = useState(null);
  const { pushNotification }      = useNotifications();

  useEffect(() => {
    (async () => {
      const { data: iss } = await supabase.from("issues").select("*").eq("id", issueId).single();
      setIssue(iss);
      const { data, error } = await supabase.rpc("smart_match_volunteers", { p_issue_id: issueId, p_limit: 8 });
      if (error) {
        const { data: vols } = await supabase.from("volunteer_profiles").select("*").eq("verified", true).limit(8);
        setMatches((vols || []).map((v, i) => ({ ...v, volunteer_id: v.id, match_score: 50 - i * 5, distance_km: null, skill_match: false })));
      } else {
        setMatches(data || []);
      }
      setLoading(false);
    })();
  }, [issueId]);

  const assign = async (volunteerId, matchScore) => {
    setAssigning(volunteerId);
    const { error } = await supabase.from("task_assignments").insert({
      issue_id: issueId, volunteer_id: volunteerId,
      assigned_by: user.id, status: "pending", match_score: matchScore,
    });
    if (!error) {
      await supabase.from("issues").update({ status: "assigned", assigned_to: volunteerId }).eq("id", issueId);
      await pushNotification({
        userId: volunteerId, type: "task_assigned",
        title: "New Task Assigned",
        body: `You've been matched to: "${issue?.title}". Please accept or decline.`,
        data: { issue_id: issueId },
      });
      onAssigned();
    }
    setAssigning(null);
  };

  return (
    <div className="adc-modal-overlay" onClick={onClose}>
      <div className="adc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adc-modal-header">
          <div>
            <h3>🤖 Smart Match Volunteers</h3>
            {issue && <p className="adc-modal-sub">For: <strong>{issue.title}</strong> · {issue.urgency} urgency</p>}
          </div>
          <button className="adc-modal-close" onClick={onClose}>✕</button>
        </div>
        {loading ? <div className="adc-loader">Running AI matching algorithm…</div> : (
          <div className="adc-match-list">
            {matches.length === 0 && <div className="adc-empty">No verified volunteers found nearby.</div>}
            {matches.map((v, i) => (
              <div key={v.volunteer_id} className="adc-match-card">
                <div className="adc-match-rank">#{i + 1}</div>
                <div className="adc-match-avatar">{v.name?.[0]?.toUpperCase()}</div>
                <div className="adc-match-info">
                  <div className="adc-match-name">
                    {v.name}
                    {v.skill_match && <span className="adc-skill-badge">✓ Skill Match</span>}
                  </div>
                  <div className="adc-match-meta">
                    {v.city && <span>📍 {v.city}</span>}
                    {v.distance_km != null && <span>· {v.distance_km} km away</span>}
                    {v.avg_rating > 0 && <span>· ⭐ {v.avg_rating}</span>}
                    <span>· 🏅 {v.trust_score || 0} trust</span>
                    <span>· {v.tasks_completed || 0} done</span>
                  </div>
                  <div className="adc-match-skills">
                    {(v.skills || []).slice(0, 4).map((s) => <span key={s} className="adc-skill-tag">{s}</span>)}
                  </div>
                </div>
                <div className="adc-match-score-wrap">
                  <div className="adc-match-score-ring">
                    <svg viewBox="0 0 36 36" width="52" height="52">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#1a1a1a" strokeWidth="3"/>
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#60a5fa" strokeWidth="3"
                        strokeDasharray={`${(v.match_score || 0) * 0.942} 94.2`}
                        strokeDashoffset="23.55" strokeLinecap="round" transform="rotate(-90 18 18)"/>
                    </svg>
                    <span className="adc-match-score-val">{Math.round(v.match_score || 0)}</span>
                  </div>
                  <div className="adc-match-score-label">match</div>
                </div>
                <button className="adc-btn-assign" onClick={() => assign(v.volunteer_id, v.match_score)} disabled={assigning === v.volunteer_id}>
                  {assigning === v.volunteer_id ? "…" : "Assign"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   VOLUNTEERS PANEL  (with seed button)
══════════════════════════════════════════════════════════ */
function VolunteersPanel() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");


  const load = useCallback(async () => {
    const { data } = await supabase
      .from("volunteer_profiles")
      .select("*")
      .order("trust_score", { ascending: false })
      .limit(100);
    setVolunteers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);



  const filtered = volunteers.filter((v) =>
    !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="adc-panel">
      <div className="adc-stats-row">
        <StatCard icon="👥" label="Total Volunteers" value={volunteers.length} />
        <StatCard icon="✅" label="Verified"         value={volunteers.filter((v) => v.verified).length} accent />
        <StatCard icon="⏳" label="Pending"          value={volunteers.filter((v) => !v.verified).length} />
        <StatCard icon="⭐" label="Avg Rating"       value={(volunteers.reduce((a, v) => a + (v.avg_rating || 0), 0) / (volunteers.length || 1)).toFixed(1)} />
      </div>

      <div className="adc-toolbar">
        <input className="adc-search" placeholder="🔍  Search by name or city…"
          value={search} onChange={(e) => setSearch(e.target.value)} />


      </div>

      {loading ? <div className="adc-loader">Loading volunteers…</div> : (
        <div className="adc-table-wrap">
          <table className="adc-table">
            <thead>
              <tr>
                <th>Volunteer</th><th>Skills</th><th>Location</th>
                <th>Trust Score</th><th>Rating</th><th>Tasks Done</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div className="adc-vol-avatar">{v.name?.[0]?.toUpperCase()}</div>
                      <div>
                        <div className="adc-issue-title">{v.name}</div>
                        <div className="adc-issue-sub">{v.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="adc-skills-cell">
                      {(v.skills || []).slice(0, 3).map((s) => <span key={s} className="adc-skill-tag">{s}</span>)}
                      {(v.skills || []).length > 3 && <span className="adc-muted">+{v.skills.length - 3}</span>}
                    </div>
                  </td>
                  <td>{v.city || <span className="adc-muted">—</span>}</td>
                  <td><TrustBar score={v.trust_score || 0} /></td>
                  <td>
                    {v.avg_rating > 0 ? <span>⭐ {v.avg_rating} <span className="adc-muted">({v.total_ratings})</span></span> : <span className="adc-muted">—</span>}
                  </td>
                  <td>{v.tasks_completed || 0}</td>
                  <td>
                    <Badge
                      text={v.verified ? "Verified" : v.verification_status || "pending"}
                      color={v.verified ? "#22c55e" : "#f59e0b"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="adc-empty">No volunteers found. Try seeding demo data above.</div>}
        </div>
      )}
    </div>
  );
}

function TrustBar({ score }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#f43f5e";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:5, background:"#1a1a1a", borderRadius:3, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:3, transition:"width 0.5s" }} />
      </div>
      <span style={{ fontSize:11, color, fontWeight:600, minWidth:28 }}>{pct}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   APPROVALS PANEL
══════════════════════════════════════════════════════════ */
function ApprovalsPanel({ user }) {
  const [pending, setPending]  = useState([]);
  const [loading, setLoading]  = useState(true);
  const [processing, setProc]  = useState(null);
  const { pushNotification }   = useNotifications();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("volunteer_profiles").select("*")
      .eq("verified", false).eq("verification_status", "submitted")
      .order("created_at", { ascending: true });
    setPending(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (vol) => {
    setProc(vol.id + "_approve");
    await supabase.from("volunteer_profiles").update({ verified: true, verification_status: "approved" }).eq("id", vol.id);
    await pushNotification({ userId: vol.id, type: "volunteer_approved", title: "🎉 You're Verified!", body: "Your profile has been approved. You can now receive task assignments." });
    load(); setProc(null);
  };
  const reject = async (vol) => {
    setProc(vol.id + "_reject");
    await supabase.from("volunteer_profiles").update({ verification_status: "rejected" }).eq("id", vol.id);
    await pushNotification({ userId: vol.id, type: "system", title: "Verification Update", body: "Your request needs more information. Please re-submit with clearer documents." });
    load(); setProc(null);
  };

  return (
    <div className="adc-panel">
      <div className="adc-panel-header">
        <h3>Pending Verifications</h3>
        <p>Review volunteer documents and approve or reject their applications.</p>
      </div>
      {loading ? <div className="adc-loader">Loading…</div> : (
        <>
          {pending.length === 0 && (
            <div className="adc-empty-state">
              <div className="adc-empty-icon">✅</div>
              <h4>All caught up!</h4>
              <p>No pending verification requests.</p>
            </div>
          )}
          <div className="adc-approval-list">
            {pending.map((vol) => (
              <div key={vol.id} className="adc-approval-card">
                <div className="adc-apv-left">
                  <div className="adc-vol-avatar large">{vol.name?.[0]?.toUpperCase()}</div>
                  <div className="adc-apv-info">
                    <div className="adc-apv-name">{vol.name}</div>
                    <div className="adc-apv-email">{vol.email}</div>
                    <div className="adc-apv-meta">
                      {vol.phone && <span>📞 {vol.phone}</span>}
                      {vol.city && <span>📍 {vol.city}</span>}
                      <span>📅 {new Date(vol.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="adc-apv-skills">
                      {(vol.skills || []).map((s) => <span key={s} className="adc-skill-tag">{s}</span>)}
                    </div>
                  </div>
                </div>
                <div className="adc-apv-doc">
                  {vol.doc_url ? <a href={vol.doc_url} target="_blank" rel="noreferrer" className="adc-doc-link">📄 View Document</a> : <span className="adc-muted">No document</span>}
                  {vol.phone_verified && <span className="adc-phone-ok">📱 Phone Verified</span>}
                </div>
                <div className="adc-apv-actions">
                  <button className="adc-btn-approve" onClick={() => approve(vol)} disabled={!!processing}>
                    {processing === vol.id + "_approve" ? "…" : "✓ Approve"}
                  </button>
                  <button className="adc-btn-reject" onClick={() => reject(vol)} disabled={!!processing}>
                    {processing === vol.id + "_reject" ? "…" : "✗ Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SMART MATCH PANEL
══════════════════════════════════════════════════════════ */
function SmartMatchPanel({ user }) {
  const [issues, setIssues]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("issues").select("*")
        .eq("status", "open").order("created_at", { ascending: false }).limit(30);
      setIssues(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="adc-panel">
      <div className="adc-panel-header">
        <h3>🤖 Smart Matching Engine</h3>
        <p>Select an open issue to find the best-matched volunteers using our AI scoring algorithm (skills + proximity + trust + urgency).</p>
      </div>
      {loading ? <div className="adc-loader">Loading open issues…</div> : (
        <div className="adc-match-issue-grid">
          {issues.map((issue) => (
            <div key={issue.id}
              className={`adc-match-issue-card ${selected === issue.id ? "selected" : ""}`}
              onClick={() => setSelected(selected === issue.id ? null : issue.id)}>
              <div className="adc-mi-top">
                <Badge text={issue.urgency} color={URGENCY_COLOR[issue.urgency] || "#aaa"} />
                <span className="adc-cat-pill">{issue.category}</span>
              </div>
              <div className="adc-mi-title">{issue.title}</div>
              <div className="adc-mi-addr">{issue.address || `${issue.lat?.toFixed(3)}, ${issue.lng?.toFixed(3)}`}</div>
              <div className="adc-mi-date">{new Date(issue.created_at).toLocaleDateString()}</div>
            </div>
          ))}
          {issues.length === 0 && <div className="adc-empty">No open issues. Create one in the ➕ Create Issue tab.</div>}
        </div>
      )}
      {selected && (
        <AssignModal issueId={selected} user={user}
          onClose={() => setSelected(null)}
          onAssigned={() => setSelected(null)} />
      )}
    </div>
  );
}
