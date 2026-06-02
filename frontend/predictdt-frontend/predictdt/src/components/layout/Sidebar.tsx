import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, Gauge, Radio, Activity,
  ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/equipamentos', icon: Cpu, label: 'Equipamentos' },
  { to: '/sensores', icon: Gauge, label: 'Sensores' },
  { to: '/topicos', icon: Radio, label: 'Tópicos MQTT' },
  { to: '/monitoramento', icon: Activity, label: 'Monitoramento' },
  { to: '/alertas', icon: AlertTriangle, label: 'Alertas' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300 border-r"
      style={{
        width: collapsed ? 64 : 220,
        background: 'rgba(13,17,23,0.95)',
        borderColor: '#30363D',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-5 border-b"
        style={{ borderColor: '#30363D', justifyContent: collapsed ? 'center' : 'flex-start' }}
      >
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-white p-1.5"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 18px rgba(0,0,0,0.22)' }}
        >
          <img
            src="/logo_PredictDT.png"
            alt="PredictDT"
            className="w-full h-full object-contain object-center"
          />
        </div>
        
        {!collapsed && (
          <span
            className="font-display font-bold text-white text-lg leading-none"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Predict<span className='text-[#00A89C]'>DT</span>
          </span>
        )}
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active =
            to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`sidebar-item ${active ? 'active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: '#30363D' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-item w-full justify-center"
          style={{ background: 'transparent', border: 'none' }}
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
