export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'VALIDATED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignee?: string;
  assignedEmployeeUsername?: string; // Propriété réelle utilisée
  dueDate?: string; 
  tags?: string[];
  code?: string;
  estimatedTime?: string; 
  workedTimeHours?: number;
  startTime?: string; 
  endTime?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface TimeLog {
  date: string;
  duration: number;
  description?: string;
}


