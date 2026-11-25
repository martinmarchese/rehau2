import {
  Opportunity,
  StageId,
  Department,
  FollowUpAction
} from './workflowData';

export const KANBAN_STAGES: {
  id: StageId;
  name: string;
  department: Department;
  accent: 'magenta' | 'teal' | 'anthracite';
}[] = [
  { id: 1, name: 'Oportunidades', department: 'SALES Department', accent: 'magenta' },
  { id: 2, name: 'Pre-Circa', department: 'Ingeniería', accent: 'teal' },
  { id: 3, name: 'CIRCA', department: 'Ingeniería', accent: 'teal' },
  { id: 4, name: 'RENTA', department: 'SALES Department', accent: 'magenta' },
  { id: 5, name: 'Cotización', department: 'SALES Department', accent: 'magenta' },
  { id: 6, name: 'YES / NO', department: 'Customers', accent: 'anthracite' },
  { id: 7, name: 'HR / FIN', department: 'Controlling', accent: 'anthracite' }
];
