export type JobType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Remote' | 'Internship';
export type ApplicationStatus = 'Applied' | 'Screening' | 'Interviewing' | 'Offered' | 'Rejected';

export interface JobPost {
  id: string;
  title: string;
  category: string;
  department: string;
  companyName: string;
  location: string;
  type: JobType;
  salaryRange: string;
  description: string;
  requirements: string[];
  benefits: string[];
  createdAt: string;
  status: 'Active' | 'Closed';
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  employeeName: string;
  employeeEmail: string;
  employeeId: string;
  currentRole: string;
  cvName: string;
  cvContent?: string; // Base64 or text contents
  documentName?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  appliedAt: string;
  adminNotes?: string;
  aiScore?: number; // 0-100 Gemini evaluation score
  aiAnalysis?: string; // Gemini resume evaluation summary
}

export interface Notification {
  id: string;
  employeeEmail: string;
  jobTitle: string;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
  read: boolean;
}

export interface User {
  email: string;
  name: string;
  role: 'Admin' | 'Employee';
  employeeId: string;
  currentRole: string;
}
