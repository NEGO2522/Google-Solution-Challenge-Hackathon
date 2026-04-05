import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../../lib/supabase";
import "leaflet/dist/leaflet.css";
import "./IssueReport.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const CATEGORIES = [
  { value: "medical",   label: "🏥 Medical",   color: "#f87171" },
  { value: "food",      label: "🍱 Food",       color: "#fb923c" },
  { value: "shelter",   label: "🏠 Shelter",    color: "#a78bfa" },
  { value: "rescue",    label: "🚨 Rescue",     color: "#f43f5e" },
  { value: "education", label: "📚 Education",  color: "#60a5fa" },
  { value: "other",     label: "📌 Other",      color: "#94a3b8" },
];
const URGENCY = [
  { value: "low",      label: "🟢 Low",      cls: "u-low"      },
  { value: "medium",   label: "🟡 Medium",   cls: "u-medium"   },
  { value: "high",     label: "🔴 High",     cls: "u-high"     },
  { value: "critical", label: "🚨 Critical", cls: "u-critical" },
];

function LocationPicker({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export default function IssueReport({ user, onIssueSubmitted }) {
  const [form, setForm] = useState({
    title: "", description: "", category: "", urgency: "", address: "",
    lat: null, lng: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [errors, setErrors]         = useState({});
  const [locating, setLocating]     = useState(false);
  const [mapCenter, setMapCenter]   = useState([20.5937, 78.9629]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setMapCenter([pos.coords.latitude, pos.coords.longitude]);
    });
  }, []);

  const update = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const pickMyLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("lat", pos.coords.latitude);
        update("lng", pos.coords.longitude);
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => { alert("Location access denied."); setLocating(false); }
    );
  };

  const [enhancing, setEnhancing] = useState(false);

  const enhanceWithAI = async () => {
    if (!form.title.trim() && !form.description.trim()) {
      alert("Enter a title or description first.");
      return;
    }
    setEnhancing(true);
    try {
      const prompt = `You are a disaster relief coordinator. A volunteer has reported this community issue:

Title: ${form.title || "(no title)"}
Category: ${form.category || "(unknown)"}
Urgency: ${form.urgency || "(unknown)"}
Description: ${form.description || "(no description)"}
Location: ${form.address || "(unknown)"}

Rewrite the description to be clear, concise and actionable for NGO volunteers. Include: number of people affected (estimate if unknown), immediate needs, and any safety concerns. Keep it under 100 words. Return only the improved description text, nothing else.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      const data = await res.json();
      const improved = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (improved) update("description", improved.trim());
      else alert("Gemini didn't return a response. Try again.");
    } catch (err) {
      alert("AI enhancement failed: " + err.message);
    }
    setEnhancing(false);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title    = "Title is required";
    if (!form.category)     e.category = "Select a category";
    if (!form.urgency)      e.urgency  = "Select urgency level";
    if (!form.lat || !form.lng) e.location = "Pin the issue location on the map";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await supabase.from("issues").insert({
      reported_by: user.id, reporter_name: user.name,
      title: form.title, description: form.description,
      category: form.category, urgency: form.urgency,
      address: form.address, lat: form.lat, lng: form.lng,
      location: `POINT(${form.lng} ${form.lat})`, status: "open",
    });
    setSubmitting(false);
    if (error) { alert("Submit failed: " + error.message); return; }
    setSubmitted(true);
    onIssueSubmitted?.();
  };

  if (submitted) {
    return (
      <div className="ir-success">
        <div className="ir-success-icon">🎉</div>
        <h2>Issue Reported!</h2>
        <p>Your issue has been submitted. The system will match nearby volunteers shortly.</p>
        <button className="ir-btn-primary" onClick={() => setSubmitted(false)}>+ Report Another</button>
      </div>
    );
  }

  return (
    <div className="ir-root">
      <div className="ir-header">
        <div>
          <h2>📋 Report a Community Issue</h2>
          <p>Describe the problem, set urgency, and pin the exact location on the map.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="ir-layout">

          {/* ── LEFT COL ── */}
          <div className="ir-left">

            {/* Details */}
            <div className="ir-section">
              <h3>Issue Details</h3>
              <div className="ir-field">
                <label>Title *</label>
                <input value={form.title} onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Flood victims need food & shelter"
                  className={errors.title ? "err" : ""} />
                {errors.title && <span className="ir-err">{errors.title}</span>}
              </div>
              <div className="ir-field">
                <label>Description <span style={{color:'#3b82f6',fontWeight:600,fontSize:10}}>✨ AI-powered</span></label>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
                  placeholder="Number of people affected, immediate needs…" rows={4} />
                <button type="button" className="ir-ai-btn" onClick={enhanceWithAI} disabled={enhancing}>
                  {enhancing ? <><span className="ir-ai-spinner"/>Gemini is enhancing…</> : "✨ Enhance with Gemini AI"}
                </button>
              </div>
              <div className="ir-field">
                <label>Address / Landmark</label>
                <input value={form.address} onChange={(e) => update("address", e.target.value)}
                  placeholder="e.g. Near Birla Mandir, Jaipur" />
              </div>
            </div>

            {/* Category */}
            <div className="ir-section">
              <h3>Category *</h3>
              <div className="ir-category-grid">
                {CATEGORIES.map((c) => (
                  <button key={c.value} type="button"
                    className={`ir-cat-btn ${form.category === c.value ? "active" : ""}`}
                    style={form.category === c.value ? { borderColor: c.color, color: c.color, background: c.color + "18" } : {}}
                    onClick={() => update("category", c.value)}>
                    {c.label}
                  </button>
                ))}
              </div>
              {errors.category && <span className="ir-err">{errors.category}</span>}
            </div>

            {/* Urgency */}
            <div className="ir-section">
              <h3>Urgency Level *</h3>
              <div className="ir-urgency-row">
                {URGENCY.map((u) => (
                  <button key={u.value} type="button"
                    className={`ir-urgency-btn ${u.cls} ${form.urgency === u.value ? "active" : ""}`}
                    onClick={() => update("urgency", u.value)}>
                    {u.label}
                  </button>
                ))}
              </div>
              {errors.urgency && <span className="ir-err">{errors.urgency}</span>}
            </div>
          </div>

          {/* ── RIGHT COL — MAP ── */}
          <div className="ir-right">
            <div className="ir-section ir-map-section">
              <h3>📍 Location *</h3>
              <p className="ir-hint">Click the map to drop a pin, or use your current location.</p>

              <div className="ir-loc-actions">
                <button type="button" className="ir-btn-loc" onClick={pickMyLocation} disabled={locating}>
                  {locating ? "📡 Detecting…" : "📍 Use My Location"}
                </button>
                {form.lat && form.lng && (
                  <span className="ir-loc-pill">📌 {form.lat.toFixed(4)}, {form.lng.toFixed(4)}</span>
                )}
              </div>

              <div className="ir-map-wrapper">
                <MapContainer center={mapCenter} zoom={12} className="ir-map" key={mapCenter.join(",")}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap &copy; CARTO'
                  />
                  <LocationPicker onPick={(lat, lng) => { update("lat", lat); update("lng", lng); }} />
                  {form.lat && form.lng && <Marker position={[form.lat, form.lng]} />}
                </MapContainer>
                <div className="ir-map-overlay-hint">👆 Click to pin location</div>
              </div>
              {errors.location && <span className="ir-err">{errors.location}</span>}
            </div>

            {/* Submit inside right col */}
            <button type="submit" className={`ir-btn-primary ${submitting ? "loading" : ""}`} disabled={submitting}>
              {submitting ? <><div className="ir-spinner" /> Submitting…</> : "🚀 Submit Issue Report"}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
