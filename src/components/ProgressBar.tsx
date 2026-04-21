interface Props {
  current: number;
  total: number;
  correct?: number;
}

export default function ProgressBar({ current, total, correct }: Props) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-sm text-slate-600 mb-1.5">
        <span>
          {current} / {total} 문항
        </span>
        {typeof correct === "number" && (
          <span className="text-emerald-600 font-medium">정답 {correct}개</span>
        )}
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
