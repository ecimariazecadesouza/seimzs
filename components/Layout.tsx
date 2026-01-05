
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSchool, formatImageUrl } from '../context/SchoolContext';
import { hasPermission } from '../lib/permissions';

const SidebarItem: React.FC<{ to: string, icon: string, label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const { currentUser } = useSchool();
  const isActive = location.pathname === to;
  
  // Se não tiver permissão, nem renderiza o item no menu
  if (currentUser && !hasPermission(currentUser.role, to)) {
    return null;
  }

  return (
    <Link 
      to={to} 
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-bold text-sm">{label}</span>
    </Link>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, currentUser, logout } = useSchool();
  const systemLogoUrl = formatImageUrl(data.settings.systemLogo);
  const role = currentUser?.role || 'prof';

  const roleLabels: Record<string, string> = {
    admin_ti: 'Admin TI',
    admin_dir: 'Direção',
    coord: 'Coordenação',
    sec: 'Secretaria',
    prof: 'Professor'
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center space-x-4">
            {systemLogoUrl ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-white shrink-0">
                <img src={systemLogoUrl} alt="Logo Sistema" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0">SEI</div>
            )}
            <div className="overflow-hidden">
              <h1 className="text-[11px] font-black tracking-tight text-[#0A1128] leading-tight uppercase">SEI - Sistema Escolar Integrado</h1>
              <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-widest font-bold leading-tight">Tecnologia a favor da educação</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-1 overflow-y-auto custom-scrollbar">
          <SidebarItem to="/" icon="📊" label="Dashboard" />
          <SidebarItem to="/curriculum" icon="🧬" label="Grade Curricular" />
          <SidebarItem to="/subjects" icon="📚" label="Disciplinas" />
          <SidebarItem to="/classes" icon="🏫" label="Turmas" />
          <SidebarItem to="/teachers" icon="👨‍🏫" label="Professores" />
          <SidebarItem to="/students" icon="🎓" label="Protagonistas" />
          <SidebarItem to="/grades" icon="📝" label="Lançar Notas" />
          <SidebarItem to="/council" icon="📋" label="Conselho" />
          <SidebarItem to="/analytics" icon="📈" label="Análise" />
          <SidebarItem to="/reports" icon="📄" label="Boletins" />
          <div className="h-px bg-slate-100 my-4" />
          <SidebarItem to="/users" icon="👥" label="Usuários" />
          <SidebarItem to="/settings" icon="⚙️" label="Configurações" />
        </nav>

        <div className="p-6 border-t border-slate-50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400 text-xs font-black shrink-0">
                {currentUser?.name.substring(0, 1).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-slate-800 uppercase truncate" title={currentUser?.name}>
                  {currentUser?.name}
                </p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                  {roleLabels[role]}
                </p>
              </div>
            </div>
            <button onClick={logout} className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0" title="Sair">
              🚪
            </button>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Versão 3.6.0</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <h2 className="text-lg font-black text-[#0A1128] tracking-tight uppercase">Painel de {roleLabels[role]}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">🔔</button>
            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden">
               <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-400 uppercase">
                 {role.substring(0, 3)}
               </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-10 bg-[#fbfcfd]">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Layout;
