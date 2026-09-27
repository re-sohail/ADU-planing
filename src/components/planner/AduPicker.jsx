import { Skeleton } from "@/components/ui/Skeleton";
import { AduCard } from "./AduCard";

export function AduPicker({ adus, error, selectedId, onSelect }) {
  return (
    <section aria-labelledby="adu-picker-title" className="flex flex-col gap-4">
      <div>
        <h2 id="adu-picker-title" className="text-xl font-semibold text-ink">
          Choose an ADU model
        </h2>
        <p className="text-sm text-muted">Every model is drawn to scale on your lot.</p>
      </div>

      {error ? (
        <p className="rounded-xl border border-line bg-white p-4 text-sm text-danger">{error}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adus
            ? adus.map((adu) => (
                <AduCard key={adu.id} adu={adu} selected={adu.id === selectedId} onSelect={onSelect} />
              ))
            : Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-72 rounded-2xl" />)}
        </div>
      )}
    </section>
  );
}
