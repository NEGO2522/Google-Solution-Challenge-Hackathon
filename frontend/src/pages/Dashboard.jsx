import { useState, useRef, useEffect } from "react";
import VolunteerProfile from "./volunteer/VolunteerProfile";
import IssueReport from "./issues/IssueReport";
import MapView from "./map/MapView";
import AdminDashboard from "./admin/AdminDashboard";
import RatingPanel from "./admin/RatingPanel";
import MyTasks from "./volunteer/MyTasks";
import NotificationBell from "../components/NotificationBell";
import { NotificationProvider } from "../context/NotificationContext";
import "./Dashboard.css";

const NAV_VOLUNTEER = [
  { id: "home",    icon: "⊞", label: "Overview" },
  { id: "tasks",   icon: "✓", label: "My Tasks"  },
  { id: "map",     icon: "◎", label: "Live Map"  },
  { id: "issues",  icon: "⚑", label: "Report"    },
  { id: "profile", icon: "◯", label: "Profile"   },
];

const NAV_ADMIN = [
  { id: "home",    icon: "⊞", label: "Overview"  },
  { id: "admin",   icon: "⚙", label: "Console"   },
  { id: "ratings", icon: "★", label: "Ratings"   },
  { id: "map",     icon: "◎", label: "Live Map"  },
  { id: "issues",  icon: "⚑", label: "Report"    },
];

export default function Dashboard({ user, onLogout, onRefreshUser }) {
  const isAdmin = user.role === "ngo_admin";
  const NAV = isAdmin ? NAV_ADMIN : NAV_VOLUNTEER;
  const [activePage, setActivePage] = useState("home");
  const currentNav = NAV.find((n) => n.id === activePage);

  const renderPage = () => {
    switch (activePage) {
      case "home":    return <HomeDashboard user={user} isAdmin={isAdmin} onNavigate={setActivePage} />;
      case "map":     return <MapView user={user} />;
      case "profile": return <VolunteerProfile user={user} onRefreshUser={onRefreshUser} />;
      case "issues":  return <IssueReport user={user} onIssueSubmitted={() => setActivePage("home")} />;
      case "admin":   return <AdminDashboard user={user} />;
      case "ratings": return <RatingPanel user={user} />;
      case "tasks":   return <MyTasks user={user} />;
      default:        return null;
    }
  };

  return (
    <NotificationProvider user={user}>
      <div className="dash-root">

        {/* ── Sidebar ── */}
        <aside className="dash-sidebar">
          <div className="dash-sidebar-brand">
            <div className="dash-sidebar-logo">⛑</div>
            <span className="dash-sidebar-name">VolunteerBridge</span>
            <span className="dash-sidebar-role">{isAdmin ? "Admin" : "Vol"}</span>
          </div>

          <nav className="dash-sidebar-nav">
            <div className="dash-sidebar-label">Menu</div>
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`dash-nav-item ${activePage === item.id ? "active" : ""}`}
                onClick={() => setActivePage(item.id)}
              >
                <span className="dash-nav-icon">{item.icon}</span>
                <span className="dash-nav-text">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="dash-sidebar-footer">
            <div className="dash-sidebar-user">
              <div className="dash-avatar">{user.name?.[0]?.toUpperCase() || "U"}</div>
              <div className="dash-user-info">
                <div className="dash-user-name">{user.name?.split(" ")[0]}</div>
                <div className="dash-user-email">{user.email}</div>
              </div>
            </div>
            <button className="dash-logout-btn" onClick={onLogout}>
              <span>⎋</span> Sign out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="dash-main">
          <header className="dash-topbar">
            <div className="dash-topbar-left">
              {activePage !== "home" ? (
                <div className="dash-breadcrumb">
                  <button className="dash-bread-home" onClick={() => setActivePage("home")}>Overview</button>
                  <span className="dash-bread-sep">/</span>
                  <span className="dash-bread-current">{currentNav?.label}</span>
                </div>
              ) : (
                <span className="dash-topbar-title">
                  {isAdmin ? (user.ngoName || "NGO Dashboard") : "My Dashboard"}
                </span>
              )}
            </div>
            <div className="dash-topbar-right">
              <NotificationBell />
            </div>
          </header>

          <main className="dash-content">
            {renderPage()}
          </main>
        </div>

        {/* ── Bottom Nav (mobile only) ── */}
        <nav className="dash-bottom-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`dash-bottom-nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="dash-bottom-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

      </div>
      <ChatbotWidget user={user} />
    </NotificationProvider>
  );
}

/* ══════════════════════════════════════
   HOME DASHBOARD — single column
══════════════════════════════════════ */
function HomeDashboard({ user, isAdmin, onNavigate }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const volunteerStats = [
    { label: "Skills",      value: user.skills?.length || "0",                           sub: "verified areas"   },
    { label: "Trust Score", value: user.trust_score != null ? user.trust_score : "—",    sub: "reputation"       },
    { label: "Tasks Done",  value: user.tasks_completed ?? "—",                          sub: "completed"        },
    { label: "Status",      value: user.verified ? "Verified" : "Pending",
                            accent: user.verified,                                        sub: "account status"   },
  ];

  const adminStats = [
    { label: "Organization", value: user.ngoName || "—", sub: "registered NGO"  },
    { label: "Region",       value: user.ngoCity || "—", sub: "coverage area"   },
    { label: "Open Issues",  value: "—",                 sub: "needs attention"  },
    { label: "Volunteers",   value: "—",                 sub: "in network"       },
  ];

  const stats = isAdmin ? adminStats : volunteerStats;

  const quickActions = isAdmin
    ? [
        { id: "admin",   icon: "⚙", title: "Admin Console",  desc: "Manage issues, volunteers & approvals" },
        { id: "ratings", icon: "★", title: "Rate Volunteers", desc: "Review completed tasks & rate work"    },
        { id: "map",     icon: "◎", title: "Live Map",        desc: "Real-time crisis monitoring"           },
      ]
    : [
        { id: "tasks",   icon: "✓", title: "My Tasks",       desc: "Accept & complete assigned tasks"      },
        { id: "map",     icon: "◎", title: "Explore Map",    desc: "Find help requests near you"           },
        { id: "profile", icon: "◯", title: "My Profile",     desc: "Update skills & build trust score"     },
        { id: "issues",  icon: "⚑", title: "Report Issue",   desc: "Flag a local emergency"                },
      ];

  const statusRows = isAdmin ? [
    { label: "NGO",      val: user.ngoName || "—",  cls: "" },
    { label: "City",     val: user.ngoCity || "—",  cls: "" },
    { label: "Role",     val: "NGO Admin",           cls: "green" },
  ] : [
    { label: "Status",   val: user.verified ? "Verified" : "Pending",             cls: user.verified ? "green" : "amber" },
    { label: "Rating",   val: user.avg_rating ? `⭐ ${user.avg_rating}` : "None",  cls: "" },
    { label: "Done",     val: `${user.tasks_completed ?? 0} tasks`,               cls: "" },
    { label: "City",     val: user.city || "Not set",                             cls: "" },
    { label: "Avail.",   val: user.availability || "Not set",                     cls: "" },
  ];

  return (
    <div className="home-root">

      {/* Hero — spans full width */}
      <div className="home-hero">
        <div className="home-hero-text">
          <p className="home-greeting">{greeting}</p>
          <h1 className="home-name">{user.name} <span className="home-wave">👋</span></h1>
          <p className="home-sub">
            {isAdmin
              ? `Managing ${user.ngoName || "your NGO"} · ${user.ngoCity || "set your city"}`
              : user.skills?.length
                ? `${user.skills.length} skill${user.skills.length > 1 ? "s" : ""} · Trust ${user.trust_score ?? "—"} · ${user.city || "set location"}`
                : "Complete your profile to receive task assignments"}
          </p>
        </div>
        <div className="home-hero-badge">
          <span className="home-badge-icon">{isAdmin ? "🏢" : "🙋"}</span>
          <span className="home-badge-label">{isAdmin ? "NGO Admin" : "Volunteer"}</span>
        </div>
      </div>

      {/* ── Left column ── */}
      <div className="home-left-col">

        {/* Stats */}
        <div className="home-stats-grid">
          {stats.map((s, i) => (
            <div key={i} className={`home-stat-card ${s.accent ? "accent" : ""}`}>
              <div className="home-stat-value">{s.value}</div>
              <div className="home-stat-label">{s.label}</div>
              <div className="home-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="home-section">
          <div className="home-section-header">
            <h2>Quick Actions</h2>
            <span className="home-section-line" />
          </div>
          <div className="home-actions-grid">
            {quickActions.map((a) => (
              <button key={a.id} className="home-action-card" onClick={() => onNavigate(a.id)}>
                <div className="home-action-icon">{a.icon}</div>
                <div className="home-action-body">
                  <div className="home-action-title">{a.title}</div>
                  <div className="home-action-desc">{a.desc}</div>
                </div>
                <span className="home-action-arrow">›</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skills */}
        {!isAdmin && user.skills?.length > 0 && (
          <div className="home-section">
            <div className="home-section-header">
              <h2>Your Skills</h2>
              <span className="home-section-line" />
            </div>
            <div className="home-skills-wrap">
              {user.skills.map((s) => <span key={s} className="home-skill-tag">{s}</span>)}
              <button className="home-skill-edit" onClick={() => onNavigate("profile")}>+ Edit</button>
            </div>
          </div>
        )}

        {/* Verification nudge */}
        {!isAdmin && !user.verified && (
          <div className="home-nudge">
            <div className="home-nudge-icon">🔐</div>
            <div className="home-nudge-text">
              <strong>Complete Verification</strong>
              <p>Upload your ID document to get verified and receive task assignments from NGO admins.</p>
            </div>
            <button className="home-nudge-btn" onClick={() => onNavigate("profile")}>Verify Now →</button>
          </div>
        )}
      </div>

      {/* ── Right column ── */}
      <div className="home-right-col">

        {/* Profile strength */}
        <div className="home-side-card">
          <div className="home-side-card-title">Profile Strength</div>
          <ProfileStrength user={user} isAdmin={isAdmin} onNavigate={onNavigate} />
        </div>

        {/* Account details */}
        <div className="home-side-card">
          <div className="home-side-card-title">Account Details</div>
          <div className="home-side-rows">
            {statusRows.map((r, i) => (
              <div key={i} className="home-side-row">
                <span className="home-side-row-label">{r.label}</span>
                <span className={`home-side-row-val ${r.cls}`}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   PROFILE STRENGTH
══════════════════════════════════════ */
function ProfileStrength({ user, isAdmin, onNavigate }) {
  const checks = isAdmin ? [
    { label: "NGO name set",    done: !!user.ngoName,                      action: null    },
    { label: "City configured", done: !!user.ngoCity,                      action: null    },
    { label: "Created issue",   done: false,                               action: "issues"},
  ] : [
    { label: "Name saved",      done: !!user.name,                         action: "profile"},
    { label: "Skills added",    done: (user.skills?.length||0) > 0,        action: "profile"},
    { label: "Location set",    done: !!user.city,                         action: "profile"},
    { label: "Doc uploaded",    done: !!user.doc_url,                      action: "profile"},
    { label: "Admin approved",  done: !!user.verified,                     action: null    },
  ];
  const done  = checks.filter(c => c.done).length;
  const pct   = Math.round((done / checks.length) * 100);
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div>
      <div className="home-strength-bar-wrap">
        <div className="home-strength-bar">
          <div className="home-strength-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="home-strength-pct" style={{ color }}>{pct}%</span>
      </div>
      <div className="home-strength-items">
        {checks.map((c, i) => (
          <div key={i}
            className={`home-strength-item ${c.done ? "done" : "todo"} ${!c.done && c.action ? "clickable" : ""}`}
            onClick={() => !c.done && c.action && onNavigate(c.action)}
          >
            <span className="home-strength-check">{c.done ? "✅" : "○"}</span>
            <span className="home-strength-text">{c.label}</span>
            {!c.done && c.action && <span className="home-strength-action">Fix ›</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   CHATBOT WIDGET
══════════════════════════════════════ */
function ChatbotWidget({ user }) {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: `Hi ${user?.name?.split(" ")[0] || "there"} 👋 I'm your VolunteerBridge assistant. Ask me anything about tasks, issues, or how to use the platform!` }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const systemPrompt = `You are a helpful assistant for VolunteerBridge, an AI-powered disaster relief volunteer platform.
The current user is: ${user?.name}, role: ${user?.role === "ngo_admin" ? "NGO Admin" : "Volunteer"}.
Help them with questions about: reporting issues, finding tasks, trust scores, volunteer matching, map features, and platform navigation.
Be concise, friendly, and helpful. Keep answers under 80 words.`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemma-2-9b-it:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text }] }],
          }),
        }
      );
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      setMessages((prev) => [...prev, { role: "assistant", text: reply || "Sorry, I couldn't get a response. Try again!" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%",
          background: "#ffffff",
          border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, transition: "transform 0.2s",
          transform: open ? "scale(0.9)" : "scale(1)",
        }}
        title="VolunteerBridge Assistant"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg"><path d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2z"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg"><path d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2z"/></svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 96, right: 28, zIndex: 9998,
          width: 340, height: 480,
          background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, display: "flex", flexDirection: "column",
          boxShadow: "0 8px 48px rgba(0,0,0,0.6)", overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            padding: "14px 16px", background: "linear-gradient(135deg, #1e3a8a22, #312e8122)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>💬</span>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>VB Assistant</div>
              <div style={{ color: "#22c55e", fontSize: 10, fontWeight: 600 }}>● Online</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "80%", padding: "8px 12px", borderRadius: 12,
                  fontSize: 12, lineHeight: 1.5,
                  background: m.role === "user"
                    ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                    : "rgba(255,255,255,0.06)",
                  color: "#fff",
                  borderBottomRightRadius: m.role === "user" ? 4 : 12,
                  borderBottomLeftRadius:  m.role === "assistant" ? 4 : 12,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "8px 14px", borderRadius: 12, background: "rgba(255,255,255,0.06)",
                  color: "#64748b", fontSize: 12,
                }}>typing…</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex", gap: 8,
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything…"
              style={{
                flex: 1, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                padding: "7px 10px", color: "#fff", fontSize: 12,
                outline: "none", fontFamily: "inherit",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                border: "none", borderRadius: 8, padding: "7px 14px",
                color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >Send</button>
          </div>
        </div>
      )}
    </>
  );
}
