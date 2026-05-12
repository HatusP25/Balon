interface Props {
  label: string;
  value: string | number;
  emphasis?: boolean;
}

export function StatTile({ label, value, emphasis = false }: Props) {
  return (
    <div className="rounded-xl border border-pitch-100 bg-white p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-pitch-700">{label}</p>
      <p
        className={`mt-1 text-3xl font-bold ${
          emphasis ? "text-pitch-600" : "text-pitch-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
