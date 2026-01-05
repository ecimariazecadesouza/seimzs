
import React, { useState, useMemo, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler, ChartDataLabels
);

const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string; bgColor: string }> = ({ title, value, icon, color, bgColor }) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center space-x-6 transition-all hover:shadow-md hover:-translate-y-1">
    <div className={`w-16 h-16 rounded-2xl ${bgColor} flex items-center justify-center text-3xl shadow-inner`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{title}</p>
      <p className={`text-4xl font-black ${color} tracking-tighter leading-none`}>{value}</p>
    </div>
  </div>
);

const Analytics: React.FC = () => {
  const { data, loading } = useSchool();
  
  const [filters, setFilters] = useState({
    year: '2026',
    status: 'Cursando',
    term: 'all', // Bimestre: 'all' (Média), '1', '2', '3', '4'
    classId: 'all',
    formationId: 'all',
    areaId: 'all',
    subAreaId: 'all',
    subjectId: 'all'
  });

  // Resets de cascata
  useEffect(() => { setFilters(f => ({ ...f, areaId: 'all', subAreaId: 'all', subjectId: 'all' })); }, [filters.formationId]);
  useEffect(() => { setFilters(f => ({ ...f, subAreaId: 'all', subjectId: 'all' })); }, [filters.areaId]);
  useEffect(() => { setFilters(f => ({ ...f, subjectId: 'all' })); }, [filters.subAreaId]);

  // Opções filtradas para os selects
  const filteredAreas = useMemo(() => data.knowledgeAreas.filter(a => filters.formationId === 'all' || a.formationTypeId === filters.formationId), [data.knowledgeAreas, filters.formationId]);
  const filteredSubAreas = useMemo(() => data.subAreas.filter(sa => filters.areaId === 'all' || sa.knowledgeAreaId === filters.areaId), [data.subAreas, filters.areaId]);
  const filteredSubjects = useMemo(() => data.subjects.filter(s => (filters.subAreaId === 'all' || s.subAreaId === filters.subAreaId) && String(s.year) === filters.year), [data.subjects, filters.subAreaId, filters.year]);

  const reportData = useMemo(() => {
    // 1. Filtrar Contexto
    const activeClasses = data.classes.filter(c => 
      String(c.year) === String(filters.year) && 
      (filters.classId === 'all' || String(c.id) === String(filters.classId))
    );
    const activeClassIds = new Set(activeClasses.map(c => String(c.id)));

    const activeStudents = data.students.filter(s => 
      activeClassIds.has(String(s.classId)) && 
      (filters.status === 'all' || (s.status || 'Cursando') === filters.status)
    );
    const activeStudentIds = new Set(activeStudents.map(s => String(s.id)));

    // Filtro hierárquico de disciplinas
    const targetSubjectIds = new Set(data.subjects.filter(s => {
      if (String(s.year) !== filters.year) return false;
      if (filters.subjectId !== 'all' && String(s.id) !== filters.subjectId) return false;
      
      const sa = data.subAreas.find(x => x.id === s.subAreaId);
      if (filters.subAreaId !== 'all' && (!sa || String(sa.id) !== filters.subAreaId)) return false;
      
      const a = data.knowledgeAreas.find(x => x.id === sa?.knowledgeAreaId);
      if (filters.areaId !== 'all' && (!a || String(a.id) !== filters.areaId)) return false;
      
      const f = data.formations.find(x => x.id === a?.formationTypeId);
      if (filters.formationId !== 'all' && (!f || String(f.id) !== filters.formationId)) return false;

      return true;
    }).map(s => String(s.id)));

    // 2. Mapear Notas
    const gradeMap: Record<string, Record<string, Record<number, number>>> = {};
    data.grades.forEach(g => {
        if (!activeStudentIds.has(String(g.studentId)) || !targetSubjectIds.has(String(g.subjectId))) return;
        const sId = String(g.studentId);
        const subId = String(g.subjectId);
        if (!gradeMap[sId]) gradeMap[sId] = {};
        if (!gradeMap[sId][subId]) gradeMap[sId][subId] = {};
        gradeMap[sId][subId][g.term] = g.value;
    });

    // 3. Processar Rendimento Individual e Agrupado
    const areaResults: Record<string, { sum: number, count: number }> = {};
    const subAreaResults: Record<string, { sum: number, count: number }> = {};
    const subjectAverages: Record<string, { sum: number, count: number }> = {};

    const performance = activeStudents.map(std => {
        let stdSum = 0;
        let stdCount = 0;
        targetSubjectIds.forEach(subId => {
            const grades = gradeMap[std.id as string]?.[subId as string];
            if (grades) {
                let val = 0;
                if (filters.term === 'all') {
                    const mg = ((grades[1] || 0) + (grades[2] || 0) + (grades[3] || 0) + (grades[4] || 0)) / 4;
                    val = mg < 6 && grades[5] !== undefined ? (mg * 6 + grades[5] * 4) / 10 : mg;
                } else {
                    val = grades[parseInt(filters.term)] || 0;
                }

                if (val > 0) {
                    stdSum += val;
                    stdCount++;

                    // Agrupamento para estatísticas por componente
                    if (!subjectAverages[subId]) subjectAverages[subId] = { sum: 0, count: 0 };
                    subjectAverages[subId].sum += val;
                    subjectAverages[subId].count++;

                    // Agrupamento para estatísticas por Área e Subárea
                    const sub = data.subjects.find(s => String(s.id) === subId);
                    if (sub) {
                      const sa = data.subAreas.find(x => x.id === sub.subAreaId);
                      const a = data.knowledgeAreas.find(x => x.id === sa?.knowledgeAreaId);
                      
                      if (a) {
                        if (!areaResults[a.id]) areaResults[a.id] = { sum: 0, count: 0 };
                        areaResults[a.id].sum += val;
                        areaResults[a.id].count++;
                      }
                      if (sa) {
                        if (!subAreaResults[sa.id]) subAreaResults[sa.id] = { sum: 0, count: 0 };
                        subAreaResults[sa.id].sum += val;
                        subAreaResults[sa.id].count++;
                      }
                    }
                }
            }
        });
        return { avg: stdCount > 0 ? stdSum / stdCount : 0, hasGrades: stdCount > 0 };
    });

    const validResults = performance.filter(p => p.hasGrades);
    const globalAvg = validResults.length > 0 ? validResults.reduce((a, b) => a + b.avg, 0) / validResults.length : 0;
    const passRate = validResults.length > 0 ? (validResults.filter(p => p.avg >= 6).length / validResults.length) * 100 : 0;

    // Estatísticas formatadas para os gráficos
    const subStats = Object.entries(subjectAverages).map(([id, stats]) => {
      const sub = data.subjects.find(s => s.id === id);
      return { name: sub?.name || '?', avg: stats.sum / stats.count };
    }).sort((a,b) => b.avg - a.avg).slice(0, 15);

    const areaStats = Object.entries(areaResults).map(([id, stats]) => {
      const area = data.knowledgeAreas.find(a => a.id === id);
      return { name: area?.name || '?', avg: stats.sum / stats.count };
    }).sort((a, b) => b.avg - a.avg);

    const subAreaStats = Object.entries(subAreaResults).map(([id, stats]) => {
      const sa = data.subAreas.find(s => s.id === id);
      return { name: sa?.name || '?', avg: stats.sum / stats.count };
    }).sort((a, b) => b.avg - a.avg).slice(0, 15);

    // 4. Evolução por Turma (Line Chart)
    const classEvolution = activeClasses.map(cls => {
        const studentsInCls = data.students.filter(s => String(s.classId) === String(cls.id) && (filters.status === 'all' || (s.status || 'Cursando') === filters.status));
        const termsAvg = [1, 2, 3, 4].map(t => {
            let tSum = 0, tCount = 0;
            studentsInCls.forEach(std => {
                targetSubjectIds.forEach(subId => {
                    const val = gradeMap[std.id as string]?.[subId as string]?.[t];
                    if (val !== undefined && val > 0) { tSum += val; tCount++; }
                });
            });
            return tCount > 0 ? tSum / tCount : 0;
        });
        return { name: cls.name, data: termsAvg };
    }).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));

    return { globalAvg, passRate, studentCount: activeStudents.length, classEvolution, subStats, areaStats, subAreaStats };
  }, [data, filters]);

  // Configurações de Gráficos
  const barOptions = (showLabels = true) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { 
        legend: { display: false }, 
        datalabels: { 
            display: showLabels,
            anchor: 'end', align: 'top', offset: 4, 
            color: '#64748b', font: { weight: 'bold', size: 10 },
            formatter: (v: number) => v.toFixed(1)
        } 
    },
    scales: { 
        y: { suggestedMax: 10, grid: { display: false }, ticks: { font: { weight: 'bold' } } },
        x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 9 } } }
    }
  });

  const lineData = {
    labels: ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'],
    datasets: reportData.classEvolution.map((cls, idx) => ({
      label: cls.name,
      data: cls.data,
      borderColor: `hsl(${(idx * 137) % 360}, 70%, 50%)`,
      backgroundColor: `transparent`,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    }))
  };

  if (loading) return <div className="p-20 text-center font-black text-slate-400 animate-pulse uppercase tracking-[0.2em]">Sincronizando Base de Dados...</div>;

  return (
    <div className="space-y-10 pb-20 max-w-[1500px] mx-auto animate-in fade-in duration-700">
      
      {/* HEADER E FILTROS */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0A1128] tracking-tight">Análise de Dados</h1>
          <p className="text-slate-500 font-medium">Extração de inteligência e rendimento acadêmico institucional.</p>
        </div>
        
        <div className="bg-white p-3 rounded-3xl md:rounded-full border border-slate-100 shadow-sm flex flex-wrap gap-2 items-center">
            {/* Ano Letivo Pill */}
            <div className="flex bg-slate-100 p-1 rounded-full mr-2">
                {['2025', '2026'].map(y => (
                    <button key={y} onClick={() => setFilters({...filters, year: y})} className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${filters.year === y ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{y}</button>
                ))}
            </div>

            {/* Selects em série */}
            {[
                { key: 'status', options: ['Cursando', 'Transferência', 'Evasão', 'Todos'], label: 'Status' },
                { key: 'term', options: [{v:'all', l:'Média Anual'}, {v:'1', l:'1º Bim'}, {v:'2', l:'2º Bim'}, {v:'3', l:'3º Bim'}, {v:'4', l:'4º Bim'}], label: 'Bimestre' },
                { key: 'classId', options: [{v:'all', l:'Todas Turmas'}, ...data.classes.filter(c => c.year === filters.year).map(c => ({v:c.id, l:c.name}))], label: 'Turma' },
                { key: 'formationId', options: [{v:'all', l:'Tds Formações'}, ...data.formations.map(f => ({v:f.id, l:f.name}))], label: 'Formação' },
                { key: 'areaId', options: [{v:'all', l:'Tds Áreas'}, ...filteredAreas.map(a => ({v:a.id, l:a.name}))], label: 'Área' },
                { key: 'subAreaId', options: [{v:'all', l:'Tds Subáreas'}, ...filteredSubAreas.map(sa => ({v:sa.id, l:sa.name}))], label: 'Subárea' },
                { key: 'subjectId', options: [{v:'all', l:'Tds Disciplinas'}, ...filteredSubjects.map(s => ({v:s.id, l:s.name}))], label: 'Disciplina' }
            ].map(f => (
                <select 
                    key={f.key}
                    value={(filters as any)[f.key]}
                    onChange={e => setFilters({...filters, [f.key]: e.target.value})}
                    className="bg-white border border-slate-100 rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-wider text-slate-600 outline-none hover:border-indigo-200 transition-colors shadow-sm cursor-pointer"
                >
                    {f.options.map((opt: any) => (
                        <option key={opt.v || opt} value={opt.v || opt}>{opt.l || opt}</option>
                    ))}
                </select>
            ))}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="População Alvo" value={reportData.studentCount} icon="👥" color="text-indigo-600" bgColor="bg-indigo-50" />
        <StatCard title="Média de Rendimento" value={reportData.globalAvg.toFixed(1)} icon="📈" color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatCard title="Taxa de Aprovação" value={`${Math.round(reportData.passRate)}%`} icon="✅" color="text-blue-600" bgColor="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* GRÁFICO: EVOLUÇÃO POR TURMA */}
        <div className="lg:col-span-12 bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm min-h-[450px]">
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-12 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
              Evolução das Médias por Turmas
           </h3>
           <div className="h-96">
                <Line 
                    data={lineData} 
                    options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: { 
                            legend: { position: 'bottom', labels: { boxWidth: 8, usePointStyle: true, font: { weight: 'bold', size: 10 } } },
                            datalabels: { display: false }
                        },
                        scales: { y: { suggestedMax: 10, min: 0, ticks: { font: { weight: 'bold' } } }, x: { ticks: { font: { weight: 'bold' } } } }
                    } as any} 
                />
           </div>
        </div>

        {/* GRÁFICO: COMPARATIVO ENTRE ÁREAS */}
        <div className="lg:col-span-6 bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm min-h-[450px]">
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-12 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
              Comparativo entre as Áreas
           </h3>
           <div className="h-80">
                <Bar 
                    data={{
                        labels: reportData.areaStats.map(s => s.name),
                        datasets: [{ 
                            data: reportData.areaStats.map(s => s.avg),
                            backgroundColor: reportData.areaStats.map((s, i) => `hsla(${(i * 50) % 360}, 70%, 50%, 0.7)`),
                            borderRadius: 12
                        }]
                    }} 
                    options={barOptions() as any} 
                />
           </div>
        </div>

        {/* GRÁFICO: COMPARATIVO ENTRE SUBÁREAS */}
        <div className="lg:col-span-6 bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm min-h-[450px]">
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-12 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-amber-600 rounded-full"></div>
              Comparativo entre as Subáreas
           </h3>
           <div className="h-80">
                <Bar 
                    data={{
                        labels: reportData.subAreaStats.map(s => s.name),
                        datasets: [{ 
                            data: reportData.subAreaStats.map(s => s.avg),
                            backgroundColor: reportData.subAreaStats.map((s, i) => `hsla(${(i * 30 + 180) % 360}, 70%, 50%, 0.7)`),
                            borderRadius: 12
                        }]
                    }} 
                    options={barOptions() as any} 
                />
           </div>
        </div>

        {/* RENDIMENTO POR DISCIPLINA */}
        <div className="lg:col-span-8 bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm min-h-[500px]">
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-12 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-rose-600 rounded-full"></div>
              Rendimento por Componente Curricular
           </h3>
           <div className="h-96">
                <Bar 
                    data={{
                        labels: reportData.subStats.map(s => s.name),
                        datasets: [{ 
                            data: reportData.subStats.map(s => s.avg),
                            backgroundColor: reportData.subStats.map(s => s.avg >= 6 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(244, 63, 94, 0.7)'),
                            borderRadius: 12
                        }]
                    }} 
                    options={barOptions() as any} 
                />
           </div>
        </div>

        {/* TAXA DE SUCESSO */}
        <div className="lg:col-span-4 bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm flex flex-col items-center">
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] self-start mb-12">Distribuição de Status</h3>
           <div className="relative w-full aspect-square max-w-[280px]">
             <Doughnut 
               data={{
                 labels: ['Aprovados', 'Retidos/Em Curso'],
                 datasets: [{
                   data: [reportData.passRate, 100 - reportData.passRate],
                   backgroundColor: ['#10b981', '#f1f5f9'],
                   borderWidth: 0,
                   hoverOffset: 4
                 }]
               }}
               options={{
                 responsive: true, maintainAspectRatio: false, cutout: '75%',
                 plugins: { legend: { display: false }, datalabels: { display: false } }
               } as any}
             />
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-emerald-600 tracking-tighter">{Math.round(reportData.passRate)}%</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Aprovação</span>
             </div>
           </div>
           <div className="mt-12 space-y-4 w-full">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aptos Estimados</span>
                 <span className="font-black text-emerald-600">{(reportData.passRate * reportData.studentCount / 100).toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Em Risco/Pendente</span>
                 <span className="font-black text-rose-500">{(reportData.studentCount - (reportData.passRate * reportData.studentCount / 100)).toFixed(0)}</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
