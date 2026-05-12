import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("tea-traceability-user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("tea-traceability-token", data.token);
      localStorage.setItem("tea-traceability-user", JSON.stringify(data.user));
      setUser(data.user);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error.response?.data?.message || "Login gagal",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("tea-traceability-token");
    localStorage.removeItem("tea-traceability-user");
    setUser(null);
  };

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener("tea-logout", handleUnauthorized);
    return () => window.removeEventListener("tea-logout", handleUnauthorized);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
