export type Status = "online" | "offline" | "unknown";

export default function StatusDot({ status, size = "md" }: { status: Status; size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-2.5 w-2.5" : size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  if (status === "online") {
    return (
      <span className="relative inline-flex" aria-label="Online">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wa opacity-60" />
        <span className={`relative inline-flex ${dims} rounded-full bg-wa ring-2 ring-wa/30`} />
      </span>
    );
  }
  if (status === "offline") {
    return (
      <span
        className={`inline-flex ${dims} rounded-full bg-zinc-500 ring-2 ring-zinc-500/30`}
        aria-label="Offline"
      />
    );
  }
  return (
    <span
      className={`inline-flex ${dims} rounded-full bg-amber-400 ring-2 ring-amber-400/30`}
      aria-label="Unknown"
    />
  );
}
