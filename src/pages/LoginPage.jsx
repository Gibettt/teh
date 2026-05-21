import { Leaf, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

export default function LoginPage() {
  const { login, loading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await login(form.email, form.password);
    if (!result.ok) setError(result.message);
  };

  return (
    <div className="flex min-h-screen bg-[linear-gradient(135deg,#14352a_0%,#224a3c_46%,#efe7da_46.2%,#f7f2e9_100%)]">
      <div className="hidden flex-1 items-center justify-center p-10 lg:flex">
        <div className="max-w-xl text-white">
          <div className="mb-6 inline-flex rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur">
            <Leaf size={40} className="text-emerald-200" />
          </div>
          <h1 className="text-5xl font-bold leading-tight">{t("login.heading")}</h1>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="card-paper w-full max-w-md p-5 sm:p-8">
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex rounded-[24px] bg-emerald-100 p-3 text-emerald-700 shadow-sm">
              <Leaf size={26} />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">{t("login.title")}</h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label">{t("login.email")}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  className="input pl-10"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="label">{t("login.password")}</label>
              <div className="relative">
                <LockKeyhole size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  className="input pl-10"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>

            {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? t("common.loading") : t("login.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
