import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import AuthPage from "./pages/auth/AuthPage";
import Dashboard from "./pages/Dashboard";

async function buildUser(supabaseUser) {
  const meta = supabaseUser.user_metadata || {};
  const base = {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: meta.name || supabaseUser.email.split("@")[0],
    role: meta.role || "volunteer",
    ...meta,
  };

  try {
    if (base.role === "ngo_admin") {
      const { data } = await supabase
        .from("ngo_profiles")
        .select("ngo_name, ngo_city, ngo_reg_number")
        .eq("id", supabaseUser.id)
        .maybeSingle();
      if (data) {
        base.ngoName = data.ngo_name;
        base.ngoCity = data.ngo_city;
      }
    } else {
      const { data } = await supabase
        .from("volunteer_profiles")
        .select(
          "trust_score, avg_rating, tasks_completed, tasks_accepted, " +
          "total_ratings, verified, verification_status, city, skills, " +
          "availability, lat, lng, phone, phone_verified, doc_url"
        )
        .eq("id", supabaseUser.id)
        .maybeSingle();
      if (data) Object.assign(base, data);
    }
  } catch (err) {
    console.warn("buildUser: profile fetch failed:", err.message);
  }

  return base;
}

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// page: "auth" | "dashboard"
export default function App() {
  const [user, setUser]       = useState(null);
  const [checked, setChecked] = useState(false);
  const [fading, setFading]   = useState(true);
  const [page, setPage]       = useState("auth");

  const userIdRef = useRef(null);
  useEffect(() => { userIdRef.current = user?.id; }, [user?.id]);

  const refreshUserRef = useRef(null);
  const refreshUser = async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      const { data } = await supabase
        .from("volunteer_profiles")
        .select(
          "trust_score, avg_rating, tasks_completed, tasks_accepted, " +
          "total_ratings, verified, verification_status, city, skills, " +
          "availability, lat, lng, phone, phone_verified, doc_url"
        )
        .eq("id", uid)
        .maybeSingle();
      if (data) setUser((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.warn("refreshUser failed:", err.message);
    }
  };
  refreshUserRef.current = refreshUser;
  const stableRefreshUser = useRef((...args) => refreshUserRef.current?.(...args)).current;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const result = await withTimeout(
          supabase.auth.getSession(),
          4000,
          { data: { session: null }, error: new Error("timeout") }
        );
        if (cancelled) return;
        const { data: { session }, error } = result;
        if (error && error.message !== "timeout") console.warn("getSession error:", error.message);
        if (session?.user) {
          const enriched = await withTimeout(buildUser(session.user), 4000, null);
          if (!cancelled) {
            if (enriched) setUser(enriched);
            else {
              const meta = session.user.user_metadata || {};
              setUser({ id: session.user.id, email: session.user.email, name: meta.name || session.user.email.split("@")[0], role: meta.role || "volunteer", ...meta });
            }
            setPage("dashboard");
          }
        }
      } catch (err) {
        console.warn("init error:", err.message);
      } finally {
        if (!cancelled) {
          setChecked(true);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (!cancelled) setFading(false);
            });
          });
        }
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return;
        if (session?.user) {
          try {
            const enriched = await withTimeout(buildUser(session.user), 4000, null);
            if (!cancelled) {
              if (enriched) setUser(enriched);
              else {
                const meta = session.user.user_metadata || {};
                setUser({ id: session.user.id, email: session.user.email, name: meta.name || session.user.email.split("@")[0], role: meta.role || "volunteer", ...meta });
              }
              setPage("dashboard");
            }
          } catch (err) {
            console.warn("onAuthStateChange buildUser failed:", err.message);
          }
        } else {
          if (!cancelled) { setUser(null); setPage("auth"); }
        }
        if (!cancelled) setChecked(true);
      }
    );

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setPage("dashboard");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage("auth");
  };

  if (!checked) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 32, height: 32, border: "2px solid #1a1a1a", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <span style={{ color: "#333", fontSize: 12 }}>VolunteerBridge is loading…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const screenStyle = fading
    ? { opacity: 0, pointerEvents: "none" }
    : { opacity: 1, transition: "opacity 0.15s ease" };

  // Dashboard page
  if (page === "dashboard" && user) {
    return (
      <div style={screenStyle}>
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onRefreshUser={stableRefreshUser}
        />
      </div>
    );
  }

  // Auth page
  return (
    <div style={screenStyle}>
      <AuthPage onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}
