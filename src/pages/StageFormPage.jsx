import { useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import api from "../services/api";
import { humanStage } from "../utils/formatters";

const stageTemplates = {
  plucking: { operatorShift: "", leafGrade: "", weightKg: "", location: "", notes: "" },
  withering: { durationMinutes: "", temperature: "", humidity: "", weightBeforeKg: "", weightAfterKg: "", notes: "" },
  rolling: { durationMinutes: "", machineCode: "", rpm: "", outputKg: "", notes: "" },
  predrying: { temperature: "", durationMinutes: "", moisturePercent: "", notes: "" },
  drying: { dryerMachine: "", temperature: "", durationMinutes: "", finalMoisturePercent: "", notes: "" },
  postdrying: { sortingGrade: "", qcStatus: "", aromaNote: "", notes: "" },
  packing: { packageType: "", totalPackage: "", netWeightKg: "", warehouseLocation: "", notes: "" },
};

export default function StageFormPage() {
  const { id, stageName } = useParams();
  const { openSidebar } = useOutletContext();
  const navigate = useNavigate();
  const [form, setForm] = useState(stageTemplates[stageName] || { notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fields = useMemo(() => Object.keys(form), [form]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post(`/batches/${id}/stages/${stageName}`, form);
      navigate(`/batches/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menyimpan tahapan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Topbar
        title={`Input Tahap ${humanStage(stageName)}`}
        subtitle="Data tahap akan disimpan ke Supabase dan Pinata dulu. CID baru dicatat ke blockchain setelah semua tahap final."
        onOpenMenu={openSidebar}
        showCreate={false}
      />
      <div className="p-4 lg:p-8">
        <form className="card-paper mx-auto max-w-4xl p-6 lg:p-8" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field} className={field === "notes" ? "md:col-span-2" : ""}>
                <label className="label">{field}</label>
                {field === "notes" ? (
                  <textarea
                    className="input min-h-32"
                    value={form[field]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                  />
                ) : (
                  <input
                    className="input"
                    value={form[field]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    placeholder={`Masukkan ${field}`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="surface-muted mt-5 rounded-[26px] p-4 text-sm text-slate-600">
            Setelah disimpan, backend membentuk payload JSON tahap ini, menyimpannya ke Supabase, lalu mengirimkannya ke Pinata. Blockchain diproses otomatis saat seluruh tahap selesai atau di-skip.
          </div>

          {error && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Menyimpan ke IPFS..." : "Simpan Tahap"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
