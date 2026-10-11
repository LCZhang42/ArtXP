const COLOR_MAP = {
  violet:  'bg-violet-500',
  pink:    'bg-pink-500',
  blue:    'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  orange:  'bg-orange-500',
};

export default function XPBar({ current, max, level, showLabel = true, color = 'violet', size = 'md' }) {
  const percent = Math.min((current / max) * 100, 100);
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-medium">Lv. {level}</span>
          <span>{current}<span className="text-slate-600">/{max} XP</span></span>
        </div>
      )}
      <div className={`${barHeight} bg-slate-700/60 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${COLOR_MAP[color] || COLOR_MAP.violet} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
