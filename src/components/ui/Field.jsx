import clsx from "clsx";

export function Field({ id, label, error, hint, className, ...inputProps }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={clsx(
          "h-11 rounded-lg border bg-white px-3.5 text-sm text-ink placeholder:text-slate-400",
          "focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none",
          error ? "border-danger" : "border-line"
        )}
        {...inputProps}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
