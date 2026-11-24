export type Role = 'admin' | 'controller' | 'records' | 'cell' | 'medical' | 'court' | 'visitor_desk';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface StaffUser {
  _id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CellRef {
  _id: string;
  name: string;
  block: string;
  capacity?: number;
}

export interface Cell extends CellRef {
  capacity: number;
  isActive: boolean;
  occupied: number;
  available: number;
}

export type InmateStatus = 'awaiting-trial' | 'convicted' | 'released' | 'transferred-out';

export interface Inmate {
  _id: string;
  inmateNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  status: InmateStatus;
  admissionDate: string;
  sentenceMonths?: number;
  expectedReleaseDate?: string;
  actualReleaseDate?: string;
  cell?: CellRef | null;
  nextOfKin?: { name: string; phone: string; relationship?: string };
}

export interface CaseRecord {
  _id: string;
  caseNumber: string;
  charges: string[];
  court?: string;
  nextCourtDate?: string;
  status: 'open' | 'adjourned' | 'closed';
  bail?: { granted: boolean; amount?: number };
  judgment?: string;
  sentenceMonths?: number;
  inmate?: { _id: string; inmateNumber: string; fullName: string };
}

export interface Visit {
  _id: string;
  visitorName: string;
  visitorPhone?: string;
  relationship?: string;
  visitDate: string;
  durationMinutes?: number;
  status: 'scheduled' | 'completed' | 'denied' | 'cancelled';
  notes?: string;
}

export interface MedicalRecord {
  _id: string;
  type: 'check-up' | 'treatment' | 'referral' | 'emergency';
  diagnosis: string;
  treatment?: string;
  notes?: string;
  recordedAt: string;
  recordedBy?: { fullName: string };
}

export interface Incident {
  _id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  actionTaken?: string;
  occurredAt: string;
  reportedBy?: { fullName: string };
}

export interface Transfer {
  _id: string;
  fromCell?: CellRef | null;
  toCell: CellRef;
  reason?: string;
  createdAt: string;
  transferredBy?: { fullName: string };
}

export interface AuditEntry {
  _id: string;
  userEmail?: string;
  role?: string;
  method: string;
  path: string;
  statusCode: number;
  ip?: string;
  createdAt: string;
}

export interface Summary {
  totalInmates: number;
  inCustody: number;
  byStatus: Record<string, number>;
  admissionsByMonth: { month: string; count: number }[];
  occupancy: { totalCapacity: number; occupied: number; occupancyRate: number };
  upcomingReleases: { _id: string; inmateNumber: string; fullName: string; expectedReleaseDate: string }[];
  upcomingCourtDates: CaseRecord[];
}
