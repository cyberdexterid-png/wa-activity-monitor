interface Bar {
  label: string;
  date: string;
  sessions: number;
}

/** Simple CSS bar chart — sessions per day. */
export default function BarChart({ data }: { data: Bar[] }) {
  const max = Math.max(1, ...data.map((d) => d.sessions));
  return (
    <div
      role="img"
      aria-label={`Sessions per day chart: ${data
        .map((d) => `${d.label} ${d.sessions}`)
        .join(", ")}`}
      className="flex h-40 items-end gap-2 sm:gap-3"
    >
      {data.map((d) => (
        <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">
            {d.sessions}
          </span>
          <div
            className="w-full rounded-t-lg bg-wa/80 transition-all hover:bg-wa"
            style={{ height: `${Math.max(6, (d.sessions / max) * 100)}%` }}
            title={`${d.label}: ${d.sessions} session${d.sessions === 1 ? "" : "s"}`}
          />
          <span className="text-[11px] text-zinc-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
