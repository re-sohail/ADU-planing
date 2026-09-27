import clsx from "clsx";

const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-hover disabled:bg-slate-300",
  secondary: "border border-line bg-white text-ink hover:bg-surface disabled:text-slate-400",
  ghost: "text-ink hover:bg-surface disabled:text-slate-400",
};

const SIZES = {
  sm: "h-9 gap-1.5 px-3 text-sm",
  md: "h-11 gap-2 px-5 text-sm",
  icon: "size-10",
};

export function buttonStyles({ variant = "primary", size = "md", className } = {}) {
  return clsx(
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed",
    VARIANTS[variant],
    SIZES[size],
    className
  );
}

export function Button({ variant, size, className, type = "button", ...props }) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
