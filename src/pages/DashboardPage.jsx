import { useEffect, useMemo, useState } from "react";
import { Activity, Blocks, Cloud, ShieldCheck } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import BatchTable from "../components/BatchTable";
import api from "../services/api";

export default function DashboardPage() {
  const { openSidebar } = useOutletContext();
  const [batches, setBatches] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    api.get("/batches").then((response) => setBatches(response.data));
    api.get("/system/web3-status").then((response) => setSystemStatus(response.data)).catch(() => setSystemStatus(null));
  }, []);

  const stats = useMemo(() => {
    const completed = batches.filter((batch) => batch.status === "completed").length;
    const progress = batches.filter((batch) => batch.status === "in_progress").length;
    return {
      total: batches.length,
      completed,
      progress,
      ipfsRecords: batches.reduce(
        (sum, batch) =>
          sum +
          batch.stages.filter((stage) => stage.status === "completed" || stage.status === "skipped").length,
        0
      ),
    };
  }, [batches]);

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle="Ringkasan batch produksi, status integrasi Pinata dan Sepolia, serta kontrol jalur proses dari satu tampilan utama."
        onOpenMenu={openSidebar}
      />
      <div className="space-y-6 p-4 lg:p-8">
        <section className="card-paper grid gap-6 p-6 xl:grid-cols-[1.35fr_0.95fr] xl:p-8">
          <div>
            <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Modern paper dashboard
            </div>
            <h3 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Traceability produksi teh yang rapi, responsif, dan siap dipakai operator.</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Batch dibuat dari dashboard admin, data tahapan disimpan ke Supabase dan Pinata sebagai JSON, lalu seluruh CID dicatat ke blockchain Sepolia setelah semua tahap final. Wallet juga bisa langsung dihubungkan dari kanan atas untuk kebutuhan verifikasi operator atau ekspansi fitur web3 berikutnya.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="surface-muted rounded-[24px] p-4">
                <div className="inline-flex rounded-2xl bg-white p-2 text-emerald-700 shadow-sm">
                  <Cloud size={18} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">JSON ke Pinata</p>
                <p className="mt-1 text-xs text-slate-500">Semua complete dan skip terekam sebagai payload audit.</p>
              </div>
              <div className="surface-muted rounded-[24px] p-4">
                <div className="inline-flex rounded-2xl bg-white p-2 text-sky-700 shadow-sm">
                  <Blocks size={18} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">Final CID ke Sepolia</p>
                <p className="mt-1 text-xs text-slate-500">CID dikirim on-chain setelah semua tahap final.</p>
              </div>
              <div className="surface-muted rounded-[24px] p-4">
                <div className="inline-flex rounded-2xl bg-white p-2 text-amber-700 shadow-sm">
                  <Activity size={18} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">Skip dari awal</p>
                <p className="mt-1 text-xs text-slate-500">Tahap opsional dapat diputuskan skip lebih awal.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 content-start">
            <div className="surface-muted rounded-[26px] p-5">
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-2xl bg-white p-2 text-emerald-700 shadow-sm">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Status integrasi backend</p>
                  <p className="text-xs text-slate-500">Pantauan singkat Pinata dan jaringan Sepolia.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pinata</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{systemStatus?.ipfs?.enabled ? "Aktif" : "Belum aktif"}</p>
                  <p className="mt-1 text-xs text-slate-500">Gateway: {systemStatus?.ipfs?.gateway || "-"}</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Blockchain</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{systemStatus?.blockchain?.enabled ? "Sepolia aktif" : "Mode mock"}</p>
                  <p className="mt-1 text-xs text-slate-500">Chain ID: {systemStatus?.blockchain?.chainId || "11155111"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Batch" value={stats.total} hint="Jumlah seluruh batch produksi" tone="default" />
          <StatCard title="Sedang Berjalan" value={stats.progress} hint="Batch yang masih dalam proses" tone="amber" />
          <StatCard title="Selesai" value={stats.completed} hint="Semua tahap sudah selesai atau skip" tone="green" />
          <StatCard title="Record IPFS" value={stats.ipfsRecords} hint="Termasuk tahap selesai dan skip" tone="sky" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <BatchTable batches={batches.slice(0, 8)} />
          <div className="card p-6">
            <h3 className="text-lg font-bold">Alur Sistem</h3>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div className="surface-muted rounded-[22px] p-4">
                1. Admin membuat batch dan sistem langsung menyiapkan jalur multi-path bawaan.
              </div>
              <div className="surface-muted rounded-[22px] p-4">
                2. Wallet dapat dihubungkan dari topbar menggunakan wagmi + RainbowKit untuk desktop dan mobile wallet flow.
              </div>
              <div className="surface-muted rounded-[22px] p-4">
                3. Tahap opsional bisa di-skip sejak awal tanpa menunggu tahap itu aktif, tetapi proses inti tetap mengikuti prasyarat produksi.
              </div>
              <div className="surface-muted rounded-[22px] p-4">
                4. Payload complete atau skip disimpan dulu ke Supabase dan Pinata, lalu seluruh CID dicatat ke blockchain saat batch selesai.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
