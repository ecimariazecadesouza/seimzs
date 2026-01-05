
import React, { useMemo, useState } from 'react';
import { useSchool } from '../context/SchoolContext';

// --- Icons (Componentizados para limpeza) ---
const Icons = {
  Users: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  TrendUp: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  School: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Book: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Alert: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
};

// --- Componentes de UI ---

const KPICard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; colorBg: string; colorText: string }> = ({ title, value, icon, colorBg, colorText }) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 mt-2 tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-2xl ${colorBg} ${colorText} shadow-sm`}>
        {icon}
      </div>
    </div>
  </div>
);

const StatusMetric: React.FC<{ label: string; count: number; total: number; colorClass: string; bgClass: string }> = ({ label, count, total, colorClass, bgClass }) => {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className={`flex-1 p-6 rounded-3xl border ${bgClass} text-center transition-all hover:scale-[1.02]`}>
      <div className={`text-4xl font-black ${colorClass} mb-1`}>{count}</div>
      <div className={`text-xs font-bold ${colorClass} opacity-80 uppercase tracking-wide`}>{label}</div>
      <div className="text-[9px] font-bold text-slate-400/80 uppercase tracking-widest mt-2">{percent}% do total</div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { data } = useSchool();
  const [filterYear, setFilterYear] = useState('2026');

  const stats = useMemo(() => {
    // Filtrar turmas pelo ano selecionado
    const classesOfYear = data.classes.filter(c => c.year === filterYear);
    const classIdsOfYear = new Set(classesOfYear.map(c => String(c.id)));
    
    // Filtrar alunos que pertencem às turmas desse ano
    const studentsOfYear = data.students.filter(s => classIdsOfYear.has(String(s.classId)));
    const totalStudents = studentsOfYear.length;
    const normalize = (s: string) => s ? s.toLowerCase().trim() : '';

    const statusCounts = {
      cursando: studentsOfYear.filter(s => ['cursando', 'ativo'].includes(normalize(s.status || 'cursando'))).length,
      transferidos: studentsOfYear.filter(s => normalize(s.status).includes('transfer')).length,
      evadidos: studentsOfYear.filter(s => normalize(s.status).includes('eva')).length,
    };

    let aprovados = 0;
    let recuperacao = 0;
    let emCurso = 0;

    const activeStudents = studentsOfYear.filter(s => ['cursando', 'ativo'].includes(normalize(s.status || 'cursando')));

    activeStudents.forEach(student => {
      const studentClass = classesOfYear.find(c => String(c.id) === String(student.classId));
      if (!studentClass || !studentClass.subjectIds || studentClass.subjectIds.length === 0) {
        emCurso++;
        return;
      }

      const subjectsInClass = data.subjects.filter(s => studentClass.subjectIds?.includes(s.id));
      let isFailingAny = false;
      let isPendingAny = false;

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

      if (isPendingAny) emCurso++;
      else if (isFailingAny) recuperacao++;
      else aprovados++;
    });

    const studentIdsOfYear = new Set(studentsOfYear.map(s => s.id));
    const gradesOfYear = data.grades.filter(g => studentIdsOfYear.has(g.studentId));
    const allGradeValues = gradesOfYear.map(g => g.value).filter(v => v !== null);
    
    const globalAverage = allGradeValues.length > 0
      ? (allGradeValues.reduce((a, b) => a + b, 0) / allGradeValues.length)
      : 0;

    return { 
      totalStudents, 
      statusCounts,
      academic: { aprovados, recuperacao, emCurso },
      globalAverage,
      activeClassesCount: classesOfYear.length
    };
  }, [data, filterYear]);

  const sortedClasses = useMemo(() => {
    return data.classes
      .filter(c => c.year === filterYear)
      .sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
  }, [data.classes, filterYear]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* Header com Filtro de Ano */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0A1128] tracking-tight">Visão Geral</h1>
          <p className="text-slate-500 font-medium mt-1">Indicadores de desempenho e ocupação em tempo real.</p>
        </div>
        <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-5 py-2.5 shadow-sm">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mr-4">Filtrar Ano</span>
            <select 
              value={filterYear} 
              onChange={e => setFilterYear(e.target.value)} 
              className="bg-transparent outline-none text-slate-800 font-black text-sm cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
            title="Total Protagonistas" 
            value={stats.totalStudents} 
            icon={<Icons.Users />} 
            colorBg="bg-blue-50" 
            colorText="text-blue-600" 
        />
        <KPICard 
            title="Média Global" 
            value={stats.globalAverage.toFixed(1)} 
            icon={<Icons.TrendUp />} 
            colorBg={stats.globalAverage >= 6 ? "bg-emerald-50" : "bg-amber-50"} 
            colorText={stats.globalAverage >= 6 ? "text-emerald-600" : "text-amber-600"} 
        />
        <KPICard 
            title="Turmas Ativas" 
            value={stats.activeClassesCount} 
            icon={<Icons.School />} 
            colorBg="bg-purple-50" 
            colorText="text-purple-600" 
        />
        <KPICard 
            title="Disciplinas" 
            value={data.subjects.length} 
            icon={<Icons.Book />} 
            colorBg="bg-indigo-50" 
            colorText="text-indigo-600" 
        />
      </div>

      {/* Seção Principal de Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coluna Esquerda: Status e Acadêmico */}
        <div className="lg:col-span-8 space-y-8">
            
            {/* Status Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                    Situação Cadastral ({filterYear})
                </h3>
                <div className="flex flex-col sm:flex-row gap-6">
                    <StatusMetric 
                        label="Cursando" 
                        count={stats.statusCounts.cursando} 
                        total={stats.totalStudents} 
                        bgClass="border-emerald-100 bg-emerald-50/30" 
                        colorClass="text-emerald-600" 
                    />
                    <StatusMetric 
                        label="Transferidos" 
                        count={stats.statusCounts.transferidos} 
                        total={stats.totalStudents} 
                        bgClass="border-blue-100 bg-blue-50/30" 
                        colorClass="text-blue-600" 
                    />
                    <StatusMetric 
                        label="Evadidos" 
                        count={stats.statusCounts.evadidos} 
                        total={stats.totalStudents} 
                        bgClass="border-red-100 bg-red-50/30" 
                        colorClass="text-red-600" 
                    />
                </div>
            </div>

            {/* Academic Performance Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Icons.TrendUp />
                </div>
                <div className="flex justify-between items-end mb-8">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                        Desempenho Acadêmico ({filterYear})
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase bg-slate-50 px-2 py-1 rounded">Critério: Soma ≥ 24</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col justify-center items-center text-center">
                        <span className="text-3xl font-black text-emerald-600">{stats.academic.aprovados}</span>
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mt-1">Aprovados</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-red-50 border border-red-100 flex flex-col justify-center items-center text-center">
                        <span className="text-3xl font-black text-red-600">{stats.academic.recuperacao}</span>
                        <span className="text-[10px] font-black text-red-800 uppercase tracking-widest mt-1">Recuperação</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col justify-center items-center text-center">
                        <span className="text-3xl font-black text-amber-600">{stats.academic.emCurso}</span>
                        <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest mt-1">Em Curso</span>
                    </div>
                </div>
                <div className="mt-6 flex items-start gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-slate-400 mt-0.5"><Icons.Alert /></div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        <strong>Nota:</strong> Os dados referem-se ao ano letivo selecionado. Alunos "Em Curso" possuem diários incompletos ou em andamento.
                    </p>
                </div>
            </div>
        </div>

        {/* Coluna Direita: Ocupação */}
        <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-full flex flex-col max-h-[720px]">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-6">Ocupação por Turma ({filterYear})</h3>
                
                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {sortedClasses.length === 0 && (
                        <div className="text-center py-24 text-slate-400 text-sm italic flex flex-col items-center">
                            <span className="text-4xl mb-3 opacity-20">🏫</span>
                            Nenhuma turma registrada em {filterYear}.
                        </div>
                    )}

                    {sortedClasses.map(cls => {
                        const count = data.students.filter(s => String(s.classId) === String(cls.id)).length;
                        const percentage = stats.totalStudents > 0 ? (count / stats.totalStudents) * 100 : 0;
                        
                        return (
                            <div key={cls.id} className="group cursor-default border-b border-slate-50 pb-4 last:border-0">
                                <div className="flex justify-between items-end mb-2.5">
                                    <div>
                                        <span className="block text-xs font-black text-slate-700 uppercase tracking-tight">{cls.name}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cls.enrollmentType || 'Regular'}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{count}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase ml-2">Alunos</span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className="bg-indigo-500 h-full rounded-full transition-all duration-1000 group-hover:bg-indigo-600" 
                                        style={{ width: `${Math.min(100, percentage)}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="pt-8 mt-6 border-t border-slate-100 text-center">
                    <button className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">
                        Total de {sortedClasses.length} turmas listadas
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
