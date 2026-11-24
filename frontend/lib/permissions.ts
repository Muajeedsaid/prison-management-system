import { Role } from './types';

/**
 * Which roles may do what. This only decides what the SCREEN shows.
 * The real protection is in the backend (@Roles() guards), so hiding a button here is a
 * convenience for staff, never the security. Keep this list in step with the backend controllers.
 */
const RULES = {
  readInmates: ['controller', 'records', 'cell', 'medical', 'court', 'visitor_desk'],
  createInmate: ['records'],
  editInmate: ['records'],
  archiveInmate: ['controller'],
  viewCases: ['controller', 'records', 'court'],
  createCase: ['records', 'court'],
  updateCase: ['court'],
  viewVisits: ['visitor_desk', 'controller'],
  createVisit: ['visitor_desk'],
  viewMedical: ['medical', 'controller'],
  createMedical: ['medical'],
  viewIncidents: ['cell', 'controller'],
  createIncident: ['cell'],
  viewCells: ['controller', 'cell'],
  manageCells: ['controller'],
  transfer: ['cell'],
  release: ['controller'],
  viewReports: ['controller'],
  manageUsers: ['admin'],
  viewAudit: ['admin'],
} satisfies Record<string, Role[]>;

export type Permission = keyof typeof RULES;

export function can(role: Role | undefined, permission: Permission): boolean {
  return !!role && (RULES[permission] as Role[]).includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'System Admin',
  controller: 'Facility Controller',
  records: 'Records Officer',
  cell: 'Cell Officer',
  medical: 'Medical Officer',
  court: 'Court Liaison',
  visitor_desk: 'Visitor Desk Officer',
};
