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

export interface UploadedDocument {
  id: string;
  name: string;
  type: string; // e.g. "CV/Resume", "Cover Letter", "Academic Transcript", "Experience Letter", "NID/Passport", "Certificates", "Portfolio/Other"
  content: string; // Base64 data URL
  fileType: string; // MIME type
  size: number; // File size in bytes
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
  documents?: UploadedDocument[];
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
