
import React, { useState, useMemo, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Student, Grade, Subject, Class, SchoolSettings } from '../types';
import jsPDF from 'jspdf';

// --- Interfaces de Cálculo ---
interface GradeCalculation {
  subject: Subject;
  b1?: number | null;
  b2?: number | null;
  b3?: number | null;
  b4?: number | null;
  rf?: number | null;
  mg: number;
  mf: number;
  situationLabel: string;
  performanceLabel: string;
}

// --- Helpers de Formatação ---
const getPerformance = (mf: number): string => {
  if (mf === 0) return ' - ';
  if (mf < 5.0) return 'Insuficiente';
  if (mf < 6.0) return 'Regular';
  if (mf < 8.0) return 'Bom';
  return 'Ótimo';
};

const formatValue = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return '-';
  return val.toFixed(1);
};

// --- Conversor de Imagem (Seguro) ---
const safeGetBase64 = async (url: string): Promise<string | null> => {
  if (!url) return null;
  try {
    const response = await fetch(url, { mode: 'cors' }).catch(() => null);
    if (!response || !response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Logo não carregado. Gerando PDF sem imagem.");
    return null;
  }
};

// --- Lógica de Médias ---
const calculateStudentGrades = (student: Student, classe: Class | null | undefined, allSubjects: Subject[], allGrades: Grade[]): GradeCalculation[] => {
  if (!student || !classe) return [];
  const classSubjects = allSubjects
    .filter(sub => classe.subjectIds?.includes(sub.id))
    .sort((a, b) => {
      if (a.periodicity === b.periodicity) return a.name.localeCompare(b.name);
      return a.periodicity === 'Anual' ? -1 : 1;
    });

  return classSubjects.map(sub => {
    const grades = allGrades.filter(g => g.studentId === student.id && g.subjectId === sub.id);
    const b1 = grades.find(g => g.term === 1)?.value;
    const b2 = grades.find(g => g.term === 2)?.value;
    const b3 = grades.find(g => g.term === 3)?.value;
    const b4 = grades.find(g => g.term === 4)?.value;
    const rf = grades.find(g => g.term === 5)?.value;
    
    const validBims = [b1, b2, b3, b4].filter((v): v is number => v != null);
    const points = validBims.reduce((a, b) => a + b, 0);
    const mg = validBims.length > 0 ? points / 4 : 0;
    let mf = mg;
    if (mg < 6 && rf != null) {
        mf = (mg * 6 + rf * 4) / 10;
    }

    let situationLabel = 'Em Curso';
    if (validBims.length === 4) {
      if (mg >= 6.0) situationLabel = 'Aprovado';
      else if (rf != null) situationLabel = mf >= 5.0 ? 'Aprovado' : 'Reprovado';
      else situationLabel = 'Recuperação';
    }

    return { 
      subject: sub, b1, b2, b3, b4, rf, mg, mf, 
      situationLabel, 
      performanceLabel: getPerformance(mf) 
    };
  });
};

// --- Desenho do PDF ---
const drawNativeBulletin = (doc: jsPDF, student: Student, studentClass: Class | undefined, grades: GradeCalculation[], settings: SchoolSettings, year: string, logo: string | null) => {
  const pageWidth = 210;
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(255, 255, 255);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  // Header Azul
  doc.setFillColor(224, 231, 255); 
  doc.rect(0, 0, pageWidth, 70, 'F');

  if (logo) {
    try { doc.addImage(logo, 'PNG', 14, 10, 22, 22); } catch (e) {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(55, 48, 163); 
  doc.text('Boletim Escolar', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(79, 70, 229); 
  doc.text((settings.schoolName || 'SISTEMA ESCOLAR INTEGRADO').toUpperCase(), 105, 28, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(String(year), 170, 28);

  // Info Box Aluno
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(14, 38, 182, 28, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229);
  doc.text('Protagonista', 18, 44);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(student.name.toUpperCase(), 18, 51);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Matrícula: ${student.registrationNumber} | Turma: ${studentClass?.name || '---'}`, 18, 58);

  // Tabela
  let startY = 85;
  const colWidths = [50, 14, 14, 14, 14, 17, 17, 22, 20]; 
  const headers = ['Disciplina', '1ºB', '2ºB', '3ºB', '4ºB', 'M.G', 'M.F', 'Desempenho', 'Situação'];

  let currentX = 14;
  headers.forEach((header, i) => {
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(245, 245, 245);
    doc.rect(currentX, startY, colWidths[i], 8, 'FD'); 
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(6.5);
    doc.text(header, currentX + (colWidths[i] - doc.getTextWidth(header)) / 2, startY + 5.5);
    currentX += colWidths[i];
  });

  let currentY = startY + 8;
  grades.forEach((g, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, currentY, 182, 8, 'F');
    }
    currentX = 14;
    doc.setDrawColor(203, 213, 225);
    doc.rect(currentX, currentY, colWidths[0], 8, 'S');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(6);
    doc.text(g.subject.name.toUpperCase().substring(0, 28), currentX + 2, currentY + 5.5);
    currentX += colWidths[0];

    [g.b1, g.b2, g.b3, g.b4].forEach((val, i) => {
      doc.rect(currentX, currentY, colWidths[i + 1], 8, 'S');
      const txt = formatValue(val as number);
      doc.text(txt, currentX + (colWidths[i+1] - doc.getTextWidth(txt)) / 2, currentY + 5.5);
      currentX += colWidths[i + 1];
    });

    doc.setFillColor(239, 246, 255);
    doc.rect(currentX, currentY, colWidths[5], 8, 'FD');
    doc.text(formatValue(g.mg), currentX + (colWidths[5] - doc.getTextWidth(formatValue(g.mg))) / 2, currentY + 5.5);
    currentX += colWidths[5];

    const isPassing = g.mf >= 5.0;
    doc.setFillColor(isPassing ? 240 : 254, isPassing ? 253 : 242, isPassing ? 244 : 242);
    doc.rect(currentX, currentY, colWidths[6], 8, 'FD');
    doc.text(formatValue(g.mf), currentX + (colWidths[6] - doc.getTextWidth(formatValue(g.mf))) / 2, currentY + 5.5);
    currentX += colWidths[6];

    doc.setFillColor(255, 255, 255);
    doc.rect(currentX, currentY, colWidths[7], 8, 'S');
    doc.text(g.performanceLabel.toUpperCase(), currentX + (colWidths[7] - doc.getTextWidth(g.performanceLabel.toUpperCase())) / 2, currentY + 5.5);
    currentX += colWidths[7];

    doc.rect(currentX, currentY, colWidths[8], 8, 'S');
    doc.text(g.situationLabel.toUpperCase(), currentX + (colWidths[8] - doc.getTextWidth(g.situationLabel.toUpperCase())) / 2, currentY + 5.5);
    
    currentY += 8;
  });

  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text(`SEI - DOCUMENTO GERADO EM ${new Date().toLocaleDateString('PT-BR')}`, 14, 285);
};

const Reports: React.FC = () => {
  const { data, loading } = useSchool();
  const [filterYear, setFilterYear] = useState('2026');
  const [filterClassId, setFilterClassId] = useState('all');
  const [searchTerm, setOrderSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // ✅ Estado para rastrear quem já foi baixado nesta sessão
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  const yearClasses = useMemo(() => data.classes.filter(c => c.year === filterYear), [data.classes, filterYear]);
  
  const filteredStudents = useMemo(() => {
    const classIds = new Set(yearClasses.map(c => String(c.id)));
    return data.students.filter(s => {
      const inYear = classIds.has(String(s.classId));
      if (!inYear) return false;
      const matchesClass = filterClassId === 'all' || String(s.classId) === filterClassId;
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.registrationNumber.includes(searchTerm);
      return matchesClass && matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [data.students, yearClasses, filterClassId, searchTerm]);

  // ✅ Lógica de Navegação
  const currentIndex = useMemo(() => filteredStudents.findIndex(s => s.id === selectedStudentId), [filteredStudents, selectedStudentId]);
  
  const handleNext = () => {
    if (currentIndex < filteredStudents.length - 1) {
      setSelectedStudentId(filteredStudents[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedStudentId(filteredStudents[currentIndex - 1].id);
    }
  };

  const selectedStudent = useMemo(() => data.students.find(s => s.id === selectedStudentId), [selectedStudentId, data.students]);
  const selectedClass = useMemo(() => selectedStudent ? data.classes.find(c => String(c.id) === String(selectedStudent.classId)) : null, [selectedStudent, data.classes]);
  const studentGrades = useMemo(() => (selectedStudent) ? calculateStudentGrades(selectedStudent, selectedClass, data.subjects, data.grades) : [], [selectedStudent, selectedClass, data.grades, data.subjects]);

  const handleDownload = async () => {
    if (!selectedStudent) return;
    setIsGenerating(true);
    try {
      const logo = await safeGetBase64(data.settings.schoolLogo || '');
      const doc = new jsPDF('p', 'mm', 'a4');
      drawNativeBulletin(doc, selectedStudent, selectedClass || undefined, studentGrades, data.settings, filterYear, logo);
      doc.save(`Boletim_${selectedStudent.name.replace(/\s+/g, '_')}.pdf`);
      
      // Marca como baixado
      setDownloadedIds(prev => new Set(prev).add(selectedStudent.id));
    } catch (e) {
      alert("Erro ao baixar PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black tracking-widest">SINCRONIZANDO...</div>;

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto pb-20 px-4">
      {isGenerating && (
        <div className="fixed inset-0 z-[100] bg-[#0A1128]/90 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6" />
          <p className="font-black uppercase tracking-widest text-sm">Gerando Arquivo...</p>
        </div>
      )}

      <div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Gerador de Boletins</h1>
        <p className="text-slate-500 font-medium">Fluxo assistido para geração individual de documentos oficiais.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar de Seleção */}
        <aside className="w-full lg:w-[350px] space-y-6 shrink-0 no-print">
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Filtrar</h3>
            <div className="grid grid-cols-2 gap-3">
              <select value={filterYear} onChange={e => {setFilterYear(e.target.value); setSelectedStudentId(null);}} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black">
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
              <select value={filterClassId} onChange={e => {setFilterClassId(e.target.value); setSelectedStudentId(null);}} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black">
                <option value="all">Todas</option>
                {yearClasses.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>
            <input type="text" placeholder="Buscar protagonista..." value={searchTerm} onChange={e => setOrderSearchTerm(e.target.value)} className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl text-xs font-bold outline-none" />
          </div>

          <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm max-h-[600px] overflow-y-auto custom-scrollbar space-y-2">
            {filteredStudents.map((std, idx) => (
              <button 
                key={std.id} 
                onClick={() => setSelectedStudentId(std.id)} 
                className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all text-left group ${selectedStudentId === std.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-50 hover:border-slate-200'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${selectedStudentId === std.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-black uppercase truncate tracking-tight leading-tight">{std.name}</p>
                  <p className={`text-[9px] font-bold uppercase mt-1 ${selectedStudentId === std.id ? 'text-indigo-200' : 'text-slate-400'}`}>RA: {std.registrationNumber}</p>
                </div>
                {downloadedIds.has(std.id) && (
                   <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${selectedStudentId === std.id ? 'bg-white text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>✓</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Visualização do Boletim com Navegação */}
        <main className="flex-1 w-full flex flex-col items-center">
          {selectedStudent ? (
            <div className="w-full max-w-[950px] space-y-6 flex flex-col items-center animate-in fade-in duration-500">
               
               {/* Barra de Navegação e Ações */}
               <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0A1128] p-5 rounded-[32px] shadow-2xl no-print">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handlePrev} 
                      disabled={currentIndex === 0}
                      className="w-12 h-12 rounded-2xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-20 flex items-center justify-center transition-all"
                    >
                      ←
                    </button>
                    <div className="px-6 py-2 bg-white/5 rounded-2xl text-center">
                       <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-1">Protagonista</p>
                       <p className="text-sm font-black text-white">{currentIndex + 1} de {filteredStudents.length}</p>
                    </div>
                    <button 
                      onClick={handleNext} 
                      disabled={currentIndex === filteredStudents.length - 1}
                      className="w-12 h-12 rounded-2xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-20 flex items-center justify-center transition-all"
                    >
                      →
                    </button>
                  </div>

                  <button 
                    onClick={handleDownload} 
                    disabled={isGenerating} 
                    className={`flex-1 md:flex-none px-12 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] ${
                      downloadedIds.has(selectedStudent.id) 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {downloadedIds.has(selectedStudent.id) ? 'Baixar Novamente (PDF)' : 'Gerar e Baixar PDF'}
                  </button>
               </div>

               {/* Preview em Tela do Boletim */}
               <div className="bg-white p-12 shadow-2xl border border-slate-100 rounded-[40px] w-full min-h-[900px] flex flex-col relative overflow-hidden origin-top scale-[0.9] md:scale-100">
                  {downloadedIds.has(selectedStudent.id) && (
                    <div className="absolute top-10 right-10 -rotate-12 border-4 border-emerald-500/20 px-4 py-1 rounded-xl text-emerald-500 font-black text-sm uppercase tracking-widest no-print">
                      Gerado ✓
                    </div>
                  )}

                  <div className="flex justify-between items-center border-b border-slate-50 pb-10 mb-10">
                     <div className="flex items-center gap-8">
                        {data.settings.schoolLogo && (
                            <img src={data.settings.schoolLogo} alt="Logo" className="w-20 h-20 object-contain p-1 border border-slate-50 rounded-2xl" />
                        )}
                        <div>
                          <h2 className="text-3xl font-black text-[#0A1128] tracking-tight">Boletim Escolar</h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Rendimento Acadêmico</p>
                        </div>
                     </div>
                     <span className="text-6xl font-black text-slate-100">{filterYear}</span>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 mb-10 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Protagonista</p>
                        <p className="text-2xl font-black text-[#0A1128] uppercase truncate">{selectedStudent.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Matrícula: {selectedStudent.registrationNumber}</p>
                      </div>
                      <div className="text-right border-l border-slate-200 pl-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Turma</p>
                        <p className="text-2xl font-black text-indigo-600 uppercase">{selectedClass?.name || '---'}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Modalidade: {selectedClass?.enrollmentType || '---'}</p>
                      </div>
                  </div>

                  <div className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                      <table className="w-full text-center border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                              <th className="p-4 text-left">Disciplina</th>
                              <th className="p-4">1ºB</th>
                              <th className="p-4">2ºB</th>
                              <th className="p-4">3ºB</th>
                              <th className="p-4">4ºB</th>
                              <th className="p-4 bg-slate-50 text-slate-600">M.G</th>
                              <th className="p-4 bg-indigo-50 text-indigo-700">M.F</th>
                              <th className="p-4">Desempenho</th>
                              <th className="p-4">Situação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-[10px]">
                            {studentGrades.map((g, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 text-left font-black text-slate-700 uppercase tracking-tight">{g.subject.name}</td>
                                <td className="p-4 text-slate-400 font-bold">{formatValue(g.b1)}</td>
                                <td className="p-4 text-slate-400 font-bold">{formatValue(g.b2)}</td>
                                <td className="p-4 text-slate-400 font-bold">{formatValue(g.b3)}</td>
                                <td className="p-4 text-slate-400 font-bold">{formatValue(g.b4)}</td>
                                <td className="p-4 bg-slate-50/50 font-bold text-slate-500">{formatValue(g.mg)}</td>
                                <td className="p-4 font-black text-indigo-600 bg-indigo-50/30 text-xs">{formatValue(g.mf)}</td>
                                <td className="p-4 font-bold uppercase text-[9px] text-slate-500">{g.performanceLabel}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg uppercase font-black text-[8px] border shadow-sm ${
                                        g.situationLabel === 'Aprovado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        g.situationLabel === 'Reprovado' ? 'bg-red-50 text-red-600 border-red-100' :
                                        'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}>
                                        {g.situationLabel}
                                    </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="mt-auto pt-10 flex justify-between items-center text-[10px] font-black text-slate-300 uppercase tracking-widest border-t border-slate-50">
                      <p>SISTEMA ESCOLAR INTEGRADO - SEI</p>
                      <p>DOCUMENTO GERADO EM {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
               </div>
            </div>
          ) : (
            <div className="py-48 text-center opacity-30 flex flex-col items-center select-none">
              <div className="text-9xl mb-8">📑</div>
              <h3 className="text-xl font-black uppercase tracking-[0.4em] text-slate-400">Fluxo de Geração</h3>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Selecione um protagonista na lateral para começar o fluxo</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Reports;
