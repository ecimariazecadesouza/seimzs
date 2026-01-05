
import { GoogleGenAI } from "@google/genai";

export const analyzeGrades = async (studentName: string, subjectName: string, grades: (number | undefined)[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Configuração de IA pendente.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const validGrades = grades.filter((g): g is number => g !== undefined);
  const avg = validGrades.length > 0 ? validGrades.reduce((a, b) => a + b, 0) / validGrades.length : 0;
  
  const prompt = `Aja como um coordenador pedagógico. Analise o desempenho do aluno ${studentName} na disciplina de ${subjectName}. 
  Notas bimestrais: ${validGrades.join(', ')}. Média final: ${avg.toFixed(1)}. 
  Escreva um parecer curto (máximo 250 caracteres) encorajador e direto em português.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Sem análise disponível no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "O sistema de IA está processando outros dados. Tente novamente em breve.";
  }
};
