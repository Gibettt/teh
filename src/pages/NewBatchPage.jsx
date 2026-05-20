import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Topbar from "../components/Topbar";
import api from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";

export default function NewBatchPage() {
  const { openSidebar } = useOutletContext();
  const { t } = useLanguage();
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
      setError(err.response?.data?.message || t("newBatch.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Topbar
        title={t("newBatch.title")}
        onOpenMenu={openSidebar}
        showCreate={false}
      />
      <div className="p-3 sm:p-4 lg:p-8">
        <form className="card-paper mx-auto max-w-4xl p-4 sm:p-6 lg:p-8" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2 lg:gap-5">
            <div>
              <label className="label">{t("newBatch.code")}</label>
              <input className="input" name="batchCode" value={form.batchCode} onChange={handleChange} placeholder="TEA-2026-0001" />
            </div>
            <div>
              <label className="label">{t("newBatch.type")}</label>
              <select className="input" name="teaType" value={form.teaType} onChange={handleChange}>
                <option>Black Tea</option>
                <option>Green Tea</option>
                <option>Oolong Tea</option>
                <option>White Tea</option>
              </select>
            </div>
            <div>
              <label className="label">{t("newBatch.gardenBlock")}</label>
              <input className="input" name="gardenBlock" value={form.gardenBlock} onChange={handleChange} placeholder="Block A-07" />
            </div>
            <div>
              <label className="label">{t("newBatch.harvestDate")}</label>
              <input className="input" type="datetime-local" name="harvestDate" value={form.harvestDate} onChange={handleChange} />
            </div>
          </div>

          <div className="mt-5">
            <label className="label">{t("newBatch.notes")}</label>
            <textarea className="input min-h-36" name="notes" value={form.notes} onChange={handleChange} placeholder={t("newBatch.notesPlaceholder")} />
          </div>

          {error && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => navigate(-1)}>
              {t("common.back")}
            </button>
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
              {loading ? t("newBatch.saving") : t("newBatch.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
