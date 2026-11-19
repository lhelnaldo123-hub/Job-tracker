import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

const NAV = [
  { to: "/", label: "Board", icon: "▦", end: true },
  { to: "/find", label: "Find jobs", icon: "⌕" },
  { to: "/profile", label: "Profile", icon: "☺" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close the drawer whenever the page changes
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="shell">
      <header className="mobile-bar">
        <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
        <b>Job Tracker</b>
        <button className="avatar sm" onClick={() => navigate("/profile")} aria-label="Profile">
          {initials(user.name)}
        </button>
      </header>

      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <aside className={"sidebar" + (open ? " open" : "")}>
        <div className="side-brand">
          <span className="logo">JT</span>
          <b>Job Tracker</b>
        </div>

        <nav className="side-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <span className="ico">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="side-profile">
          <NavLink to="/profile" className="who">
            <span className="avatar">{initials(user.name)}</span>
            <span className="who-text">
              <b>{user.name}</b>
              <small className="muted">{user.jobTitle || user.email}</small>
            </span>
          </NavLink>
          <button className="logout" onClick={logout}>Log out</button>
        </div>
      </aside>

      <main className="main">
        <div className="page">{children}</div>
      </main>
    </div>
  );
}
