import { useState } from "react";
import { BookOpen, KeyRound, LockKeyhole, Server } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import Topbar from "../components/Topbar";
import api from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";

const methodClasses = {
  GET: "bg-sky-100 text-sky-800",
  POST: "bg-emerald-100 text-emerald-800",
  PATCH: "bg-amber-100 text-amber-800",
  PUT: "bg-violet-100 text-violet-800",
  DELETE: "bg-rose-100 text-rose-800",
};

function JsonBlock({ value }) {
  if (!value) {
    return null;
  }

  return (
    <pre className="mt-2 max-h-72 overflow-auto rounded-2xl border border-[#eadfce] bg-white/85 p-3 text-xs leading-5 text-slate-700">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function ApiDocsPage() {
  const { openSidebar } = useOutletContext();
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/system/api-docs", {
        headers: {
          "X-API-Docs-Password": password,
        },
      });
      setDocs(response.data);
      setPassword("");
    } catch (err) {
      setDocs(null);
      setError(err.response?.data?.message || t("apiDocs.unlockFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Topbar title={t("apiDocs.title")} onOpenMenu={openSidebar} />

      <div className="space-y-5 p-3 sm:p-4 lg:space-y-6 lg:p-8">
        {!docs ? (
          <form className="card-paper mx-auto max-w-xl p-4 sm:p-6 lg:p-8" onSubmit={handleSubmit}>
            <div className="flex items-start gap-3">
              <div className="inline-flex rounded-2xl bg-emerald-50 p-2 text-emerald-700">
                <LockKeyhole size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t("apiDocs.lockedTitle")}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{t("apiDocs.lockedDescription")}</p>
              </div>
            </div>

            <div className="mt-6">
              <label className="label">{t("apiDocs.password")}</label>
              <div className="relative">
                <KeyRound size={18} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  className="input pl-10"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <button className="btn-primary mt-6 w-full" type="submit" disabled={loading}>
              {loading ? t("common.loading") : t("apiDocs.unlock")}
            </button>
          </form>
        ) : (
          <>
            <div className="card-paper p-4 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                    <BookOpen size={14} />
                    {t("apiDocs.badge")}
                  </div>
                  <h2 className="mt-4 break-words text-2xl font-bold text-slate-900">{docs.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{docs.mobileAccess}</p>
                </div>
                <button className="btn-secondary w-full sm:w-auto" type="button" onClick={() => setDocs(null)}>
                  {t("apiDocs.lockAgain")}
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="surface-muted rounded-[20px] p-4 sm:rounded-[24px]">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Server size={16} />
                    {t("apiDocs.basePath")}
                  </div>
                  <div className="mt-2 break-all text-sm text-slate-600">{docs.basePath}</div>
                </div>
                <div className="surface-muted rounded-[20px] p-4 sm:rounded-[24px]">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <KeyRound size={16} />
                    {t("apiDocs.auth")}
                  </div>
                  <div className="mt-2 break-all text-sm text-slate-600">{docs.auth?.header}</div>
                  <div className="mt-1 text-xs text-slate-500">{docs.auth?.note}</div>
                </div>
              </div>
            </div>

            <section className="card p-4 sm:p-6">
              <h3 className="text-lg font-bold text-slate-900">{t("apiDocs.mobileFlow")}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {docs.mobileFlow?.map((step) => (
                  <div key={step.order} className="rounded-[22px] border border-[#e7ddcf] bg-[rgba(249,246,240,0.92)] p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
                        {step.order}
                      </span>
                      <div className="text-sm font-bold text-slate-900">{step.title}</div>
                    </div>
                    <code className="mt-3 block break-all rounded-xl bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 ring-1 ring-[#eadfce]">
                      {step.endpoint}
                    </code>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{step.result}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-2">
              <section className="card p-4 sm:p-6">
                <h3 className="text-lg font-bold text-slate-900">{t("apiDocs.enums")}</h3>
                <JsonBlock value={docs.enums} />
              </section>

              <section className="card p-4 sm:p-6">
                <h3 className="text-lg font-bold text-slate-900">{t("apiDocs.commonErrors")}</h3>
                <JsonBlock value={docs.commonErrors} />
              </section>

              <section className="card p-4 sm:p-6">
                <h3 className="text-lg font-bold text-slate-900">{t("apiDocs.productionFlows")}</h3>
                <JsonBlock value={docs.productionFlows} />
              </section>

              <section className="card p-4 sm:p-6">
                <h3 className="text-lg font-bold text-slate-900">{t("apiDocs.stageFields")}</h3>
                <JsonBlock value={docs.stageFieldTemplates} />
              </section>
            </div>

            <section className="card p-4 sm:p-6">
              <h3 className="text-lg font-bold text-slate-900">{t("apiDocs.responseModels")}</h3>
              <JsonBlock value={docs.responseModels} />
            </section>

            <div className="space-y-5">
              {docs.groups?.map((group) => (
                <section key={group.title} className="card p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-slate-900">{group.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{group.description}</p>

                  <div className="mt-5 space-y-4">
                    {group.endpoints.map((endpoint) => (
                      <div key={`${endpoint.method}-${endpoint.path}`} className="rounded-[22px] border border-[#e7ddcf] bg-[rgba(249,246,240,0.92)] p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${methodClasses[endpoint.method] || "bg-slate-100 text-slate-700"}`}>
                                {endpoint.method}
                              </span>
                              <code className="break-all rounded-xl bg-white px-2.5 py-1 text-sm font-semibold text-slate-800 ring-1 ring-[#eadfce]">
                                {endpoint.path}
                              </code>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-600">{endpoint.description}</p>
                          </div>
                          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-[#eadfce]">
                            {endpoint.access}
                          </span>
                          {endpoint.mobileUse && (
                            <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                              {t("apiDocs.mobileUse")}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                          {endpoint.headers && (
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("apiDocs.headers")}</div>
                              <JsonBlock value={endpoint.headers} />
                            </div>
                          )}
                          {endpoint.params && (
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("apiDocs.params")}</div>
                              <JsonBlock value={endpoint.params} />
                            </div>
                          )}
                          {endpoint.body && (
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("apiDocs.body")}</div>
                              <JsonBlock value={endpoint.body} />
                            </div>
                          )}
                          {endpoint.examples && (
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("apiDocs.examples")}</div>
                              <JsonBlock value={endpoint.examples} />
                            </div>
                          )}
                          {endpoint.success && (
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("apiDocs.success")}</div>
                              <JsonBlock value={endpoint.success} />
                            </div>
                          )}
                          {endpoint.errors && (
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("apiDocs.errors")}</div>
                              <JsonBlock value={endpoint.errors} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
