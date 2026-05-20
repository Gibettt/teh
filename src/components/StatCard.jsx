export default function StatCard({ title, value, tone = "default" }) {
  const toneClass = {
    default: "from-white to-[#fbf7ef]",
    green: "from-emerald-50 to-white",
    amber: "from-amber-50 to-white",
    sky: "from-sky-50 to-white",
  }[tone] || "from-white to-[#fbf7ef]";

  return (
    <div className={`card bg-gradient-to-b ${toneClass} p-4 sm:p-5`}>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900 sm:mt-3 sm:text-3xl">{value}</p>
    </div>
  );
}
