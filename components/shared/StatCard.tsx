export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-1"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface-2, transparent)" }}
    >
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-2xl font-semibold" style={{ color: "var(--color-primary)" }}>
        {value}
      </span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  );
}
