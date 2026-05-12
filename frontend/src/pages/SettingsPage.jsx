import { useEffect, useState } from "react";
import { PlugZap, ShieldCheck, Smartphone } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../components/Topbar";
import api from "../services/api";
import { walletProjectIdConfigured } from "../web3/config";

export default function SettingsPage() {
  const { openSidebar } = useOutletContext();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api
      .get("/system/web3-status")
      .then((response) => setStatus(response.data))
      .catch(() => setStatus(null));
  }, []);

  return (
    <div>
      <Topbar
        title="Pengaturan"
        subtitle="Konfigurasi backend, Pinata, jaringan Sepolia, dan kesiapan wallet connect untuk desktop maupun mobile."
        onOpenMenu={openSidebar}
      />
      <div className="grid gap-6 p-4 lg:grid-cols-2 lg:p-8">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-2xl bg-emerald-50 p-2 text-emerald-700">
              <PlugZap size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Status integrasi</h3>
              <p className="text-sm text-slate-500">Pantau koneksi service yang dipakai sistem.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="surface-muted rounded-[24px] p-4">
              <div className="font-semibold text-slate-900">Pinata</div>
              <div className="mt-1">{status?.ipfs?.enabled ? "Aktif" : "Belum aktif"}</div>
              <div className="mt-2 break-all text-xs text-slate-500">Gateway: {status?.ipfs?.gateway || "-"}</div>
            </div>
            <div className="surface-muted rounded-[24px] p-4">
              <div className="font-semibold text-slate-900">Blockchain</div>
              <div className="mt-1">{status?.blockchain?.enabled ? "Aktif" : "Belum aktif"}</div>
              <div className="mt-2 text-xs text-slate-500">Network: {status?.blockchain?.network || "sepolia"}</div>
              <div className="mt-1 text-xs text-slate-500">Chain ID: {status?.blockchain?.chainId || "11155111"}</div>
              <div className="mt-1 break-all text-xs text-slate-500">Contract: {status?.blockchain?.contractAddress || "-"}</div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-2xl bg-sky-50 p-2 text-sky-700">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Wallet connect</h3>
              <p className="text-sm text-slate-500">Kesiapan tombol connect wallet untuk browser dan mobile wallet.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="surface-muted rounded-[24px] p-4">
              <div className="font-semibold text-slate-900">WalletConnect Project ID</div>
              <div className="mt-1">{walletProjectIdConfigured ? "Sudah diisi" : "Belum diisi"}</div>
              <div className="mt-2 text-xs text-slate-500">Isi VITE_WALLETCONNECT_PROJECT_ID di frontend/.env agar flow QR dan mobile wallet bisa aktif penuh.</div>
            </div>
            <div className="surface-muted rounded-[24px] p-4">
              <div className="font-semibold text-slate-900">Desktop wallet</div>
              <div className="mt-1 text-xs text-slate-500">Injected wallet seperti MetaMask browser tetap dapat digunakan lewat tombol connect di topbar.</div>
            </div>
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-2xl bg-amber-50 p-2 text-amber-700">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Catatan keamanan</h3>
              <p className="text-sm text-slate-500">Praktik aman untuk backend, wallet, dan data produksi.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
            <div className="surface-muted rounded-[24px] p-4">Jangan simpan Pinata JWT dan private key wallet di frontend.</div>
            <div className="surface-muted rounded-[24px] p-4">Semua penulisan JSON ke IPFS dan transaksi Sepolia tetap dilakukan lewat backend.</div>
            <div className="surface-muted rounded-[24px] p-4">Tombol wallet connect di dashboard cocok untuk verifikasi user wallet, signing, atau ekspansi fitur web3 berikutnya.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
