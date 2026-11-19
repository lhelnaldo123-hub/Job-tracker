import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken, clearToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if a token is saved, ask the server who we are
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const d = await api("/api/auth/login", { method: "POST", body: { email, password } });
    setToken(d.token);
    setUser(d.user);
  }

  async function register(name, email, password) {
    const d = await api("/api/auth/register", { method: "POST", body: { name, email, password } });
    setToken(d.token);
    setUser(d.user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
