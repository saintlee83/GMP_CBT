"use client";

interface Props {
  label: string;
  text: string;
  selected: boolean;
  disabled: boolean;
  state: "idle" | "correct" | "wrong" | "reveal";
  onClick: () => void;
}

export default function OptionButton({
  label,
  text,
  selected,
  disabled,
  state,
  onClick,
}: Props) {
  const base =
    "group w-full text-left rounded-xl border-2 px-4 py-3.5 flex items-start gap-3 transition text-sm sm:text-[0.95rem]";
  const styles =
    state === "correct"
      ? "border-emerald-500 bg-emerald-50 shadow-sm"
      : state === "wrong"
        ? "border-rose-500 bg-rose-50 shadow-sm"
        : state === "reveal"
          ? "border-emerald-400 bg-emerald-50"
          : selected
            ? "border-brand-500 bg-brand-50 shadow-sm"
            : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/60 active:scale-[0.99]";

  const badgeStyles =
    state === "correct" || state === "reveal"
      ? "bg-emerald-500 text-white ring-2 ring-emerald-200"
      : state === "wrong"
        ? "bg-rose-500 text-white ring-2 ring-rose-200"
        : selected
          ? "bg-brand-600 text-white ring-2 ring-brand-200"
          : "bg-slate-100 text-slate-700 group-hover:bg-brand-100 group-hover:text-brand-700";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`${base} ${styles} ${
        disabled ? "cursor-default" : "cursor-pointer"
      }`}
    >
      <span
        className={`flex-shrink-0 w-8 h-8 rounded-full font-bold text-base flex items-center justify-center transition ${badgeStyles}`}
      >
        {label}
      </span>
      <span className="flex-1 text-slate-800 leading-relaxed pt-0.5 break-keep whitespace-pre-wrap">
        {text}
      </span>
    </button>
  );
}
