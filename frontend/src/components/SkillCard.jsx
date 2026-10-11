import XPBar from './XPBar';
import { useApp } from '../context/AppContext';

const SKILL_META = {
  gesture:     { color: 'violet',  icon: '✦', accent: 'text-violet-400'  },
  anatomy:     { color: 'pink',    icon: '◆', accent: 'text-pink-400'    },
  perspective: { color: 'blue',    icon: '◈', accent: 'text-blue-400'    },
  composition: { color: 'emerald', icon: '▣', accent: 'text-emerald-400' },
  lighting:    { color: 'amber',   icon: '☀', accent: 'text-amber-400'   },
  linework:    { color: 'orange',  icon: '✏', accent: 'text-orange-400'  },
};

export default function SkillCard({ skillKey }) {
  const { skills, XP_PER_LEVEL } = useApp();
  const skill = skills[skillKey];
  if (!skill) return null;

  const meta = SKILL_META[skillKey] || SKILL_META.gesture;
  const maxXP = XP_PER_LEVEL * skill.level;

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-base ${meta.accent}`}>{meta.icon}</span>
          <span className="font-medium text-slate-200 text-sm">{skill.name}</span>
        </div>
        <div className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 ${meta.accent}`}>
          Lv.{skill.level}
        </div>
      </div>
      <XPBar current={skill.xp} max={maxXP} level={skill.level} color={meta.color} size="sm" showLabel={false} />
      <div className="flex justify-between text-xs text-slate-600 mt-1">
        <span>{skill.xp} xp</span>
        <span>{maxXP - skill.xp} to next</span>
      </div>
    </div>
  );
}
