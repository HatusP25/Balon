"use client";

interface Props {
  our: number;
  their: number;
  onChange: (us: number, them: number) => void;
}

export function ScoreSection({ our, their, onChange }: Props) {
  return (
    <section className="rounded-xl border border-pitch-100 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-pitch-700">
        1 · Final score
      </h3>
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center">
          <p className="text-xs uppercase tracking-wide text-pitch-700">Us</p>
          <input
            type="number"
            min={0}
            max={99}
            name="ourScore"
            value={our}
            onChange={(e) => onChange(Number(e.target.value), their)}
            className="mt-1 h-16 w-20 rounded-lg border-2 border-pitch-100 text-center text-4xl font-bold text-pitch-900 focus:border-pitch-600 focus:outline-none"
          />
        </div>
        <p className="text-2xl font-bold text-pitch-700">–</p>
        <div className="flex flex-col items-center">
          <p className="text-xs uppercase tracking-wide text-pitch-700">Them</p>
          <input
            type="number"
            min={0}
            max={99}
            name="theirScore"
            value={their}
            onChange={(e) => onChange(our, Number(e.target.value))}
            className="mt-1 h-16 w-20 rounded-lg border-2 border-pitch-100 text-center text-4xl font-bold text-pitch-900 focus:border-pitch-600 focus:outline-none"
          />
        </div>
      </div>
    </section>
  );
}
