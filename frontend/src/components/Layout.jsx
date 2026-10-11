import { NavLink } from 'react-router-dom';
import { Home, Calendar, Image, BookOpen, Settings, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { path: '/',           icon: Home,      label: 'Dashboard'  },
  { path: '/planner',    icon: Calendar,  label: 'Planner'    },
  { path: '/references', icon: Image,     label: 'References' },
  { path: '/log',        icon: BookOpen,  label: 'Log'        },
  { path: '/settings',   icon: Settings,  label: 'Settings'   },
];

export default function Layout({ children }) {
  const { streak, totalXP } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="w-16 md:w-56 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-10">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-white" />
            </div>
            <div className="hidden md:block">
              <div className="font-bold text-white text-sm leading-none">ArtXP</div>
              <div className="text-slate-500 text-xs leading-none mt-0.5">Level Up Your Art</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <Icon size={17} className="flex-shrink-0" />
              <span className="hidden md:block">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 hidden md:block">
          <div className="bg-slate-800/60 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total XP</span>
              <span className="text-amber-400 font-bold text-sm">{totalXP.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Streak</span>
              <span className="text-orange-400 font-bold text-sm">🔥 {streak.count}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-16 md:ml-56 min-h-screen">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
