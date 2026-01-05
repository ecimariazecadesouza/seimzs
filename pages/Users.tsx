
import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { UserRole } from '../types';

const Users: React.FC = () => {
  const { data, addUser, deleteItem, currentUser } = useSchool();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('prof');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addUser({ email: email.toLowerCase().trim(), name: name.toUpperCase().trim(), role });
      setEmail(''); setName(''); setRole('prof');
    } catch (e) {
      alert("Erro ao adicionar usuário.");
    } finally {
      setLoading(false);
    }
  };

  const roleLabels: Record<UserRole, string> = {
    admin_ti: 'Admin TI',
    admin_dir: 'Admin Direção',
    coord: 'Coordenação',
    prof: 'Professor',
    sec: 'Secretaria'
  };

  return (
    <div className="space-y-10 pb-20 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-[#0A1128] tracking-tight">Gestão de Usuários</h1>
        <p className="text-slate-500 font-medium mt-1">Gerencie quem pode acessar o sistema e quais são seus níveis de permissão.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Novo Acesso</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Pessoal</label>
              <input required value={email} onChange={e => setEmail(e.target.value)} placeholder="ex: jose@gmail.com" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white font-bold text-slate-700" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Colaborador</label>
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="NOME COMPLETO" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white font-bold text-slate-700 uppercase" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
              <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white font-bold text-slate-700">
                <option value="prof">Professor</option>
                <option value="sec">Secretaria</option>
                <option value="coord">Coordenação</option>
                <option value="admin_dir">Admin Direção</option>
                <option value="admin_ti">Admin TI</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-[#0A1128] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50">
              Autorizar Acesso
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Colaborador</th>
                <th className="px-8 py-5">Perfil</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-black text-slate-800 text-xs uppercase">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold lowercase">{user.email}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {user.email !== currentUser?.email && (
                       <button onClick={() => deleteItem('users', user.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors">🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
              {data.users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm italic">Nenhum usuário cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
