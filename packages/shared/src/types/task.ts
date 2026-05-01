export interface TaskItem {
  id: string;
  type: 'ar' | 'ot';
  description: string;
  responsible: string;
  deadline?: string | undefined;
  days?: string | undefined;
  status: string;
  docId: string;
  docTitle: string;
  projectId: string;
  projectName: string;
  clientName: string;
  createdAt: string;
}
