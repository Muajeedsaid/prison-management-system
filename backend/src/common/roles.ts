export enum Role {
  ADMIN = 'admin',
  CONTROLLER = 'controller',
  RECORDS = 'records',
  CELL = 'cell',
  MEDICAL = 'medical',
  COURT = 'court',
  VISITOR_DESK = 'visitor_desk',
}

export const ALL_ROLES = Object.values(Role);

/** Roles that may look inmates up (needed to add cases, visits, medical notes, etc.). */
export const INMATE_READERS = [
  Role.CONTROLLER,
  Role.RECORDS,
  Role.CELL,
  Role.MEDICAL,
  Role.COURT,
  Role.VISITOR_DESK,
];
