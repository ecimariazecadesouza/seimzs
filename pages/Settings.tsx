
import React, { useState, useEffect } from 'react';
import { useSchool, formatImageUrl } from '../context/SchoolContext';

const Settings: React.FC = () => {
  const { data, updateSettings, currentUser, updateProfile } = useSchool();
  const { schoolLogo, systemLogo } = data.settings;
  const [showUrlInput, setShowUrlInput] = useState<{school: boolean, system: boolean}>({ school: false, system: false });
  const [tempUrl, setTempUrl] = useState('');
  
  // Perfil State
  const [profileName, setProfileName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (currentUser) setProfileName(currentUser.name);
  }, [currentUser]);

  const handleFileUpload = (type: 'schoolLogo' | 'systemLogo') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ [type]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = (type: 'schoolLogo' | 'systemLogo') => {
    if (tempUrl.trim()) {
      updateSettings({ [type]: tempUrl.trim() });
      setTempUrl('');
      setShowUrlInput({ school: false, system: false });
    }
  };

  const openUrlInput = (type: 'school' | 'system') => {
    setTempUrl('');
    setShowUrlInput({ school: type === 'school', system: type === 'system' });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    setIsUpdatingProfile(true);
    try {
      await updateProfile(profileName);
      alert("Seu perfil foi atualizado com sucesso!");
    } catch (e) {
      alert("Erro ao atualizar perfil.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-[#0A1128] tracking-tight">Configurações</h1>
        <p className="text-slate-500 font-medium mt-1">Gerencie suas informações pessoais e a identidade do sistema.</p>
      </div>

      {/* SEÇÃO: MEU PERFIL */}
      <div className="bg-white p-10 rounded-[40px] border border-indigo-50 shadow-sm space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <div className="relative z-10 flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white text-3xl shadow-xl shadow-indigo-100 font-black">
                {currentUser?.name.substring(0, 1)}
            </div>
            <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Informações Pessoais</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Como você aparece no sistema</p>
            </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Nome de Exibição</label>
                <input 
                    required
                    value={profileName} 
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-200 font-bold text-slate-700 transition-all uppercase"
                />
                <p className="text-[9px] text-slate-400 font-medium italic ml-1">Ajuste seu nome para evitar que o sobrenome seja cortado no menu.</p>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail (Somente Leitura)</label>
                <input 
                    disabled
                    value={currentUser?.email} 
                    className="w-full p-4 bg-slate-100 border border-slate-50 rounded-2xl text-slate-400 font-bold outline-none cursor-not-allowed"
                />
            </div>
            <div className="md:col-span-2 flex justify-end">
                <button 
                    type="submit" 
                    disabled={isUpdatingProfile || profileName.toUpperCase() === currentUser?.name}
                    className="px-12 py-4 bg-[#0A1128] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-30"
                >
                    {isUpdatingProfile ? 'Salvando...' : 'Salvar Perfil'}
                </button>
            </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LOGO DA ESCOLA */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl shadow-inner">🏫</div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Logo Institucional</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exibido em Diários e Boletins</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-200 rounded-[32px] overflow-hidden group relative bg-slate-50/50 transition-all hover:border-indigo-300">
            {schoolLogo ? (
              <div className="w-full h-full p-10 flex items-center justify-center bg-white">
                <img src={formatImageUrl(schoolLogo)} alt="Escola" className="max-w-full max-h-full object-contain drop-shadow-sm" />
              </div>
            ) : (
              <div className="text-center">
                <div className="text-5xl mb-3 opacity-20">🏛️</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sem logo cadastrado</p>
              </div>
            )}
            <div className="absolute inset-0 cursor-pointer flex flex-col gap-3 items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-[#0A1128]/70 backdrop-blur-md p-6">
              <label className="w-full">
                <span className="block text-center bg-white px-6 py-3 rounded-2xl text-[10px] font-black text-[#0A1128] uppercase shadow-2xl tracking-widest cursor-pointer hover:bg-indigo-50 transition-colors">Fazer Upload</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload('schoolLogo')} />
              </label>
              <button 
                onClick={() => openUrlInput('school')}
                className="w-full bg-indigo-600 px-6 py-3 rounded-2xl text-[10px] font-black text-white uppercase shadow-2xl tracking-widest hover:bg-indigo-700 transition-colors"
              >
                Colar Link Direto
              </button>
            </div>
          </div>

          {showUrlInput.school && (
            <div className="p-5 bg-indigo-50 rounded-[28px] border border-indigo-100 animate-in slide-in-from-top-4 duration-300">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 block ml-1">URL da Imagem</label>
                <div className="flex gap-2">
                    <input 
                      autoFocus
                      value={tempUrl} 
                      onChange={e => setTempUrl(e.target.value)} 
                      placeholder="https://i.postimg.cc/..."
                      className="flex-1 p-4 text-xs font-bold border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                    <button onClick={() => handleUrlSubmit('schoolLogo')} className="bg-[#0A1128] text-white px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">OK</button>
                </div>
            </div>
          )}
        </div>

        {/* LOGO DO SISTEMA */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 text-2xl shadow-inner">💻</div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Logo do Sistema</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identidade Visual da Plataforma</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-200 rounded-[32px] overflow-hidden group relative bg-slate-50/50 transition-all hover:border-purple-300">
            {systemLogo ? (
              <div className="w-full h-full p-10 flex items-center justify-center bg-white">
                <img src={formatImageUrl(systemLogo)} alt="Sistema" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="text-center">
                <div className="text-5xl mb-3 opacity-20">🤖</div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Usando ícone padrão</p>
              </div>
            )}
            <div className="absolute inset-0 cursor-pointer flex flex-col gap-3 items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-[#0A1128]/70 backdrop-blur-md p-6">
              <label className="w-full">
                <span className="block text-center bg-white px-6 py-3 rounded-2xl text-[10px] font-black text-[#0A1128] uppercase shadow-2xl tracking-widest cursor-pointer hover:bg-purple-50 transition-colors">Fazer Upload</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload('systemLogo')} />
              </label>
              <button 
                onClick={() => openUrlInput('system')}
                className="w-full bg-purple-600 px-6 py-3 rounded-2xl text-[10px] font-black text-white uppercase shadow-2xl tracking-widest hover:bg-purple-700 transition-colors"
              >
                Colar Link Direto
              </button>
            </div>
          </div>

          {showUrlInput.system && (
            <div className="p-5 bg-purple-50 rounded-[28px] border border-purple-100 animate-in slide-in-from-top-4 duration-300">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 block ml-1">URL da Imagem</label>
                <div className="flex gap-2">
                    <input 
                      autoFocus
                      value={tempUrl} 
                      onChange={e => setTempUrl(e.target.value)} 
                      placeholder="https://i.postimg.cc/..."
                      className="flex-1 p-4 text-xs font-bold border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all shadow-inner"
                    />
                    <button onClick={() => handleUrlSubmit('systemLogo')} className="bg-[#0A1128] text-white px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">OK</button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
