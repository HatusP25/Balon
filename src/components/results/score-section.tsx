"use client";

interface Props {
  ourInitial: number;
  theirInitial: number;
  onChange: (us: number, them: number) => void;
}

export function ScoreSection({ ourInitial, theirInitial, onChange }: Props) {
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
            defaultValue={ourInitial}
            onChange={(e) => onChange(Number(e.target.value), theirInitial)}
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
            defaultValue={theirInitial}
            onChange={(e) => onChange(ourInitial, Number(e.target.value))}
            className="mt-1 h-16 w-20 rounded-lg border-2 border-pitch-100 text-center text-4xl font-bold text-pitch-900 focus:border-pitch-600 focus:outline-none"
          />
        </div>
      </div>
    </section>
  );
}
