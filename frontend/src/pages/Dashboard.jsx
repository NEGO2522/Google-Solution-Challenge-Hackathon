import { useState } from "react";
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
      </div>
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
        { id: "profile", icon: "◯", title: "My Profile",     desc: "Verify skills & build trust score"     },
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
    { label: "Phone",    val: user.phone_verified ? "Verified ✓" : "Not verified",  cls: user.phone_verified ? "green" : "amber" },
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
              <p>Upload your ID and verify your phone to receive task assignments from NGO admins.</p>
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
    { label: "Phone verified",  done: !!user.phone_verified,               action: "profile"},
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
