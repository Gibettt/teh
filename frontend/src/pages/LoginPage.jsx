import { Leaf, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login, loading, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: "admin@teh.local", password: "admin123" });
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
          <h1 className="text-5xl font-bold leading-tight">Sistem Traceability Produksi Teh</h1>
          <p className="mt-5 text-lg leading-8 text-emerald-50/80">
            Dashboard admin paper-style untuk mengelola batch, mencatat JSON ke Pinata, mengirim CID ke blockchain Sepolia, dan menyiapkan koneksi wallet untuk desktop maupun mobile.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 lg:p-10">
        <div className="card-paper w-full max-w-md p-8">
          <div className="mb-8">
            <div className="inline-flex rounded-[24px] bg-emerald-100 p-3 text-emerald-700 shadow-sm">
              <Leaf size={26} />
            </div>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">Login Admin</h2>
            <p className="mt-2 text-sm text-slate-500">Masuk untuk mengelola batch, wallet connect, dan traceability produksi teh.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label">Email</label>
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
              <label className="label">Password</label>
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
              {loading ? "Memproses..." : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="surface-muted mt-6 rounded-[22px] p-4 text-sm text-slate-600">
            Demo login: <span className="font-semibold">admin@teh.local</span> / <span className="font-semibold">admin123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
