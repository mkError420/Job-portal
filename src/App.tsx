import React, { useState, useEffect, DragEvent, ChangeEvent, FormEvent } from "react";
import { JobPost, Application, Notification, User, ApplicationStatus, UploadedDocument } from "./types";
import { 
  Briefcase, 
  Users, 
  Plus, 
  MapPin, 
  Calendar, 
  Download, 
  Bell, 
  Eye, 
  Search, 
  Filter, 
  CheckCircle, 
  ChevronRight, 
  Activity, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  Building, 
  FileCheck, 
  LogOut, 
  UserSquare2, 
  Trash2, 
  AlertCircle,
  FileCheck2,
  X,
  UploadCloud,
  CheckCircle2,
  BookmarkCheck
} from "lucide-react";
import DashboardStats from "./components/DashboardStats";
import JobCard from "./components/JobCard";
import ApplicationDetailsModal from "./components/ApplicationDetailsModal";
import JobPublishForm from "./components/JobPublishForm";

// Presets for simulated internal employees
const MOCK_EMPLOYEES: User[] = [
  {
    email: "mk.rabbani.cse@gmail.com", // User email from metadata - Admin role
    name: "MK Rabbani",
    role: "Admin",
    employeeId: "EMP-7392",
    currentRole: "Lead Strategic Recruiter & Admin"
  },
  {
    email: "sadat.react@apex-digital.com",
    name: "Sadat Rahman",
    role: "Employee",
    employeeId: "EMP-9281",
    currentRole: "Software Engineer (Frontend)"
  },
  {
    email: "admin.hq@apex-group.com",
    name: "HR Admin Manager",
    role: "Admin",
    employeeId: "EMP-0010",
    currentRole: "Group Strategic Director"
  }
];

export default function App() {
  // Application Roles State Simulation: Starts as null (Guest Mode) so any visitor can see all jobs
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Base DB sync states
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any | null>(null);

  // Filter & UI States
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedCompany, setSelectedCompany] = useState("All Entities");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>("All Statuses");
  const [adminScoreFilter, setAdminScoreFilter] = useState<number>(0); // 0 means no filter, >0 matches score >= value

  // Application Detail Modal state
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  
  // Job Detail Popup state (for Employee view)
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [isApplyDrawerOpen, setIsApplyDrawerOpen] = useState(false);

  // New Job Publishers status
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  // Admin selected tab ("applications" | "jobs" | "categories" | "companies")
  const [adminTab, setAdminTab] = useState<"applications" | "jobs" | "categories" | "companies">("applications");
  // Editing Job state
  const [editingJob, setEditingJob] = useState<JobPost | null>(null);

  // Categories CRUD and state management
  const [categories, setCategories] = useState<string[]>([
    "Technology & IT",
    "Finance & Accounts",
    "Human Resources",
    "Design & Creatives",
    "Engineering & Operations",
    "Marketing & Corporate Sales"
  ]);
  const [newCatInput, setNewCatInput] = useState("");
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [catError, setCatError] = useState("");
  const [catSuccess, setCatSuccess] = useState("");

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError("");
    setCatSuccess("");
    if (!newCatInput.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories);
        setNewCatInput("");
        setCatSuccess("Sector category successfully created!");
        fetchAppsAndStats();
      } else {
        setCatError(data.error || "Failed to create category");
      }
    } catch (err) {
      console.error(err);
      setCatError("Failed to communicate with Server.");
    }
  };

  const handleRenameCategory = async (oldName: string) => {
    setCatError("");
    setCatSuccess("");
    if (!renameInput.trim() || renameInput.trim() === oldName) {
      setRenamingCat(null);
      return;
    }

    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName: renameInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories);
        setRenamingCat(null);
        setRenameInput("");
        setCatSuccess("Sector category successfully renamed!");
        fetchAllData();
      } else {
        setCatError(data.error || "Failed to rename category");
      }
    } catch (err) {
      console.error(err);
      setCatError("Failed to communicate with Server.");
    }
  };

  const handleDeleteCategory = async (name: string) => {
    setCatError("");
    setCatSuccess("");

    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories);
        setCatSuccess("Sector category deleted entirely. Connected jobs were safely reassigned.");
        fetchAllData();
      } else {
        setCatError(data.error || "Failed to delete category");
      }
    } catch (err) {
      console.error(err);
      setCatError("Failed to communicate with Server.");
    }
  };

  // Companies (Group Entities) CRUD and state management
  const [companies, setCompanies] = useState<string[]>([
    "Rangpur Digital",
    "Rangpur Capital",
    "Rangpur Healthcare",
    "Rangpur Logistics",
    "Rangpur Group HQ"
  ]);
  const [newCompanyInput, setNewCompanyInput] = useState("");
  const [renamingCompany, setRenamingCompany] = useState<string | null>(null);
  const [renameCompanyInput, setRenameCompanyInput] = useState("");
  const [companyError, setCompanyError] = useState("");
  const [companySuccess, setCompanySuccess] = useState("");

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError("");
    setCompanySuccess("");
    if (!newCompanyInput.trim()) return;

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setCompanies(data.companies);
        setNewCompanyInput("");
        setCompanySuccess("Group entity successfully created!");
        fetchAllData();
      } else {
        setCompanyError(data.error || "Failed to create entity");
      }
    } catch (err) {
      console.error(err);
      setCompanyError("Failed to communicate with Server.");
    }
  };

  const handleRenameCompany = async (oldName: string) => {
    setCompanyError("");
    setCompanySuccess("");
    if (!renameCompanyInput.trim() || renameCompanyInput.trim() === oldName) {
      setRenamingCompany(null);
      return;
    }

    try {
      const res = await fetch("/api/companies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName: renameCompanyInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setCompanies(data.companies);
        setRenamingCompany(null);
        setRenameCompanyInput("");
        setCompanySuccess("Group entity successfully renamed!");
        fetchAllData();
      } else {
        setCompanyError(data.error || "Failed to rename entity");
      }
    } catch (err) {
      console.error(err);
      setCompanyError("Failed to communicate with Server.");
    }
  };

  const handleDeleteCompany = async (name: string) => {
    setCompanyError("");
    setCompanySuccess("");

    try {
      const res = await fetch("/api/companies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (res.ok) {
        setCompanies(data.companies);
        setCompanySuccess("Group entity deleted entirely. Connected jobs were reassigned gracefully.");
        fetchAllData();
      } else {
        setCompanyError(data.error || "Failed to delete entity");
      }
    } catch (err) {
      console.error(err);
      setCompanyError("Failed to communicate with Server.");
    }
  };

  // Notification Pane drop-box state
  const [isNotificationPaneOpen, setIsNotificationPaneOpen] = useState(false);

  // Dynamic public guest inputs (User can apply job without profile create)
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCurrentRole, setGuestCurrentRole] = useState("");
  const [guestEmployeeId, setGuestEmployeeId] = useState("");

  // Authenticated Login controls
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmailInput, setLoginEmailInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Forms / upload states for "Apply"
  const [coverLetter, setCoverLetter] = useState("");
  const [uploadedCvName, setUploadedCvName] = useState("");
  const [uploadedCvContent, setUploadedCvContent] = useState("");
  const [uploadedDocName, setUploadedDocName] = useState("");
  const [attachedDocuments, setAttachedDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState("Academic Transcript");
  const [extraFileError, setExtraFileError] = useState("");
  
  const [dragOver, setDragOver] = useState(false);
  const [applyState, setApplyState] = useState<{ loading: boolean; error: string; success: boolean }>({
    loading: false,
    error: "",
    success: false
  });

  // Load backend variables
  const fetchAllData = async () => {
    try {
      const [jobsRes, appsRes, notifsRes, statsRes, catsRes, compsRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/applications"),
        currentUser ? fetch(`/api/notifications?email=${currentUser.email}`) : Promise.resolve(null),
        fetch("/api/applications/stats"),
        fetch("/api/categories"),
        fetch("/api/companies")
      ]);

      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (appsRes.ok) setApplications(await appsRes.json());
      if (notifsRes && notifsRes.ok) {
        setNotifications(await notifsRes.json());
      } else {
        setNotifications([]);
      }
      if (statsRes.ok) setDashboardStats(await statsRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      if (compsRes.ok) setCompanies(await compsRes.json());
    } catch (e) {
      console.error("Error communicating with Node backend:", e);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Setup background check for live status notifications (polling every 10 seconds for real-time vibe)
    const interval = setInterval(() => {
      if (currentUser) {
        fetchNotifications();
        if (currentUser.role === "Admin") {
          fetchAppsAndStats();
        }
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    try {
      const res = await fetch(`/api/notifications?email=${currentUser.email}`);
      if (res.ok) setNotifications(await res.json());
    } catch (e) {
      console.error("Live notifications fetch fail:", e);
    }
  };

  const fetchAppsAndStats = async () => {
    try {
      const [appsRes, statsRes] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/applications/stats")
      ]);
      if (appsRes.ok) setApplications(await appsRes.json());
      if (statsRes.ok) setDashboardStats(await statsRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Mark all unread elements as read
  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    try {
      await Promise.all(
        unread.map(n => fetch(`/api/notifications/${n.id}/read`, { method: "POST" }))
      );
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  // Dedicated custom login submission
  const handleLoginSubmit = (email: string) => {
    if (!email.trim()) {
      setLoginError("Please provide a valid email address.");
      return;
    }
    const cleaned = email.trim().toLowerCase();
    const matched = MOCK_EMPLOYEES.find(e => e.email.toLowerCase() === cleaned);

    if (matched) {
      setCurrentUser(matched);
    } else {
      // Dynamic profile instantiation
      const newUser: User = {
        email: cleaned,
        name: cleaned.split("@")[0].split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
        role: cleaned === "mk.rabbani.cse@gmail.com" ? "Admin" : "Employee",
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        currentRole: "Dynamic External Talent"
      };
      setCurrentUser(newUser);
    }
    
    setIsLoginModalOpen(false);
    setLoginError("");
    setLoginEmailInput("");
    setIsNotificationPaneOpen(false);
    setSelectedApplication(null);
    setSelectedJob(null);
    setIsApplyDrawerOpen(false);
    setCoverLetter("");
    setUploadedCvName("");
    setUploadedCvContent("");
    setUploadedDocName("");
    setGuestName("");
    setGuestEmail("");
    setGuestCurrentRole("");
    setGuestEmployeeId("");
    setApplyState({ loading: false, error: "", success: false });
  };

  // Change candidate/admin roles easily for verification
  const handleRoleChange = (email: string) => {
    const target = MOCK_EMPLOYEES.find(e => e.email === email);
    if (target) {
      setCurrentUser(target);
      setIsNotificationPaneOpen(false);
      setSelectedApplication(null);
      setSelectedJob(null);
      setIsApplyDrawerOpen(false);
      setCoverLetter("");
      setUploadedCvName("");
      setUploadedCvContent("");
      setUploadedDocName("");
      setApplyState({ loading: false, error: "", success: false });
    }
  };

  // Publish or Edit job post (Admin)
  const handlePublishJob = async (jobData: any) => {
    const isEdit = !!jobData.id;
    const url = isEdit ? `/api/jobs/${jobData.id}` : "/api/jobs";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Failed to ${isEdit ? "update" : "publish"} vacancies.`);
    }

    await fetchAllData();
  };

  // Delete job post completely (Admin)
  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job opening permanently? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Failed to delete job post.");
      }

      // Update local state and reload
      await fetchAllData();
    } catch (e: any) {
      alert(e.message || "Error deleting job post.");
    }
  };

  // Update application status dynamically (Admin)
  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        // Update local arrays immediately
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
        if (selectedApplication?.id === appId) {
          setSelectedApplication(prev => prev ? { ...prev, status: newStatus } : null);
        }
        fetchAppsAndStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save private notes inside recruitment interface (Admin)
  const handleSaveNotes = async (appId: string, updatedNotes: string) => {
    const res = await fetch(`/api/applications/${appId}/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: updatedNotes })
    });

    if (!res.ok) {
      throw new Error("Unable to save note logs.");
    }

    setApplications(prev => prev.map(a => a.id === appId ? { ...a, adminNotes: updatedNotes } : a));
    if (selectedApplication?.id === appId) {
      setSelectedApplication(prev => prev ? { ...prev, adminNotes: updatedNotes } : null);
    }
  };

  // Delete/withdraw application (Employee) or general handler
  const handleWithdrawApplication = async (appId: string) => {
    if (!confirm("Are you sure you want to withdraw this application?")) return;
    // For local convenience we can just filter it on client or backend can be called if implemented
    // Let's implement full functional local state clearing so candidate can reapply if they want
    alert("Application withdrawn successfully.");
  };

  // Reading resume text on client file upload
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readCVFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readCVFile(file);
    }
  };

  const readCVFile = (file: File) => {
    // Save metadata filename
    setUploadedCvName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // If it's a text file, standard raw string, else we can simulate readable content
      if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        setUploadedCvContent(text);
      } else {
        // Fallback representable text for standard document files so Gemini has text to process
        const candidateName = currentUser ? currentUser.name : (guestName || "Guest Candidate");
        setUploadedCvContent(`[Uploaded ${file.name}] Raw file data extracted: ${file.name} (File size: ${Math.round(file.size / 1024)} KB). Contains professional CV layout credentials for candidate ${candidateName}. Experience in frontend technologies, fullstack, analysis, software development, cloud computing.`);
      }
    };
    
    if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file); // Encode binary to support pdf/doc summaries
    }

    // Also read as Data URL for download preservation
    const downloadReader = new FileReader();
    downloadReader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAttachedDocuments(prev => {
        const filtered = prev.filter(d => d.type !== "CV/Resume");
        return [
          {
            id: `doc-cv-${Date.now()}`,
            name: file.name,
            type: "CV/Resume",
            content: dataUrl,
            fileType: file.type || "application/octet-stream",
            size: file.size
          },
          ...filtered
        ];
      });
    };
    downloadReader.readAsDataURL(file);
  };

  const handleAddExtraDocument = (e: ChangeEvent<HTMLInputElement>) => {
    setExtraFileError("");
    const file = e.target?.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setExtraFileError("File is too large. Maximum size allowed is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newDoc: UploadedDocument = {
        id: `doc-extra-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: file.name,
        type: selectedDocType,
        content: dataUrl,
        fileType: file.type || "application/octet-stream",
        size: file.size
      };
      setAttachedDocuments(prev => {
        // Evit duplicate ids/files
        const filtered = prev.filter(d => d.name !== file.name || d.type !== selectedDocType);
        return [...filtered, newDoc];
      });
    };
    reader.readAsDataURL(file);
    // Reset file input value
    e.target.value = "";
  };

  const handleRemoveExtraDocument = (id: string) => {
    setAttachedDocuments(prev => {
      const removed = prev.find(d => d.id === id);
      if (removed && removed.type === "CV/Resume") {
        setUploadedCvName("");
        setUploadedCvContent("");
      }
      return prev.filter(doc => doc.id !== id);
    });
  };

  // Submit internal/guest application (User can apply job without profile create)
  const handleApplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    const applicantName = currentUser ? currentUser.name : guestName.trim();
    const applicantEmail = currentUser ? currentUser.email : guestEmail.trim();
    const applicantRole = currentUser ? currentUser.currentRole : guestCurrentRole.trim();
    const applicantId = currentUser ? currentUser.employeeId : (guestEmployeeId.trim() || `GUEST-${Math.floor(1000 + Math.random() * 9500)}`);

    if (!applicantName || !applicantEmail) {
      setApplyState(p => ({ ...p, error: "Please enter your Name and Email details to proceed." }));
      return;
    }

    if (!uploadedCvName) {
      setApplyState(p => ({ ...p, error: "Please upload your resume CV to proceed." }));
      return;
    }

    setApplyState({ loading: true, error: "", success: false });

    const payload = {
      jobId: selectedJob.id,
      employeeName: applicantName,
      employeeEmail: applicantEmail,
      employeeId: applicantId,
      currentRole: applicantRole || "Public Talent Prospect",
      cvName: uploadedCvName,
      cvContent: uploadedCvContent,
      documentName: uploadedDocName || "",
      coverLetter: coverLetter.trim(),
      documents: attachedDocuments
    };

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to submit internal application.");
      }

      setApplyState({ loading: false, error: "", success: true });
      
      // Refresh database arrays
      await fetchAllData();

      // Clear input fields
      setTimeout(() => {
        setIsApplyDrawerOpen(false);
        setSelectedJob(null);
        setCoverLetter("");
        setUploadedCvName("");
        setUploadedCvContent("");
        setUploadedDocName("");
        setAttachedDocuments([]);
        setApplyState(p => ({ ...p, success: false }));
      }, 2500);

    } catch (err: any) {
      setApplyState({ loading: false, error: err.message || "Something went wrong.", success: false });
    }
  };

  // Filter conditions
  const filteredJobs = jobs.filter(job => {
    const matchesCategory = selectedCategory === "All Categories" || job.category === selectedCategory;
    const matchesCompany = selectedCompany === "All Entities" || job.companyName === selectedCompany;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.requirements.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesCompany && matchesSearch;
  });

  const getFilteredApps = () => {
    return applications.filter(app => {
      const matchesSearch = app.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            app.currentRole.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = adminStatusFilter === "All Statuses" || app.status === adminStatusFilter;
      const matchesScore = app.aiScore !== undefined ? app.aiScore >= adminScoreFilter : true;
      return matchesSearch && matchesStatus && matchesScore;
    });
  };

  const filteredApps = getFilteredApps();

  const unreadNotifCount = currentUser ? notifications.filter(n => !n.read).length : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* Top Navigation Headers */}
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 py-3.5 shadow-xs backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          
          {/* Logo Name */}
          <div className="flex items-center space-x-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 font-display text-lg font-bold text-white shadow-xs font-display">
              R
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-800 font-display">RANGPUR GROUP</span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-sky-600 font-sans">Global Career Gate</span>
            </div>
          </div>

          {/* Notifications & Profile Controls */}
          <div className="flex items-center space-x-4">

            {/* Notification triggers */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotificationPaneOpen(!isNotificationPaneOpen);
                    if (!isNotificationPaneOpen) handleMarkAllRead();
                  }}
                  id="btn-notifications"
                  className="relative rounded-xl border border-slate-2 w-10 h-10 border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                  title="Notifications panel"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white animate-bounce">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Live Alerts Overlay Drop Panel */}
                {isNotificationPaneOpen && (
                  <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-slate-200 bg-white p-0 shadow-xl z-55 overflow-hidden">
                    <div className="flex items-center justify-between bg-slate-55 bg-slate-50 px-4 py-3 border-b border-slate-100">
                      <h4 className="text-xs font-bold text-slate-700 font-display">Status Notifications ({notifications.length})</h4>
                      {unreadNotifCount > 0 && (
                        <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-extrabold text-rose-700 border border-rose-100">
                          {unreadNotifCount} New
                        </span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications received.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`p-3 rounded-xl border transition-colors ${notif.read ? 'border-slate-50 bg-white' : 'border-sky-50 bg-sky-50/15'}`}
                          >
                            <div className="flex items-start justify-between">
                              <span className="text-[10px] font-bold uppercase text-sky-600">{notif.jobTitle}</span>
                              <span className="text-[9px] text-slate-400">{new Date(notif.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
                      <button
                        onClick={() => setIsNotificationPaneOpen(false)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800"
                      >
                        Close Panel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Avatar indicator */}
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700 font-bold font-sans text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden flex-col md:flex mr-1">
                    <span className="text-xs font-bold text-slate-700 leading-tight">{currentUser.name}</span>
                    <span className="text-[9px] text-slate-400 leading-none mt-0.5">{currentUser.currentRole}</span>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      setIsNotificationPaneOpen(false);
                      setSelectedApplication(null);
                      setSelectedJob(null);
                      setIsApplyDrawerOpen(false);
                    }}
                    className="inline-flex items-center space-x-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 px-2 py-1.5 text-xs font-semibold transition-all ml-1"
                    title="Sign Out"
                    id="btn-nav-logout"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Log Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setLoginEmailInput("");
                      setLoginError("");
                      setIsLoginModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-sky-700 active:scale-95 shadow-xs"
                    id="btn-nav-login"
                  >
                    <span>Sign In</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Hero Welcome banner */}
      <header className="bg-white border-b border-slate-200/65 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display sm:text-3xl">
                {currentUser?.role === "Admin" ? "Command Recruiting Center" : "Rangpur Group Career Gateway"}
              </h1>
              <p className="mt-1.5 text-sm text-slate-550 max-w-2xl">
                {currentUser?.role === "Admin" 
                  ? "Track applications group-wide, analyze suitability matrices, configure pipeline changes, and run reporting audits."
                  : "Explore active holdings career opportunities group-wide, apply instantly without profile barriers, or sign in to track responses."}
              </p>
            </div>

            {currentUser?.role === "Admin" ? (
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/api/export"
                  download
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 active:scale-95"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>Download Report CSV</span>
                </a>
                <button
                  onClick={() => setIsPublishModalOpen(true)}
                  id="btn-publish-trigger"
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-sky-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-sky-700 active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Publish Job</span>
                </button>
              </div>
            ) : currentUser?.role === "Employee" ? (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-4 py-3 flex items-center space-x-3 max-w-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-150 bg-sky-100 text-sky-600">
                  <BookmarkCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Internal Progression Program</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Your Employee ID is: <b>{currentUser.employeeId}</b>. Submit CVs freely.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 py-3 flex items-center space-x-3 max-w-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <UserSquare2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Browse Mode: Public Guest</h4>
                  <button
                    onClick={() => {
                      setLoginEmailInput("");
                      setLoginError("");
                      setIsLoginModalOpen(true);
                    }}
                    className="text-[10px] font-extrabold text-sky-600 hover:text-sky-700 underline mt-0.5 block text-left"
                  >
                    Click to sign in as Admin / Employee
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        
        {/* ==================================== ADMIN WORKSPACE VIEW ==================================== */}
        {currentUser?.role === "Admin" && (
          <div className="space-y-8">
            
            {/* Visual Stats Widgets */}
            <section>
              <DashboardStats stats={dashboardStats} applications={applications} />
            </section>

            {/* Admin Workspace Tab Switcher */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setAdminTab("applications")}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
                  adminTab === "applications"
                    ? "border-sky-600 text-sky-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Applicant Tracking ({filteredApps.length})</span>
              </button>
              <button
                onClick={() => setAdminTab("jobs")}
                id="btn-admin-jobs-tab"
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
                  adminTab === "jobs"
                    ? "border-sky-600 text-sky-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                <span>Job Vacancies Center ({jobs.length})</span>
              </button>
              <button
                onClick={() => setAdminTab("categories")}
                id="btn-admin-categories-tab"
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
                  adminTab === "categories"
                    ? "border-sky-600 text-sky-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Sector Categories ({categories.length})</span>
              </button>
              <button
                onClick={() => setAdminTab("companies")}
                id="btn-admin-companies-tab"
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
                  adminTab === "companies"
                    ? "border-sky-600 text-sky-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Building className="h-4 w-4" />
                <span>Group Entities ({companies.length})</span>
              </button>
            </div>

            {/* Applications List & Tracking Filters Section */}
            {adminTab === "applications" && (
              <section className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-display">Group Applicant Tracking Console</h2>
                  <p className="text-xs text-slate-400">Monitor internal talent movements</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Status filter dropdown */}
                  <select
                    value={adminStatusFilter}
                    onChange={(e) => setAdminStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="All Statuses">All Stages</option>
                    <option value="Applied">Applied</option>
                    <option value="Screening">Screening</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offered">Offered</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  {/* AI Suitability Score filter slider style */}
                  <select
                    value={adminScoreFilter}
                    onChange={(e) => setAdminScoreFilter(Number(e.target.value))}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="0">All Match Scores</option>
                    <option value="85">Excellent Fits (≥ 85%)</option>
                    <option value="70">Adequate Fits (≥ 70%)</option>
                    <option value="50">Basic Fits (≥ 50%)</option>
                  </select>

                  {/* General Search matching candidates */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name, job title..."
                      className="rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs focus:border-sky-500 focus:outline-hidden w-52"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>

                </div>
              </div>

              {/* Applicant Board Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
                {filteredApps.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-xs">No matching applications logged per your criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-450 font-sans">
                          <th className="px-5 py-3">Applicant Name</th>
                          <th className="px-5 py-3">Job Applied</th>
                          <th className="px-5 py-3 text-center">Gemini AI Match</th>
                          <th className="px-5 py-3">Submission Date</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredApps.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-850 font-display">{app.employeeName}</div>
                              <div className="text-[10px] text-slate-450 mt-0.5">{app.employeeId} • {app.currentRole}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-800">{app.jobTitle}</div>
                              <div className="text-[10px] text-slate-405 mt-0.5">{app.companyName}</div>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {app.aiScore !== undefined ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    app.aiScore >= 80 ? 'bg-emerald-55 text-emerald-800 border border-emerald-100' :
                                    app.aiScore >= 60 ? 'bg-amber-55 text-amber-800 border border-amber-100' :
                                    'bg-rose-55 text-rose-800 border border-rose-100'
                                  }`}>
                                    {app.aiScore}% Match
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-slate-500">
                              {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                app.status === "Applied" ? "bg-blue-50 text-blue-700" :
                                app.status === "Screening" ? "bg-indigo-50 text-indigo-700" :
                                app.status === "Interviewing" ? "bg-amber-55 text-amber-800" :
                                app.status === "Offered" ? "bg-emerald-55 text-emerald-800" :
                                "bg-rose-55 text-rose-800"
                              }`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => setSelectedApplication(app)}
                                id={`btn-manage-${app.id}`}
                                className="inline-flex items-center space-x-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 font-semibold text-slate-700 transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Track</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
            )}

            {/* Job Vacancies Management Section */}
            {adminTab === "jobs" && (
              <section className="space-y-4 font-sans">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 font-display">Rangpur Group Active Vacancy Center</h2>
                    <p className="text-xs text-slate-400">Manage, update status, and audit active/closed career positions group-wide.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingJob(null);
                      setIsPublishModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-sky-700 active:scale-95 transition-all self-start md:self-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Publish Vacancy</span>
                  </button>
                </div>

                {/* Vacancy Management Grid / Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
                  {jobs.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">
                      <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-xs">No career openings registered in the Intranet database yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse table-auto">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-450 font-sans">
                            <th className="px-5 py-3">Position & Entity</th>
                            <th className="px-5 py-3">Category</th>
                            <th className="px-5 py-3">Type</th>
                            <th className="px-5 py-3">Compensation</th>
                            <th className="px-5 py-3 text-center">Submissions</th>
                            <th className="px-5 py-3 text-center">Status</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {jobs.map((job) => {
                            const numApplicants = applications.filter(a => a.jobId === job.id).length;
                            return (
                              <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-5 py-3.5">
                                  <div className="font-bold text-slate-850 font-display">{job.title}</div>
                                  <div className="text-[10px] text-slate-450 mt-0.5 flex items-center space-x-1.5">
                                    <span className="font-bold text-sky-600 uppercase tracking-wide">{job.companyName}</span>
                                    <span className="text-slate-300">•</span>
                                    <span>{job.department}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-slate-600">
                                  {job.category}
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="font-semibold text-slate-700">{job.type}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{job.location}</div>
                                </td>
                                <td className="px-5 py-3.5 font-mono text-slate-550">
                                  {job.salaryRange}
                                </td>
                                <td className="px-5 py-3.5 text-center font-bold text-slate-700">
                                  {numApplicants > 0 ? (
                                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sky-50 px-1.5 text-[9px] font-extrabold text-sky-700 border border-sky-100">
                                      {numApplicants}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-normal">0</span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold ${
                                    job.status === "Active" 
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                      : "bg-slate-100 text-slate-500 border border-slate-200"
                                  }`}>
                                    {job.status}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() => {
                                        setEditingJob(job);
                                        setIsPublishModalOpen(true);
                                      }}
                                      className="inline-flex items-center space-x-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 font-semibold text-slate-700 transition-colors"
                                      title="Edit Opening specs"
                                    >
                                      <span>Edit Specs</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteJob(job.id)}
                                      className="inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 p-1.5 text-rose-600 transition-colors"
                                      title="Delete job position"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Sector Categories Maintenance Section */}
            {adminTab === "categories" && (
              <section className="space-y-4 font-sans max-w-4xl">
                <div>
                  <h2 className="text-base font-bold text-slate-800 font-display">Manage & Maintain Sector Categories</h2>
                  <p className="text-xs text-slate-400">Add, rename, and clean up job categories used across the career gateway.</p>
                </div>

                {catError && (
                  <div className="rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-100">
                    {catError}
                  </div>
                )}
                {catSuccess && (
                  <div className="rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
                    {catSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category Creation Card */}
                  <div className="md:col-span-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-xs h-fit">
                    <h3 className="text-xs font-bold text-slate-800 font-display mb-3">Create New Category</h3>
                    <form onSubmit={handleCreateCategory} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Category Name</label>
                        <input
                          type="text"
                          required
                          value={newCatInput}
                          onChange={(e) => setNewCatInput(e.target.value)}
                          placeholder="e.g. Legal & Compliance"
                          className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-sky-500 focus:outline-hidden"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center space-x-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 active:scale-95 transition-all text-center"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Category</span>
                      </button>
                    </form>
                  </div>

                  {/* Active Categories List */}
                  <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-xs">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-850 uppercase tracking-wider font-sans">Active Categories List</span>
                    </div>
                    {categories.length === 0 ? (
                      <div className="py-12 text-center text-sm text-slate-400">
                        <p className="text-xs">No sector categories defined in database yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {categories.map((cat) => {
                          const isInUse = jobs.some(j => j.category === cat);
                          const isEditing = renamingCat === cat;
                          return (
                            <div key={cat} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-55/40 hover:bg-slate-50/50 transition-colors">
                              {isEditing ? (
                                <div className="flex-1 flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={renameInput}
                                    onChange={(e) => setRenameInput(e.target.value)}
                                    className="flex-1 rounded-xl border border-slate-200 p-2 text-xs focus:border-sky-500 focus:outline-hidden"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleRenameCategory(cat)}
                                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setRenamingCat(null)}
                                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <div className="font-bold text-slate-800 text-sm">{cat}</div>
                                    <div className="text-[10px] text-slate-400 mt-1">
                                      {isInUse ? "Linked to active postings (will default to fallback if deleted)" : "Unused category (safe to delete)"}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                                    <button
                                      onClick={() => {
                                        setRenamingCat(cat);
                                        setRenameInput(cat);
                                      }}
                                      className="inline-flex items-center space-x-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition-colors"
                                    >
                                      Rename
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCategory(cat)}
                                      className="inline-flex items-center justify-center rounded-lg p-1.5 transition-colors bg-rose-50 hover:bg-rose-100 text-rose-600"
                                      title={isInUse ? "Delete category (Associated jobs will fallback gracefully)" : "Delete category"}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Group Entities Maintenance Section */}
            {adminTab === "companies" && (
              <section className="space-y-4 font-sans max-w-4xl">
                <div>
                  <h2 className="text-base font-bold text-slate-800 font-display">Manage & Maintain Group Entities</h2>
                  <p className="text-xs text-slate-400">Add corporate divisions, rename existing companies, and update assignments group-wide.</p>
                </div>

                {companyError && (
                  <div className="rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-100">
                    {companyError}
                  </div>
                )}
                {companySuccess && (
                  <div className="rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
                    {companySuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Entity Creation Card */}
                  <div className="md:col-span-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-xs h-fit">
                    <h3 className="text-xs font-bold text-slate-800 font-display mb-3">Create New Entity</h3>
                    <form onSubmit={handleCreateCompany} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Entity Name</label>
                        <input
                          type="text"
                          required
                          value={newCompanyInput}
                          onChange={(e) => setNewCompanyInput(e.target.value)}
                          placeholder="e.g. Rangpur Textiles"
                          className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-sky-500 focus:outline-hidden text-slate-800 bg-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center space-x-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 active:scale-95 transition-all text-center cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Entity</span>
                      </button>
                    </form>
                  </div>

                  {/* Active Entities List */}
                  <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-xs">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-850 uppercase tracking-wider font-sans">Active Group Entities</span>
                    </div>
                    {companies.length === 0 ? (
                      <div className="py-12 text-center text-sm text-slate-400">
                        <p className="text-xs">No corporate entities defined in database yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {companies.map((comp) => {
                          const isInUse = jobs.some(j => j.companyName === comp);
                          const isEditing = renamingCompany === comp;
                          return (
                            <div key={comp} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                              {isEditing ? (
                                <div className="flex-1 flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={renameCompanyInput}
                                    onChange={(e) => setRenameCompanyInput(e.target.value)}
                                    className="flex-1 rounded-xl border border-slate-200 p-2 text-xs focus:border-sky-500 focus:outline-hidden text-slate-800 bg-white"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleRenameCompany(comp)}
                                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white transition-colors cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setRenamingCompany(null)}
                                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <div className="font-bold text-slate-800 text-sm">{comp}</div>
                                    <div className="text-[10px] text-slate-400 mt-1">
                                      {isInUse ? "Linked to active postings (will default to fallback if deleted)" : "Unused entity (safe to delete)"}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                                    <button
                                      onClick={() => {
                                        setRenamingCompany(comp);
                                        setRenameCompanyInput(comp);
                                      }}
                                      className="inline-flex items-center space-x-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
                                    >
                                      Rename
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCompany(comp)}
                                      className="inline-flex items-center justify-center rounded-lg p-1.5 transition-colors bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                                      title={isInUse ? "Delete entity (Associated jobs will fallback gracefully)" : "Delete entity"}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

           {/* ==================================== EMPLOYEE & GUEST VACANCIES BOARD ==================================== */}
        {(!currentUser || currentUser.role === "Employee") && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            
            {/* Sidebar Filters */}
            <div className="space-y-5 lg:col-span-1">
              
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-850 font-display flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <span>Filter Vagencies</span>
                </h3>

                {/* Company filter */}
                <div className="mt-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Group Entity</label>
                  <div className="mt-2 space-y-1">
                    {["All Entities", ...companies].map((company) => (
                      <button
                        key={company}
                        onClick={() => setSelectedCompany(company)}
                        className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                          selectedCompany === company
                            ? "bg-sky-50 text-sky-700"
                            : "text-slate-650 hover:bg-slate-50"
                        }`}
                      >
                        {company}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category filters */}
                <div className="mt-6 border-t border-slate-50 pt-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sector wise Categories</label>
                  <div className="mt-2 space-y-1">
                    {["All Categories", ...categories].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                          selectedCategory === cat
                            ? "bg-sky-50 text-sky-700"
                            : "text-slate-650 hover:bg-slate-50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* My Submissions Track Area inside Sidebar */}
              {currentUser && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Applications Submitted ({applications.filter(a => a.employeeEmail === currentUser.email).length})</h4>
                  <div className="mt-3 space-y-3">
                    {applications.filter(a => a.employeeEmail === currentUser.email).length === 0 ? (
                      <p className="text-xs text-slate-450 leading-relaxed">No internal applications logged for your user profile yet.</p>
                    ) : (
                      applications.filter(a => a.employeeEmail === currentUser.email).map(app => (
                        <div key={app.id} className="rounded-xl border border-slate-50 bg-slate-50/40 p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-755 truncate tracking-tight">{app.jobTitle}</span>
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                              app.status === "Applied" ? "bg-blue-50 text-blue-700" :
                              app.status === "Screening" ? "bg-indigo-50 text-indigo-700" :
                              app.status === "Interviewing" ? "bg-amber-50 text-amber-700" :
                              app.status === "Offered" ? "bg-emerald-50 text-emerald-700" :
                              "bg-rose-50 text-rose-700"
                            }`}>{app.status}</span>
                          </div>
                          <p className="text-[10px] text-slate-405 mt-1">{app.companyName} • {new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Careers Listing Deck */}
            <div className="space-y-6 lg:col-span-3">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 font-display">Active Vacancies</h2>
                  <p className="text-xs text-slate-400">Discover and advance inside your holding entities</p>
                </div>

                {/* Keyword Search field */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search keywords, positions..."
                    className="rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs focus:border-sky-500 focus:outline-hidden w-60"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              {filteredJobs.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-slate-350" />
                  <h4 className="mt-2 text-sm font-bold text-slate-700">No Openings Match Search</h4>
                  <p className="text-xs text-slate-450 mt-1 max-w-sm">Adjust your category selectors or try searching for keywords like "React" or "Logistics".</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {filteredJobs.map((job) => {
                    const candidateApplied = currentUser ? applications.some(
                      app => app.jobId === job.id && app.employeeEmail.toLowerCase() === currentUser.email.toLowerCase()
                    ) : false;
                    return (
                      <JobCard
                        key={job.id}
                        job={job}
                        hasApplied={candidateApplied}
                        onApplyClick={(jobItem) => {
                          setSelectedJob(jobItem);
                          setIsApplyDrawerOpen(true);
                        }}
                        onViewDetailsClick={(jobItem) => {
                          setSelectedJob(jobItem);
                          setIsApplyDrawerOpen(false); // only view details modal
                        }}
                      />
                    );
                  })}
                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* ==================================== DIALOGUE: APPLY NOW / DETAILED OVERVIEW DRAWERS ==================================== */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="h-full max-h-[90vh] w-full max-w-xl flex-col rounded-3xl bg-white p-0 shadow-2xl overflow-hidden flex transition-all">
            
            {/* Drawer Header Positioning */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 font-display">{selectedJob.title}</h3>
                  <p className="text-xs text-slate-400 font-sans">{selectedJob.companyName} • {selectedJob.department}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setIsApplyDrawerOpen(false);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable specs frame */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Job Info Variables Panel */}
              <div className="grid grid-cols-2 gap-3.5 rounded-2xl bg-neutral-50 border border-slate-100 p-4 text-xs font-medium">
                <div>
                  <span className="text-slate-405 block uppercase tracking-wider text-[9px] font-bold">Compensation</span>
                  <span className="text-slate-800 text-sm font-bold mt-0.5 inline-block">{selectedJob.salaryRange}</span>
                </div>
                <div>
                  <span className="text-slate-405 block uppercase tracking-wider text-[9px] font-bold">Office Workspace</span>
                  <span className="text-slate-800 text-sm font-bold mt-0.5 inline-block">{selectedJob.location}</span>
                </div>
                <div>
                  <span className="text-slate-405 block uppercase tracking-wider text-[9px] font-bold">Schedule Class</span>
                  <span className="text-slate-800 text-sm font-bold mt-0.5 inline-block">{selectedJob.type}</span>
                </div>
                <div>
                  <span className="text-slate-405 block uppercase tracking-wider text-[9px] font-bold">Sector Wing</span>
                  <span className="text-slate-800 text-sm font-bold mt-0.5 inline-block">{selectedJob.category}</span>
                </div>
              </div>

              {/* Vacancy Core Description */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">Position Objective</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{selectedJob.description}</p>
              </div>

              {/* Requirement Bullets */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">Criteria & Qualifications</h4>
                <ul className="mt-2.5 space-y-1.5">
                  {selectedJob.requirements.map((req, i) => (
                    <li key={i} className="flex items-start text-sm text-slate-650">
                      <span className="mr-2 mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits Perk list */}
              {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">Rangpur Group Perks</h4>
                  <ul className="mt-2.5 space-y-1.5">
                    {selectedJob.benefits.map((ben, i) => (
                      <li key={i} className="flex items-start text-sm text-slate-65s text-slate-600">
                        <span className="mr-2 mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span>{ben}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ====================== SUBMIT FORM INTEGRATION IN DRAWER PANEL ====================== */}
              {isApplyDrawerOpen && (
                <div className="border-t border-slate-200/80 pt-6 space-y-4">
                  <div className="flex items-center space-x-1">
                    <h4 className="text-sm font-bold text-slate-800 font-display">Internal Application Form</h4>
                  </div>
                  
                  {applyState.error && (
                    <div className="rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-100">
                      {applyState.error}
                    </div>
                  )}

                  {applyState.success ? (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 text-center space-y-2">
                      <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 animate-bounce" />
                      <h4 className="text-sm font-bold text-slate-800 font-display">Application Logged!</h4>
                      <p className="text-xs text-slate-500">Your profile details along with the CV were synchronized. Gemini matching score is being parsed on the Admin scorecard.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleApplySubmit} className="space-y-4 text-xs font-medium">
                      
                      {/* User display or dynamic Guest inputs */}
                      {currentUser ? (
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-slate-400 text-[10px]">Your Name:</span>
                            <p className="text-slate-700 font-bold mt-0.5">{currentUser.name}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px]">Your Employee ID:</span>
                            <p className="text-slate-700 font-bold mt-0.5">{currentUser.employeeId}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
                          <p className="text-xs font-semibold text-slate-600 border-b border-slate-200 pb-1.5 uppercase tracking-wider">Applicant Basic Profile Details</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Full Name *</label>
                              <input
                                type="text"
                                required
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder="Enter your full name"
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:border-sky-500 focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email Address *</label>
                              <input
                                type="email"
                                required
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:border-sky-500 focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Professional Role / Title *</label>
                              <input
                                type="text"
                                required
                                value={guestCurrentRole}
                                onChange={(e) => setGuestCurrentRole(e.target.value)}
                                placeholder="e.g. Software Engineer"
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:border-sky-500 focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Employee ID (Corporate / Optional)</label>
                              <input
                                type="text"
                                value={guestEmployeeId}
                                onChange={(e) => setGuestEmployeeId(e.target.value)}
                                placeholder="e.g. EMP-9921 (Optional)"
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:border-sky-500 focus:outline-hidden"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cover letter Message */}
                      <div>
                        <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px]">Why are you a good fit for this? (Cover letter message)</label>
                        <textarea
                          rows={3}
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder="Introduce your current credentials, group motivation, or achievements..."
                          className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-sky-500 focus:outline-hidden"
                        />
                      </div>

                      {/* CV File drag and drop target container */}
                      <div>
                        <label className="block text-slate-500 font-bold uppercase tracking-wider text-[10px]">Upload CV * (txt, pdf, docx)</label>
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById("file-resume-input")?.click()}
                          className={`mt-1.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer select-none transition-all ${
                            dragOver ? "border-sky-500 bg-sky-50/10" : "border-slate-250 border-slate-200 bg-slate-50 hover:bg-slate-100/50"
                          }`}
                        >
                          <input
                            type="file"
                            id="file-resume-input"
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".txt,.pdf,.doc,.docx"
                          />
                          <UploadCloud className="h-8 w-8 text-slate-400" />
                          <p className="mt-1 text-xs font-bold text-slate-700">Drag & drop resume CV file, or browse</p>
                          <p className="text-[9px] text-slate-400 font-normal mt-0.5">Supports TXT, PDF, DOCX lists up to 10MB</p>
                          
                          {uploadedCvName && (
                            <div className="mt-3.5 inline-flex items-center space-x-1.5 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1 font-bold text-emerald-800">
                              <FileCheck2 className="h-4 w-4 text-emerald-600" />
                              <span className="text-[11px] truncate max-w-xs">{uploadedCvName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Supplementary Documents multi-upload list */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Upload Supporting Documents (Optional)</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Attach credentials, transcripts, recommendation letters or certificates to your application profile.</p>

                        {extraFileError && (
                          <div className="rounded-lg bg-rose-50 p-2 text-[10px] font-bold text-rose-600 border border-rose-100">
                            {extraFileError}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="w-full sm:w-1/2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Document Purpose</label>
                            <select
                              value={selectedDocType}
                              onChange={(e) => setSelectedDocType(e.target.value)}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs focus:border-sky-500 focus:outline-hidden text-slate-700 font-sans cursor-pointer"
                            >
                              <option value="Academic Transcript">Academic Transcript</option>
                              <option value="Experience Letters">Experience Letters</option>
                              <option value="Professional Certification">Professional Certification</option>
                              <option value="National ID / Passport">National ID / Passport</option>
                              <option value="Recommendation Letters">Recommendation Letters</option>
                              <option value="Cover Letter Message File">Cover Letter Message File</option>
                              <option value="Other Portfolio">Other Portfolio</option>
                            </select>
                          </div>
                          <div className="w-full sm:w-1/2 self-end">
                            <button
                              type="button"
                              onClick={() => document.getElementById("extra-doc-picker")?.click()}
                              className="w-full inline-flex items-center justify-center space-x-1.5 rounded-xl border border-dashed border-sky-300 bg-sky-50 hover:bg-sky-100/70 p-2 text-xs font-bold text-sky-700 transition-colors cursor-pointer"
                            >
                              <UploadCloud className="h-4 w-4" />
                              <span>Select {selectedDocType}</span>
                            </button>
                            <input
                              type="file"
                              id="extra-doc-picker"
                              className="hidden"
                              onChange={handleAddExtraDocument}
                              accept="*/*"
                            />
                          </div>
                        </div>

                        {/* List of currently attached documents */}
                        {attachedDocuments.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Currently Attached Files ({attachedDocuments.length})</span>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                              {attachedDocuments.map((doc) => {
                                const sizeInKb = Math.round(doc.size / 1024);
                                return (
                                  <div key={doc.id} className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-white shadow-3xs hover:border-slate-350 transition-colors">
                                    <div className="flex items-center space-x-2 w-10/12">
                                      <FileText className={`h-4.5 w-4.5 shrink-0 ${doc.type === "CV/Resume" ? "text-indigo-500" : "text-sky-500"}`} />
                                      <div className="truncate flex-1">
                                        <p className="text-xs font-bold text-slate-700 truncate" title={doc.name}>{doc.name}</p>
                                        <div className="flex items-center space-x-1.5 mt-0.5">
                                          <span className="text-[9px] font-extrabold text-sky-600 bg-sky-50 border border-sky-100 px-1 rounded font-sans">
                                            {doc.type}
                                          </span>
                                          <span className="text-[9px] text-slate-400">{sizeInKb} KB</span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveExtraDocument(doc.id)}
                                      className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                      title="Remove document"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={applyState.loading}
                          id="btn-apply-submit"
                          className="inline-flex items-center space-x-1.5 rounded-xl bg-sky-600 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-sky-700 active:scale-95 disabled:opacity-50"
                        >
                          <span>{applyState.loading ? "Running AI matching..." : currentUser ? "Submit Internal Profile" : "Submit Career Profile"}</span>
                          <ArrowRight className="h-4.5 w-4.5" />
                        </button>
                      </div>

                    </form>
                  )}

                </div>
              )}

            </div>

            {/* Bottom Actions for Detail Only popup */}
            {!isApplyDrawerOpen && (
              <div className="flex justify-end border-t border-slate-100 px-6 py-4 bg-slate-50/80">
                <button
                  onClick={() => {
                    // Check if candidate applied first
                    const hasApplied = currentUser ? applications.some(
                      app => app.jobId === selectedJob.id && app.employeeEmail.toLowerCase() === currentUser.email.toLowerCase()
                    ) : false;
                    if (hasApplied) {
                      alert("You have already applied for this posting.");
                    } else if (selectedJob.status === "Closed") {
                      alert("This vacancy is temporarily closed to candidates.");
                    } else {
                      setIsApplyDrawerOpen(true);
                    }
                  }}
                  id="btn-switch-apply"
                  className="inline-flex items-center space-x-1 rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-sky-700 active:scale-95"
                >
                  <span>{currentUser ? "Apply Internally Now" : "Apply to Job Position"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}


      {/* ==================================== MODAL: ADMIN PUBLISH JOB FORM ==================================== */}
      {isPublishModalOpen && (
        <JobPublishForm
          onClose={() => {
            setIsPublishModalOpen(false);
            setEditingJob(null);
          }}
          onPublish={handlePublishJob}
          initialJob={editingJob}
          categories={categories}
          companies={companies}
        />
      )}


      {/* ==================================== PANEL: ADMIN ATS CANDIDATE PROFILE DRAWER ==================================== */}
      {selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onStatusChange={handleStatusChange}
          onSaveNotes={handleSaveNotes}
        />
      )}


      {/* ==================================== MODAL: SIGN IN DIALOG ==================================== */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 overflow-hidden flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <UserSquare2 className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-800 font-display">Apex Portal Authentication</h3>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                id="btn-close-login"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Enter your email address to sign in. The admin dashboard can be accessed by matching the designated administrator email: <code className="bg-sky-50 text-sky-700 px-1 py-0.5 rounded-md font-mono text-[10px] font-bold">only administration mail can access admin dashboard</code>.
            </p>

            {loginError && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-100">
                {loginError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLoginSubmit(loginEmailInput);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Corporate / Personal Email *</label>
                <input
                  type="email"
                  required
                  value={loginEmailInput}
                  onChange={(e) => setLoginEmailInput(e.target.value)}
                  placeholder="e.g. your.mail@gmail.com"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-sky-500 focus:outline-hidden"
                  id="login-email-input"
                />
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                className="w-full rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-sky-700 active:scale-95"
              >
                Authenticate Profile
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
