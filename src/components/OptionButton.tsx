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
    "w-full text-left rounded-xl border-2 px-4 py-3 flex items-start gap-3 transition text-sm sm:text-base";
  const styles =
    state === "correct"
      ? "border-emerald-500 bg-emerald-50"
      : state === "wrong"
        ? "border-rose-500 bg-rose-50"
        : state === "reveal"
          ? "border-emerald-400 bg-emerald-50"
          : selected
            ? "border-brand-500 bg-brand-50"
            : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/50";

  const badgeStyles =
    state === "correct" || state === "reveal"
      ? "bg-emerald-500 text-white"
      : state === "wrong"
        ? "bg-rose-500 text-white"
        : selected
          ? "bg-brand-600 text-white"
          : "bg-slate-100 text-slate-700";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${
        disabled ? "cursor-default" : "cursor-pointer"
      }`}
    >
      <span
        className={`flex-shrink-0 w-7 h-7 rounded-full font-bold text-sm flex items-center justify-center ${badgeStyles}`}
      >
        {label}
      </span>
      <span className="flex-1 text-slate-800 leading-relaxed">{text}</span>
    </button>
  );
}
