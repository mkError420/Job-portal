import { useState } from "react";
import { Application, ApplicationStatus } from "../types";
import { X, FileText, User, Mail, Briefcase, Calendar, Award, CheckCircle2, ChevronRight, PenSquare, ArrowRight, Info, Sparkles } from "lucide-react";

interface ApplicationDetailsModalProps {
  application: Application;
  onClose: () => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
}

export default function ApplicationDetailsModal({
  application,
  onClose,
  onStatusChange,
  onSaveNotes
}: ApplicationDetailsModalProps) {
  const [notes, setNotes] = useState(application.adminNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const formattedDate = new Date(application.appliedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100 ring-emerald-500/10";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-100 ring-amber-500/10";
    return "text-rose-600 bg-rose-50 border-rose-100 ring-rose-500/10";
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "Applied":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Screening":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Interviewing":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Offered":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const handleNotesSave = async () => {
    setIsSavingNotes(true);
    setSaveSuccess(false);
    try {
      await onSaveNotes(application.id, notes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 p-0 backdrop-blur-xs">
      {/* Container Slide Over Panel */}
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-slate-50 shadow-2xl transition-transform duration-300 sm:rounded-l-3xl">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-display">{application.employeeName}</h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">
                {application.employeeId} • {application.currentRole}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-6 p-6">
          
          {/* Top Position Details Area */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">Applying For Position</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-800 font-display">{application.jobTitle}</h4>
                <p className="text-xs text-slate-400 font-sans">{application.companyName} • Internal Recruitment</p>
              </div>
              <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold ${getStatusBadge(application.status)}`}>
                {application.status}
              </span>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 border-t border-slate-50 pt-3">
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <span>Job applied on: <b className="text-slate-700">{formattedDate}</b></span>
            </div>
          </div>

          {/* Gemini AI Suitability Section */}
          <div className="rounded-2xl border border-sky-100 bg-sky-100/20 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 font-display">Gemini AI CV Evaluation</h4>
              </div>
              {application.aiScore !== undefined && (
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${getScoreColor(application.aiScore)}`}>
                  Score: {application.aiScore}/100
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-4">
              {/* Suitability Score Wheel */}
              {application.aiScore !== undefined && (
                <div className="flex flex-col items-center justify-center py-2 sm:col-span-1">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-slate-100">
                    <div 
                      className="absolute inset--1 rounded-full border-4 border-transparent"
                      style={{
                        borderColor: application.aiScore >= 80 ? '#10b981' : application.aiScore >= 60 ? '#f59e0b' : '#ef4444',
                        clipPath: `polygon(50% 50%, -50% -50%, ${application.aiScore * 3.6}% -50%)`,
                        transform: 'rotate(-90deg)'
                      }}
                    />
                    <span className="text-lg font-extrabold text-slate-800">{application.aiScore}%</span>
                  </div>
                  <span className="mt-2 text-[10px] font-bold uppercase text-slate-405">Suitability</span>
                </div>
              )}

              {/* Analysis Text Card */}
              <div className={application.aiScore !== undefined ? "sm:col-span-3" : "sm:col-span-4"}>
                <p className="text-xs leading-relaxed text-slate-650 bg-white/50 p-3 rounded-xl border border-slate-100">
                  {application.aiAnalysis || "Evaluation results parsing..."}
                </p>
                <div className="mt-2.5 flex items-center text-[10px] font-medium text-sky-700">
                  <Info className="mr-1 h-3 w-3" />
                  <span>Powered by Gemini 3.5 Flash Model matching resume text to job criteria</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details / Metadata */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Corporate Contact</h5>
              <div className="mt-2.5 space-y-2 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 shrink-0 text-slate-450" />
                  <span className="truncate">{application.employeeEmail}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 shrink-0 text-slate-450" />
                  <span>Id: <b className="text-slate-800">{application.employeeId}</b></span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Attachments</h5>
              <div className="mt-2.5 space-y-2 text-sm text-slate-600">
                <div className="flex items-center space-x-2 rounded-lg bg-slate-50 p-1 px-2 border border-slate-100">
                  <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                  <span className="truncate text-xs font-medium text-slate-700" title={application.cvName}>{application.cvName}</span>
                </div>
                {application.documentName && (
                  <div className="flex items-center space-x-2 rounded-lg bg-slate-50 p-1 px-2 border border-slate-100">
                    <FileText className="h-4 w-4 shrink-0 text-teal-500" />
                    <span className="truncate text-xs font-medium text-slate-700" title={application.documentName}>{application.documentName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cover Letter Panel */}
          {application.coverLetter && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
              <h4 className="text-sm font-bold text-slate-800 font-display">Candidate Cover Message</h4>
              <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/50">
                {application.coverLetter}
              </p>
            </div>
          )}

          {/* Resume Source Text panel */}
          {application.cvContent && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
              <h4 className="text-sm font-bold text-slate-800 font-display">Resume Contents (Text representation)</h4>
              <div className="mt-2.5 max-h-52 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-600">
                {application.cvContent}
              </div>
            </div>
          )}

          {/* Pipeline Action Bar */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 font-display">Recruitment Pipeline Actions</h4>
            <p className="text-xs text-slate-400">Advance or reject candidate status. Updates will notify user in real-time.</p>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => onStatusChange(application.id, "Screening")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  application.status === "Screening"
                    ? "bg-indigo-650 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Screen Candidate
              </button>
              <button
                onClick={() => onStatusChange(application.id, "Interviewing")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  application.status === "Interviewing"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Schedule Interview
              </button>
              <button
                onClick={() => onStatusChange(application.id, "Offered")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  application.status === "Offered"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Extend Job Offer
              </button>
              <button
                onClick={() => onStatusChange(application.id, "Rejected")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  application.status === "Rejected"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Reject Application
              </button>
            </div>
          </div>

          {/* Private Recruiter Notebook Section */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <PenSquare className="h-4.5 w-4.5 text-slate-400" />
                <h4 className="text-sm font-bold text-slate-800 font-display">Private Recruiter Comments / Notes</h4>
              </div>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 animate-fade-in">Notes saved successfully!</span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write administrative review logs, interview feedback codes, scoring assessments, or reference observations..."
              rows={4}
              id="txt-admin-notes"
              className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm focus:border-sky-500 focus:bg-white focus:outline-hidden"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleNotesSave}
                disabled={isSavingNotes}
                id="btn-save-notes"
                className="inline-flex items-center space-x-2 rounded-xl bg-slate-805 bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-slate-900 active:scale-95 disabled:opacity-50"
              >
                <span>{isSavingNotes ? "Saving notes..." : "Save Private Comments"}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
