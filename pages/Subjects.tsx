
import React, { useState, useMemo, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Subject } from '../types';

const Subjects: React.FC = () => {
  const { data, addSubject, updateSubject, deleteItem } = useSchool();
  
  // UI States
  const [filterYear, setFilterYear] = useState('2026');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);

  // Form State
  const [year, setYear] = useState('2026');
  const [periodicity, setPeriodicity] = useState<'Anual' | 'Semestral'>('Anual');
  const [formationId, setFormationId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [subAreaId, setSubAreaId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#3b82f6');

  // Sincroniza o ano do formulário com o filtro atual ao abrir para novo cadastro
  useEffect(() => {
    if (isFormOpen && !editingId) {
      setYear(filterYear);
    }
  }, [isFormOpen, editingId, filterYear]);

  const filteredAreas = useMemo(() => {
    return data.knowledgeAreas.filter(a => a.formationTypeId === formationId);
  }, [formationId, data.knowledgeAreas]);

  const filteredSubAreas = useMemo(() => {
    return data.subAreas.filter(s => s.knowledgeAreaId === areaId);
  }, [areaId, data.subAreas]);

  // Ordenação: Filtrado por ano, Anuais primeiro (A-Z), depois Semestrais (A-Z)
  const displaySubjects = useMemo(() => {
    return data.subjects
      .filter(s => String(s.year) === filterYear)
      .sort((a, b) => {
        if (a.periodicity === b.periodicity) {
          return a.name.localeCompare(b.name);
        }
        return a.periodicity === 'Anual' ? -1 : 1;
      });
  }, [data.subjects, filterYear]);

  const resetForm = () => {
    setYear(filterYear);
    setPeriodicity('Anual');
    setFormationId('');
    setAreaId('');
    setSubAreaId('');
    setName('');
    setCode('');
    setColor('#3b82f6');
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleEdit = (sub: Subject) => {
    setEditingId(sub.id);
    setName(sub.name);
    setSubAreaId(sub.subAreaId);
    setPeriodicity(sub.periodicity);
    setYear(sub.year);
    setCode(sub.code || '');
    setColor(sub.color || '#3b82f6');

    const subArea = data.subAreas.find(s => s.id === sub.subAreaId);
    if (subArea) {
      setAreaId(subArea.knowledgeAreaId);
      const area = data.knowledgeAreas.find(a => a.id === subArea.knowledgeAreaId);
      if (area) setFormationId(area.formationTypeId);
    }

    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subAreaId) return;

    const payload = {
      name: name.trim().toUpperCase(),
      subAreaId,
      periodicity,
      year,
      code: code.trim().toUpperCase(),
      color
    };

    if (editingId) {
      updateSubject(editingId, payload);
    } else {
      addSubject(payload);
    }
    resetForm();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#0A1128] tracking-tight">Disciplinas</h1>
          <p className="text-slate-500 font-medium">Arquitetura curricular e componentes por ano letivo.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mr-4">Ano Letivo</span>
            <select 
              value={filterYear} 
              onChange={e => setFilterYear(e.target.value)} 
              className="bg-transparent outline-none text-slate-800 font-black text-sm cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
          {!isFormOpen && (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-[#0A1128] text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-slate-800 transition-all active:scale-95"
            >
              <span>+ Nova Disciplina</span>
            </button>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                {editingId ? 'Editar Componente' : 'Novo Componente Curricular'}
              </h3>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1">Defina a hierarquia e o ano letivo</p>
            </div>
            <button onClick={resetForm} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all shadow-sm">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ano Letivo *</label>
                <select 
                  required 
                  value={year} 
                  onChange={e => setYear(e.target.value)} 
                  className="w-full p-4 border border-slate-200 rounded-2xl outline-none bg-slate-50 focus:bg-white transition-all font-black text-slate-700 shadow-inner"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Periodicidade *</label>
                <select 
                  required 
                  value={periodicity} 
                  onChange={e => setPeriodicity(e.target.value as any)} 
                  className="w-full p-4 border border-slate-200 rounded-2xl outline-none bg-slate-50 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
                >
                  <option value="Anual">Anual</option>
                  <option value="Semestral">Semestral</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo de Formação *</label>
                <select 
                  required 
                  value={formationId} 
                  onChange={e => { setFormationId(e.target.value); setAreaId(''); setSubAreaId(''); }} 
                  className="w-full p-4 border border-slate-200 rounded-2xl outline-none bg-slate-50 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
                >
                  <option value="">Selecione...</option>
                  {data.formations.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Área de Conhecimento *</label>
                <select 
                  required 
                  disabled={!formationId} 
                  value={areaId} 
                  onChange={e => { setAreaId(e.target.value); setSubAreaId(''); }} 
                  className="w-full p-4 border border-slate-200 rounded-2xl outline-none bg-slate-50 focus:bg-white transition-all font-bold text-slate-700 shadow-inner disabled:opacity-50"
                >
                  <option value="">Selecione...</option>
                  {filteredAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Subárea *</label>
                <select 
                  required 
                  disabled={!areaId} 
                  value={subAreaId} 
                  onChange={e => setSubAreaId(e.target.value)} 
                  className="w-full p-4 border border-slate-200 rounded-2xl outline-none bg-slate-50 focus:bg-white transition-all font-bold text-slate-700 shadow-inner disabled:opacity-50"
                >
                  <option value="">Selecione...</option>
                  {filteredSubAreas.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome da Disciplina *</label>
                <input 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full p-4 border border-slate-200 rounded-2xl outline-none bg-slate-50 focus:bg-white transition-all font-bold text-slate-700 shadow-inner uppercase" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Código (Sigla)</label>
                <input 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                  placeholder="EX: MAT-26"
                  className="w-full p-4 border border-slate-200 rounded-2xl outline-none bg-slate-50 focus:bg-white transition-all font-mono text-xs shadow-inner uppercase" 
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-end gap-8 pt-4">
              <div className="flex-1 w-full">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cor de Identificação</label>
                <div className="flex items-center space-x-4">
                  <input 
                    type="color"
                    value={color} 
                    onChange={e => setColor(e.target.value)} 
                    className="w-16 h-14 p-1 rounded-2xl border border-slate-200 bg-white cursor-pointer shadow-sm" 
                  />
                  <input 
                    value={color} 
                    onChange={e => setColor(e.target.value)} 
                    className="flex-1 p-4 border border-slate-200 rounded-2xl outline-none bg-slate-50 font-mono text-sm shadow-inner uppercase" 
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <button type="button" onClick={resetForm} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Salvar Componente</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Subjects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displaySubjects.map(sub => (
          <div key={sub.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 group hover:border-indigo-200 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-slate-50/50 rounded-full group-hover:bg-indigo-50 transition-colors duration-500"></div>
            
            <div className="flex items-center space-x-5 relative z-10">
              <div className="w-1.5 h-12 rounded-full shadow-sm" style={{ backgroundColor: sub.color || '#3b82f6' }}></div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[100px]">{sub.code || 'S/C'}</span>
                  <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tighter ${sub.periodicity === 'Anual' ? 'text-indigo-600 bg-indigo-50 border border-indigo-100' : 'text-amber-600 bg-amber-50 border border-amber-100'}`}>
                    {sub.periodicity}
                  </span>
                </div>
                <h4 className="font-black text-slate-800 text-sm uppercase truncate leading-tight tracking-tight">{sub.name}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Ano Letivo: {sub.year}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center relative z-10">
               <div className="flex gap-2">
                 <button 
                   onClick={() => handleEdit(sub)} 
                   className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                   title="Editar"
                 >
                   ✏️
                 </button>
                 <button 
                   onClick={() => setDeleteConfirm({ id: sub.id, name: sub.name })} 
                   className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                   title="Excluir"
                 >
                   🗑️
                 </button>
               </div>
               <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{sub.year} SEI</span>
            </div>
          </div>
        ))}

        {displaySubjects.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center opacity-30">
             <div className="text-8xl mb-4 grayscale">📚</div>
             <p className="text-xl font-black uppercase tracking-widest text-slate-600">Nenhum componente em {filterYear}</p>
             <p className="text-sm font-medium text-slate-500 mt-2">Cadastre as disciplinas deste ano para liberar os relatórios.</p>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[120] p-4 text-center">
          <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden p-12 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border border-red-100">⚠️</div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Remover Componente?</h3>
            <p className="text-sm font-medium text-slate-500 mt-3 mb-10 leading-relaxed px-2">
              Deseja realmente excluir <strong className="text-slate-800 uppercase">{deleteConfirm.name}</strong>?<br/>
              Isso afetará o diário de classe e as médias de {filterYear}.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200">Cancelar</button>
              <button 
                onClick={async () => {
                  await deleteItem('subjects', deleteConfirm.id);
                  setDeleteConfirm(null);
                }} 
                className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
