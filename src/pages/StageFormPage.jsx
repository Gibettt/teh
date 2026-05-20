import { useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import api from "../services/api";
import { humanStage } from "../utils/formatters";
import { useLanguage } from "../contexts/LanguageContext";

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
  const { t } = useLanguage();
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
      setError(err.response?.data?.message || t("stageForm.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Topbar
        title={t("stageForm.title", { stage: humanStage(stageName) })}
        onOpenMenu={openSidebar}
        showCreate={false}
      />
      <div className="p-3 sm:p-4 lg:p-8">
        <form className="card-paper mx-auto max-w-4xl p-4 sm:p-6 lg:p-8" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2 lg:gap-5">
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
                    placeholder={t("stageForm.placeholder", { field })}
                  />
                )}
              </div>
            ))}
          </div>

          {error && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => navigate(-1)}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
              {loading ? t("stageForm.saving") : t("stageForm.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
