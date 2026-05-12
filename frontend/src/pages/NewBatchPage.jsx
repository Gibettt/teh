import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../components/Topbar";
import api from "../services/api";

export default function NewBatchPage() {
  const { openSidebar } = useOutletContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    batchCode: "",
    teaType: "Black Tea",
    gardenBlock: "",
    harvestDate: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/batches", form);
      navigate(`/batches/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal membuat batch baru");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Topbar
        title="Buat Batch Baru"
        subtitle="Batch langsung memakai alur dinamis multi-path, dan tahap opsional bisa diputuskan skip sejak awal tanpa memilih workflow manual."
        onOpenMenu={openSidebar}
        showCreate={false}
      />
      <div className="p-4 lg:p-8">
        <form className="card-paper mx-auto max-w-4xl p-6 lg:p-8" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="label">Kode Batch</label>
              <input className="input" name="batchCode" value={form.batchCode} onChange={handleChange} placeholder="TEA-2026-0001" />
            </div>
            <div>
              <label className="label">Jenis Teh</label>
              <select className="input" name="teaType" value={form.teaType} onChange={handleChange}>
                <option>Black Tea</option>
                <option>Green Tea</option>
                <option>Oolong Tea</option>
                <option>White Tea</option>
              </select>
            </div>
            <div>
              <label className="label">Blok Kebun</label>
              <input className="input" name="gardenBlock" value={form.gardenBlock} onChange={handleChange} placeholder="Block A-07" />
            </div>
            <div>
              <label className="label">Tanggal Panen</label>
              <input className="input" type="datetime-local" name="harvestDate" value={form.harvestDate} onChange={handleChange} />
            </div>
          </div>

          <div className="surface-muted mt-6 rounded-[26px] p-4 text-sm text-slate-700">
            Setelah batch dibuat, operator bisa langsung memproses tahap aktif, menghubungkan wallet dari topbar, dan menandai tahap opsional sebagai skip sejak awal jika jalur produksi memang tidak dipakai.
          </div>

          <div className="mt-5">
            <label className="label">Catatan Awal</label>
            <textarea className="input min-h-36" name="notes" value={form.notes} onChange={handleChange} placeholder="Catatan kondisi kebun, cuaca, shift, operator, atau informasi batch awal lainnya." />
          </div>

          {error && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Kembali
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
