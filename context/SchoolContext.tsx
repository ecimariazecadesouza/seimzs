
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  SchoolData, Student, Teacher, Subject, Class, 
  Assignment, Grade, FormationType, KnowledgeArea, SubArea, SchoolSettings, AppUser, UserRole
} from '../types';

const DEFAULT_SCHOOL_LOGO = 'https://i.postimg.cc/1tVz9RY5/Logo-da-Escola-v5-ECIT.png';
const DEFAULT_SYSTEM_LOGO = 'https://i.postimg.cc/Dwznvy86/SEI-V02.png';

export const formatImageUrl = (url: string | null): string => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  return url;
};

const toCamel = (obj: any) => {
  if (!obj) return obj;
  const newObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/([-_][a-z])/g, group =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
    newObj[camelKey] = obj[key];
  }
  return newObj;
};

const toSnake = (obj: any) => {
  if (!obj) return obj;
  const newObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    newObj[snakeKey] = obj[key];
  }
  return newObj;
};

const TABLE_MAP: Record<string, string> = {
  students: 'students',
  teachers: 'teachers',
  subjects: 'subjects',
  classes: 'classes',
  assignments: 'assignments',
  grades: 'grades',
  formations: 'formations',
  knowledgeAreas: 'knowledge_areas',
  subAreas: 'sub_areas',
  settings: 'settings',
  users: 'users'
};

export interface SchoolContextType {
  data: SchoolData;
  loading: boolean;
  dbError: string | null;
  currentUser: AppUser | null;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (name: string) => Promise<void>;
  fetchData: () => Promise<void>;
  addStudent: (s: any) => Promise<void>;
  updateStudent: (id: string, s: any) => Promise<void>;
  addTeacher: (t: any) => Promise<void>;
  updateTeacher: (id: string, t: any) => Promise<void>;
  addSubject: (s: any) => Promise<void>;
  updateSubject: (id: string, s: any) => Promise<void>;
  addClass: (c: any) => Promise<void>;
  updateClass: (id: string, c: any) => Promise<void>;
  addFormation: (f: any) => Promise<void>;
  updateFormation: (id: string, f: any) => Promise<void>;
  addKnowledgeArea: (a: any) => Promise<void>;
  updateKnowledgeArea: (id: string, a: any) => Promise<void>;
  addSubArea: (s: any) => Promise<void>;
  updateSubArea: (id: string, s: Partial<SubArea>) => Promise<void>;
  assignTeacher: (a: any) => Promise<void>;
  updateGrade: (g: any) => Promise<void>;
  bulkUpdateGrades: (grades: any[]) => Promise<void>;
  deleteItem: (type: keyof SchoolData, id: string) => Promise<void>;
  updateSettings: (s: Partial<SchoolSettings>) => Promise<void>;
  addUser: (u: Omit<AppUser, 'id'>) => Promise<void>;
  createFirstAdmin: (u: { name: string, email: string }) => Promise<void>;
  refreshData: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('sei_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [data, setData] = useState<SchoolData>({
    students: [], teachers: [], subjects: [], classes: [],
    assignments: [], grades: [], formations: [], knowledgeAreas: [], subAreas: [],
    users: [],
    settings: {
      schoolLogo: localStorage.getItem('sei_school_logo') || DEFAULT_SCHOOL_LOGO,
      systemLogo: localStorage.getItem('sei_system_logo') || DEFAULT_SYSTEM_LOGO,
      schoolName: localStorage.getItem('sei_school_name') || 'Sistema Escolar Integrado - SEI'
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    const newData: any = { ...data };
    const tables = Object.entries(TABLE_MAP);

    try {
      const results = await Promise.allSettled(
        tables.map(async ([stateKey, tableName]) => {
          const { data: resData, error } = await supabase.from(tableName).select('*');
          if (error) {
            if (error.code === 'PGRST116' || error.message.includes('not found')) {
               throw new Error(`Tabela '${tableName}' não encontrada.`);
            }
            throw error;
          }
          return { stateKey, data: resData };
        })
      );

      let foundCriticalError = false;
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { stateKey, data: resData } = result.value;
          const items = (resData || []).map(toCamel);
          if (stateKey === 'settings' && items.length > 0) {
            newData.settings = items[0];
          } else {
            newData[stateKey] = items;
          }
        } else {
          const error = result.reason as any;
          if (error.message.includes('users')) {
            setDbError('MISSING_USERS_TABLE');
            foundCriticalError = true;
          }
        }
      });

      if (!foundCriticalError) {
        setData(newData);
      }
    } catch (error: any) {
      if (error.message.includes('users')) setDbError('MISSING_USERS_TABLE');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const login = async (email: string): Promise<boolean> => {
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('sei_session', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const updateProfile = async (name: string) => {
    if (!currentUser) return;
    const formattedName = name.trim().toUpperCase();
    const { error } = await supabase.from('users').update({ name: formattedName }).eq('id', currentUser.id);
    if (error) throw error;
    
    const updatedUser = { ...currentUser, name: formattedName };
    setCurrentUser(updatedUser);
    localStorage.setItem('sei_session', JSON.stringify(updatedUser));
    
    // Atualiza também na lista local
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === currentUser.id ? updatedUser : u)
    }));
  };

  const createFirstAdmin = async (u: { name: string, email: string }) => {
    const payload = { ...u, role: 'admin_ti' as UserRole };
    const { data: res, error } = await supabase.from('users').insert([toSnake(payload)]).select();
    if (error) throw error;
    if (res) {
      const newUser = toCamel(res[0]);
      setData(prev => ({ ...prev, users: [newUser] }));
      setCurrentUser(newUser);
      localStorage.setItem('sei_session', JSON.stringify(newUser));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sei_session');
  };

  const updateSettings = async (s: Partial<SchoolSettings>) => {
    const newSettings = { ...data.settings, ...s };
    setData(prev => ({ ...prev, settings: newSettings }));
    try {
      await supabase.from('settings').upsert({ id: 1, ...toSnake(newSettings) });
    } catch (e) {}
  };

  const genericAdd = async (tableKey: keyof SchoolData, item: any) => {
    const { data: res, error } = await supabase.from(TABLE_MAP[tableKey]).insert([toSnake(item)]).select();
    if (error) throw error;
    if (res) setData(prev => ({ ...prev, [tableKey]: [...(prev[tableKey] as any[]), toCamel(res[0])] }));
  };

  const genericUpdate = async (tableKey: keyof SchoolData, id: string, item: any) => {
    const { error } = await supabase.from(TABLE_MAP[tableKey]).update(toSnake(item)).eq('id', id);
    if (error) throw error;
    setData(prev => ({
      ...prev,
      [tableKey]: (prev[tableKey] as any[]).map(i => i.id === id ? { ...i, ...item } : i)
    }));
  };

  const addStudent = (s: any) => genericAdd('students', { ...s, registrationNumber: `RA${new Date().getFullYear()}${Math.floor(Math.random() * 1000000)}` });
  const updateStudent = (id: string, s: any) => genericUpdate('students', id, s);
  const addTeacher = (t: any) => genericAdd('teachers', t);
  const updateTeacher = (id: string, t: any) => genericUpdate('teachers', id, t);
  const addSubject = (s: any) => genericAdd('subjects', s);
  const updateSubject = (id: string, s: any) => genericUpdate('subjects', id, s);
  const addClass = (c: any) => genericAdd('classes', c);
  const updateClass = (id: string, c: any) => genericUpdate('classes', id, c);
  const addFormation = (f: any) => genericAdd('formations', f);
  const updateFormation = (id: string, f: any) => genericUpdate('formations', id, f);
  const addKnowledgeArea = (a: any) => genericAdd('knowledgeAreas', a);
  const updateKnowledgeArea = (id: string, a: any) => genericUpdate('knowledgeAreas', id, a);
  const addSubArea = (s: any) => genericAdd('subAreas', s);
  const updateSubArea = (id: string, s: Partial<SubArea>) => genericUpdate('subAreas', id, s);
  const assignTeacher = (a: any) => genericAdd('assignments', a);
  const addUser = (u: any) => genericAdd('users', u);

  const updateGrade = async (g: any) => {
    await supabase.from('grades').upsert(toSnake(g), { onConflict: 'student_id, subject_id, term' });
    await fetchData();
  };

  const bulkUpdateGrades = async (grades: any[]) => {
    await supabase.from('grades').upsert(grades.map(toSnake), { onConflict: 'student_id, subject_id, term' });
    await fetchData();
  };

  const deleteItem = async (type: keyof SchoolData, id: string) => {
    await supabase.from(TABLE_MAP[type]).delete().eq('id', id);
    setData(prev => ({ ...prev, [type]: (prev[type] as any[]).filter(i => i.id !== id) }));
  };

  const value = useMemo(() => ({
    data, loading, dbError, currentUser, login, logout, updateProfile, fetchData,
    addStudent, updateStudent, addTeacher, updateTeacher,
    addSubject, updateSubject, addClass, updateClass,
    addFormation, updateFormation, addKnowledgeArea, updateKnowledgeArea,
    addSubArea, updateSubArea, assignTeacher, updateGrade, bulkUpdateGrades, 
    deleteItem, updateSettings, addUser, createFirstAdmin,
    refreshData: fetchData
  }), [data, loading, dbError, currentUser]);

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (context === undefined) throw new Error('useSchool deve ser usado dentro de um SchoolProvider');
  return context;
};
