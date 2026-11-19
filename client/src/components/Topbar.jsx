import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Topbar() {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <div className="brand">
        <b>Job Tracker</b>
        <nav className="nav">
          <NavLink to="/" end>Board</NavLink>
          <NavLink to="/find">Find jobs</NavLink>
        </nav>
      </div>
      <div>
        <span className="muted small">{user.name}</span>
        <button className="btn ghost" onClick={logout}>Log out</button>
      </div>
    </header>
  );
}
