import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import Layout from "../components/Layout.jsx";
import { getTheme, setTheme } from "../theme.js";

const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

export default function Profile() {
  const { user, setUser, logout } = useAuth();

  const [form, setForm] = useState({
    name: user.name,
    jobTitle: user.jobTitle || "",
    location: user.location || "",
    weeklyGoal: user.weeklyGoal || 5,
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  const [theme, setThemeState] = useState(getTheme());
  const [delPw, setDelPw] = useState("");
  const [delErr, setDelErr] = useState("");

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  async function saveProfile(e) {
    e.preventDefault();
    setMsg(""); setErr(""); setBusy(true);
    try {
      const d = await api("/api/auth/me", { method: "PUT", body: form });
      setUser(d.user);
      setMsg("Profile saved");
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg(""); setPwErr("");
    try {
      await api("/api/auth/password", { method: "PUT", body: pw });
      setPw({ currentPassword: "", newPassword: "" });
      setPwMsg("Password changed");
    } catch (x) {
      setPwErr(x.message);
    }
  }

  async function deleteAccount(e) {
    e.preventDefault();
    setDelErr("");
    if (!window.confirm("This permanently deletes your account and all your jobs. Continue?")) return;
    try {
      await api("/api/auth/me", { method: "DELETE", body: { password: delPw } });
      logout();
    } catch (x) {
      setDelErr(x.message);
    }
  }

  function pickTheme(mode) {
    setTheme(mode);
    setThemeState(mode);
  }

  return (
    <Layout>
      <div className="profile-head">
        <span className="avatar lg">{initials(user.name)}</span>
        <div>
          <h2>{user.name}</h2>
          <p className="muted small">{user.email}</p>
        </div>
      </div>

      <form className="card section" onSubmit={saveProfile}>
        <h3>Your details</h3>
        <label>Name<input value={form.name} onChange={set("name")} required /></label>
        <div className="row">
          <label>Job you are looking for<input value={form.jobTitle} onChange={set("jobTitle")} placeholder="e.g. Full-stack developer" /></label>
          <label>Location<input value={form.location} onChange={set("location")} placeholder="e.g. Accra, Ghana" /></label>
        </div>
        <label>Applications per week (your goal)
          <input type="number" min="1" max="100" value={form.weeklyGoal} onChange={set("weeklyGoal")} />
        </label>
        {err && <p className="error">{err}</p>}
        {msg && <p className="ok small">{msg}</p>}
        <button className="btn small-btn" disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
      </form>

      <div className="card section">
        <h3>Appearance</h3>
        <div className="chips">
          {["system", "light", "dark"].map((m) => (
            <button key={m} type="button" className={"chip" + (theme === m ? " on" : "")} onClick={() => pickTheme(m)}>
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <form className="card section" onSubmit={changePassword}>
        <h3>Change password</h3>
        <label>Current password
          <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
        </label>
        <label>New password
          <input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} placeholder="At least 6 characters" required />
        </label>
        {pwErr && <p className="error">{pwErr}</p>}
        {pwMsg && <p className="ok small">{pwMsg}</p>}
        <button className="btn small-btn">Update password</button>
      </form>

      <form className="card section danger-zone" onSubmit={deleteAccount}>
        <h3>Delete account</h3>
        <p className="muted small">This removes your account and every job you saved. It cannot be undone.</p>
        <label>Enter your password to confirm
          <input type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} required />
        </label>
        {delErr && <p className="error">{delErr}</p>}
        <button className="btn small-btn danger-btn">Delete my account</button>
      </form>
    </Layout>
  );
}
