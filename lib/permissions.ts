
import { UserRole } from '../types';

/**
 * Definição central de quem pode acessar o quê.
 * Se você criar um menu novo, adicione a rota aqui e defina os cargos.
 */
export const MENU_PERMISSIONS: Record<string, UserRole[]> = {
  '/': ['admin_ti', 'admin_dir', 'coord', 'prof', 'sec'],
  '/curriculum': ['admin_ti', 'admin_dir', 'coord'],
  '/subjects': ['admin_ti', 'admin_dir', 'coord'],
  '/classes': ['admin_ti', 'admin_dir', 'coord', 'sec'],
  '/teachers': ['admin_ti', 'admin_dir', 'coord'],
  '/students': ['admin_ti', 'admin_dir', 'coord', 'prof', 'sec'],
  '/grades': ['admin_ti', 'admin_dir', 'coord', 'prof', 'sec'],
  '/council': ['admin_ti', 'admin_dir', 'coord', 'prof'],
  '/analytics': ['admin_ti', 'admin_dir', 'coord'],
  '/reports': ['admin_ti', 'admin_dir', 'coord', 'prof', 'sec'],
  '/users': ['admin_ti'],
  '/settings': ['admin_ti', 'admin_dir', 'coord', 'prof', 'sec'],
};

/**
 * Verifica se um cargo específico tem acesso a uma rota
 */
export const hasPermission = (role: UserRole, path: string): boolean => {
  const allowedRoles = MENU_PERMISSIONS[path];
  if (!allowedRoles) return true; // Se não estiver no mapa, é público para logados
  return allowedRoles.includes(role);
};
