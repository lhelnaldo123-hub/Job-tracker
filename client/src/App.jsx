import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Auth from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Jobs from "./pages/Jobs.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center muted">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center muted">Loading...</p>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/find" element={<Protected><Jobs /></Protected>} />
      <Route path="/login" element={<GuestOnly><Auth mode="login" /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Auth mode="register" /></GuestOnly>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
