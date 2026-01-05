
import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Class, Student, Grade } from '../types';

// --- Icons ---
const Icons = {
  Users: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Book: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Copy: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>,
  Trash: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Plus: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>,
  SchoolCap: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-7-6l7 7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
};

const Classes: React.FC = () => {
  const { data, addClass, updateClass, deleteItem } = useSchool();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
  const [viewingSubjects, setViewingSubjects] = useState<Class | null>(null);
  const [viewingStudents, setViewingStudents] = useState<Class | null>(null);
  const [filterYear, setFilterYear] = useState('2026');

  // Form State
  const [name, setName] = useState('');
  const [enrollmentType, setEnrollmentType] = useState('Regular');
  const [year, setYear] = useState('2026');
  const [shift, setShift] = useState('Manhã');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const resetForm = () => {
    setName(''); setEnrollmentType('Regular'); setYear('2026'); setShift('Manhã'); setSelectedSubjects([]);
    setIsFormOpen(false); setEditingId(null);
  };

  const handleEdit = (cls: Class) => {
    setEditingId(cls.id); setName(cls.name); setEnrollmentType(cls.enrollmentType);
    setYear(cls.year); setShift(cls.shift); setSelectedSubjects(cls.subjectIds || []);
    setIsFormOpen(true);
  };

  const handleClone = (cls: Class) => {
    setEditingId(null);
    setName(`${cls.name} (CÓPIA)`); 
    setEnrollmentType(cls.enrollmentType);
    setYear(cls.year); 
    setShift(cls.shift); 
    setSelectedSubjects(cls.subjectIds || []);
    setIsFormOpen(true);
  };

  const handleSelectAllSubjects = () => {
    setSelectedSubjects(data.subjects.map(s => s.id));
  };

  const handleDeselectAllSubjects = () => {
    setSelectedSubjects([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, enrollmentType, year, shift, subjectIds: selectedSubjects };
    if (editingId) await updateClass(editingId, payload);
    else await addClass(payload);
    resetForm();
  };

  const handleRemoveSubjectFromClass = async (classId: string, subjectId: string) => {
    const cls = data.classes.find(c => c.id === classId);
    if (!cls) return;
    const newSubjectIds = (cls.subjectIds || []).filter(id => id !== subjectId);
    await updateClass(classId, { subjectIds: newSubjectIds });
    setViewingSubjects(prev => prev ? {...prev, subjectIds: newSubjectIds} : null);
  };

  const calculateAcademicSituation = (cls: Class) => {
    const classStudents = data.students.filter(s => String(s.classId) === String(cls.id) && (s.status === 'Cursando' || !s.status));
    let aprovados = 0;
    let reprovados = 0;
    let pendentes = 0;

    classStudents.forEach(student => {
      const subjectsInClass = data.subjects.filter(s => cls.subjectIds?.includes(s.id));
      let isFailingAny = false;
      let isPendingAny = false;

      if (subjectsInClass.length === 0) {
        pendentes++;
        return;
      }

      subjectsInClass.forEach(sub => {
        const grades = data.grades.filter(g => g.studentId === student.id && g.subjectId === sub.id);
        const bims = [1, 2, 3, 4].map(t => grades.find(g => g.term === t)?.value);
        const validBims = bims.filter(v => v !== undefined && v !== null) as number[];
        
        if (validBims.length < 4) {
          isPendingAny = true;
        } else {
          const sum = validBims.reduce((a, b) => a + b, 0);
          if (sum < 24) isFailingAny = true;
        }
      });

      if (isPendingAny) pendentes++;
      else if (isFailingAny) reprovados++;
      else aprovados++;
    });

    return { aprovados, reprovados, pendentes };
  };

  // Ordenação crescente das turmas (Natural Sort)
  const filteredClasses = useMemo(() => {
    return data.classes
      .filter(c => c.year === filterYear)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [data.classes, filterYear]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0A1128] tracking-tight">Turmas</h1>
          <p className="text-slate-500 font-medium">Gestão acadêmica e acompanhamento estratégico.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mr-3">Filtrar Ano</span>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="bg-transparent outline-none text-slate-800 font-black text-sm">
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-[#0A1128] text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-slate-800 transition-all active:scale-95">
            <Icons.Plus /> Nova Turma
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingId ? 'Editar Turma' : 'Configurar Turma'}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Parâmetros de enturmação e grade</p>
                </div>
                <button onClick={resetForm} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm transition-all hover:text-slate-800">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nome da Turma *</label>
                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: 1º Ano A" className="w-full p-4 border border-slate-200 rounded-2xl outline-none bg-slate-50 font-bold focus:bg-white transition-all shadow-inner" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Modalidade *</label>
                    <select required value={enrollmentType} onChange={e => setEnrollmentType(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold outline-none focus:bg-white transition-all shadow-inner">
                        <option value="Integral">Integral</option>
                        <option value="Regular">Regular</option>
                        <option value="EJA">EJA</option>
                        <option value="Especial">Especial</option>
                    </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Turno *</label>
                    <select required value={shift} onChange={e => setShift(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold outline-none focus:bg-white transition-all shadow-inner">
                        <option value="Integral">Integral</option>
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Ano Letivo *</label>
                    <input required value={year} onChange={e => setYear(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl outline-none bg-slate-50 font-bold shadow-inner focus:bg-white transition-all" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Disciplinas da Turma</label>
                     <p className="text-[10px] font-bold text-indigo-600 ml-1 mt-1">{selectedSubjects.length} selecionadas</p>
                   </div>
                   <div className="flex gap-2">
                     <button type="button" onClick={handleSelectAllSubjects} className="text-[9px] font-black text-white bg-indigo-600 px-3 py-2 rounded-xl uppercase tracking-widest hover:bg-indigo-700 transition-all">Selecionar Todas</button>
                     <button type="button" onClick={handleDeselectAllSubjects} className="text-[9px] font-black text-slate-600 bg-slate-100 px-3 py-2 rounded-xl uppercase tracking-widest hover:bg-slate-200 transition-all">Desmarcar Todas</button>
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-6 bg-slate-50 rounded-[32px] max-h-56 overflow-y-auto border border-slate-200 shadow-inner">
                  {data.subjects.sort((a, b) => {
                    if (a.periodicity === b.periodicity) return a.name.localeCompare(b.name);
                    return a.periodicity === 'Anual' ? -1 : 1;
                  }).map(sub => (
                    <div 
                        key={sub.id} 
                        onClick={() => setSelectedSubjects(prev => prev.includes(sub.id) ? prev.filter(s => s !== sub.id) : [...prev, sub.id])} 
                        className={`flex items-center p-3.5 rounded-2xl cursor-pointer border-2 transition-all ${selectedSubjects.includes(sub.id) ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                    >
                      <div className={`w-2 h-2 rounded-full mr-3 ${selectedSubjects.includes(sub.id) ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                      <span className="font-bold text-[11px] text-slate-700 truncate uppercase">{sub.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-8 border-t border-slate-100">
                <button type="submit" className="px-14 py-4 bg-[#0A1128] text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all active:scale-95">
                   {editingId ? 'Salvar Alterações' : 'Confirmar e Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClasses.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center opacity-20 grayscale text-center">
             <div className="text-8xl mb-4">🏫</div>
             <p className="text-xl font-black uppercase tracking-widest text-slate-600">Nenhuma turma registrada para {filterYear}</p>
          </div>
        )}

        {filteredClasses.map(cls => {
          const academic = calculateAcademicSituation(cls);
          const students = data.students.filter(s => String(s.classId) === String(cls.id));
          const studentsCount = students.length;
          const statusCursando = students.filter(s => (s.status === 'Cursando' || !s.status)).length;
          const statusTransferencia = students.filter(s => s.status === 'Transferência').length;
          const statusEvasao = students.filter(s => s.status === 'Evasão').length;
          const statusOutro = students.filter(s => s.status === 'Outro').length;

          return (
            <div key={cls.id} className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 flex flex-col transition-all hover:shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors duration-500"></div>

              {/* Header conforme imagem */}
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 shadow-inner">
                   <Icons.SchoolCap />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 leading-none tracking-tight">{cls.name}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{cls.enrollmentType}</p>
                </div>
              </div>

              {/* Info Rows */}
              <div className="space-y-3 mb-8 px-1 relative z-10">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Ano Letivo:</span>
                  <span className="font-bold text-slate-800">{cls.year}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Turno:</span>
                  <span className="font-bold text-slate-800">{cls.shift}</span>
                </div>
                <div onClick={() => setViewingSubjects(cls)} className="flex justify-between items-center text-sm cursor-pointer hover:bg-slate-50 p-1 -mx-1 rounded-lg transition-colors group/row">
                  <span className="text-slate-500 font-medium">Disciplinas:</span>
                  <span className="font-bold text-slate-800 group-hover/row:text-indigo-600 flex items-center gap-1">
                    {cls.subjectIds?.length || 0} ativa(s)
                    <Icons.ChevronRight />
                  </span>
                </div>
              </div>

              {/* Status Section conforme imagem */}
              <div className="bg-[#f8fafc] rounded-2xl p-5 mb-6 border border-slate-50 relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Status dos Protagonistas</p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-8">
                  <div className="flex justify-between items-center">
                    <span className="bg-green-50 text-green-600 border border-green-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Cursando</span>
                    <span className="font-black text-slate-800">{statusCursando}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Transferência</span>
                    <span className="font-black text-slate-800">{statusTransferencia}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Evasão</span>
                    <span className="font-black text-slate-800">{statusEvasao}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Outro</span>
                    <span className="font-black text-slate-800">{statusOutro}</span>
                  </div>
                </div>
              </div>

              {/* Situação Acadêmica conforme imagem */}
              <div className="bg-[#f0f4ff]/50 border border-indigo-100 rounded-2xl p-5 mb-6 relative z-10">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Situação Acadêmica</p>
                <div className="flex justify-between">
                  <div className="text-center flex-1">
                    <div className="text-2xl font-black text-green-500 leading-none">{academic.aprovados}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-2 text-center">Aprovados</div>
                  </div>
                  <div className="text-center flex-1 border-x border-indigo-100/50">
                    <div className="text-2xl font-black text-red-500 leading-none">{academic.reprovados}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-2 text-center">Reprovados</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-2xl font-black text-amber-500 leading-none">{academic.pendentes}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-2 text-center">Pendentes</div>
                  </div>
                </div>
              </div>

              {/* Botão Ver Protagonistas conforme imagem */}
              <button onClick={() => setViewingStudents(cls)} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 transition-all mb-8 group/btn shadow-sm relative z-10">
                <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                   <Icons.Users />
                   <span>Ver Protagonistas ({studentsCount})</span>
                </div>
                <Icons.ChevronRight />
              </button>

              <div className="h-px bg-slate-100 mb-8 relative z-10" />

              {/* Action Buttons conforme imagem + Clonar */}
              <div className="flex gap-3 relative z-10">
                <button onClick={() => handleEdit(cls)} className="flex-1 flex items-center justify-center gap-3 py-4 border border-slate-200 rounded-2xl text-slate-700 font-black text-[11px] uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm">
                  <Icons.Edit /> Editar
                </button>
                <button onClick={() => handleClone(cls)} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm" title="Clonar Turma">
                  <Icons.Copy />
                </button>
                <button onClick={() => setDeleteConfirm({ id: cls.id, name: cls.name })} className="w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm" title="Excluir">
                  <Icons.Trash />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Ver Grade (Disciplinas) */}
      {viewingSubjects && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Grade Curricular</h3>
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mt-1">{viewingSubjects.name}</p>
              </div>
              <button onClick={() => setViewingSubjects(null)} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm transition-all hover:text-slate-800">✕</button>
            </div>
            <div className="p-10 max-h-[65vh] overflow-y-auto space-y-4 custom-scrollbar">
              {data.subjects
                .filter(s => viewingSubjects.subjectIds?.includes(s.id))
                .sort((a, b) => {
                   if (a.periodicity === b.periodicity) return a.name.localeCompare(b.name);
                   return a.periodicity === 'Anual' ? -1 : 1;
                })
                .map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-2.5 h-10 rounded-full bg-indigo-500 shadow-sm shadow-indigo-100"></div>
                      <div>
                        <p className="font-black text-slate-800 text-sm uppercase leading-tight">{sub.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tight">
                          {sub.periodicity} {sub.periodicity === 'Semestral' && `• ${sub.semester === 'Ambos' ? 'Anual' : `${sub.semester}º Semestre`}`}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRemoveSubjectFromClass(viewingSubjects.id, sub.id); }} 
                      className="w-10 h-10 flex items-center justify-center text-red-200 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Remover Disciplina desta Turma"
                    >
                        <Icons.Trash />
                    </button>
                  </div>
              ))}
              {viewingSubjects.subjectIds?.length === 0 && (
                <div className="text-center py-20 opacity-20 flex flex-col items-center">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="font-black text-slate-600 uppercase tracking-widest">Nenhuma disciplina vinculada</p>
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
                <button onClick={() => setViewingSubjects(null)} className="px-12 py-3 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-100 shadow-sm transition-all">Fechar Grade</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Protagonistas (Listagem Rápida) */}
      {viewingStudents && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Protagonistas</h3>
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mt-1">{viewingStudents.name}</p>
              </div>
              <button onClick={() => setViewingStudents(null)} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm transition-all hover:text-slate-800">✕</button>
            </div>
            <div className="p-10 max-h-[65vh] overflow-y-auto space-y-4 custom-scrollbar">
              {data.students.filter(s => String(s.classId) === String(viewingStudents.id)).sort((a,b)=>a.name.localeCompare(b.name)).map(std => (
                  <div key={std.id} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 transition-all shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">👤</div>
                      <div>
                        <p className="font-black text-slate-800 text-sm uppercase leading-tight">{std.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tight">RA: {std.registrationNumber}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${std.status === 'Cursando' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-600'}`}>
                      {std.status || 'Cursando'}
                    </span>
                  </div>
              ))}
              {data.students.filter(s => String(s.classId) === String(viewingStudents.id)).length === 0 && (
                 <div className="text-center py-20 opacity-20 flex flex-col items-center">
                    <div className="text-6xl mb-4">🎓</div>
                    <p className="font-black text-slate-600 uppercase tracking-widest">Nenhum protagonista na turma</p>
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
                <button onClick={() => setViewingStudents(null)} className="px-12 py-3 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-100 shadow-sm transition-all">Fechar Lista</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[120] p-4 text-center">
          <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden p-10 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border border-red-100">⚠️</div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Remover Turma?</h3>
            <p className="text-sm font-medium text-slate-500 mt-3 mb-10 leading-relaxed px-2">
              Você está prestes a excluir a turma <strong className="text-slate-800 uppercase">{deleteConfirm.name}</strong>. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
              <button onClick={async () => { await deleteItem('classes', deleteConfirm.id); setDeleteConfirm(null); }} className="flex-1 px-4 py-4 bg-red-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
