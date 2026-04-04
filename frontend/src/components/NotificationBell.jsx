import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import "./NotificationBell.css";

const TYPE_ICON = {
  task_assigned:     "📋",
  task_accepted:     "✅",
  task_completed:    "🎉",
  rating_received:   "⭐",
  issue_resolved:    "🔒",
  volunteer_approved:"🏅",
  system:            "🔔",
};

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="nb-wrap" ref={ref}>
      <button className="nb-btn" onClick={() => setOpen((o) => !o)} title="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && <span className="nb-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="nb-mark-all" onClick={markAllRead}>Mark all read</button>
            )}
          </div>

          <div className="nb-list">
            {notifications.length === 0 && (
              <div className="nb-empty">
                <span>🔔</span>
                <p>No notifications yet</p>
              </div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`nb-item ${n.read ? "" : "unread"}`}
                onClick={() => !n.read && markRead(n.id)}
              >
                <div className="nb-item-icon">{TYPE_ICON[n.type] || "🔔"}</div>
                <div className="nb-item-body">
                  <div className="nb-item-title">{n.title}</div>
                  {n.body && <div className="nb-item-text">{n.body}</div>}
                  <div className="nb-item-time">{timeAgo(n.created_at)}</div>
                </div>
                {!n.read && <div className="nb-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
