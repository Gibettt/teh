export function formatDate(dateString) {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

export function shortHash(value = "", start = 6, end = 4) {
  if (!value || value.length <= start + end) return value || "-";
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function statusClasses(status) {
  switch (status) {
    case "completed":
      return "badge bg-emerald-100 text-emerald-700";
    case "in_progress":
      return "badge bg-amber-100 text-amber-800";
    default:
      return "badge bg-slate-100 text-slate-700";
  }
}

export function stageStatusClasses(status) {
  switch (status) {
    case "completed":
      return "badge bg-emerald-100 text-emerald-700";
    case "available":
      return "badge bg-amber-100 text-amber-800";
    case "skipped":
      return "badge bg-rose-100 text-rose-700";
    default:
      return "badge bg-slate-100 text-slate-600";
  }
}

export function stageStatusText(status) {
  switch (status) {
    case "completed":
      return "Tersimpan";
    case "available":
      return "Siap diproses";
    case "skipped":
      return "Di-skip";
    default:
      return "Menunggu";
  }
}

export function humanStage(stage) {
  return {
    plucking: "Plucking",
    withering: "Withering",
    rolling: "Rolling",
    predrying: "Pre-Drying",
    drying: "Drying",
    postdrying: "Post-Drying",
    packing: "Packing",
  }[stage] || stage;
}

export function humanWorkflowMode() {
  return "Dynamic Multi-Path";
}

export function getActiveStages(batch) {
  return (batch?.stages || []).filter((stage) => stage.status === "available");
}

export function getSkippableStages(batch) {
  return (batch?.stages || []).filter(
    (stage) => stage.skippable && stage.status !== "completed" && stage.status !== "skipped"
  );
}
