import { useState } from "react";
import { Application, ApplicationStatus } from "../types";
import { X, FileText, User, Mail, Briefcase, Calendar, Award, CheckCircle2, ChevronRight, PenSquare, ArrowRight, Info, Sparkles, Download, Phone } from "lucide-react";
import { jsPDF } from "jspdf";

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

  const handleDownloadDocument = async (doc: { name: string; content: string; type?: string; fileType?: string; size?: number }) => {
    // 1. Check if the resource is already a native PDF file.
    const isPdf = doc.name.toLowerCase().endsWith(".pdf") || 
                  doc.fileType === "application/pdf" || 
                  (doc.content && doc.content.startsWith("data:application/pdf"));
    
    if (isPdf && doc.content && doc.content.startsWith("data:")) {
      // Direct, native download for pre-existing PDF files
      const link = document.createElement("a");
      link.href = doc.content;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 2. For image, text, or dynamically compiled document attachments, generate a polished custom PDF.
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const margin = 20;
      const pageWidth = 210;
      const pageHeight = 297;
      const usableWidth = pageWidth - (margin * 2);

      let y = 25;

      // Header dynamic styling
      pdf.setFillColor(14, 116, 144); // Sky logo accent
      pdf.rect(margin, y, usableWidth, 8, "F");
      y += 15;

      // Document branding hierarchy 
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(30, 41, 59); // Slate-800
      pdf.text("CANDIDATE PORTFOLIO DOCUMENT", margin, y);
      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.setTextColor(100, 116, 139); // Slate-500
      pdf.text(`Document Label/Type: ${doc.type || "Attached File Info"}`, margin, y);
      pdf.text(`Export Timestamp: ${new Date().toLocaleDateString()}`, pageWidth - margin, y, { align: "right" });
      y += 12;

      // Candidate Profile info-card
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.roundedRect(margin, y, usableWidth, 36, 3, 3, "FD");

      // Left column metrics
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105); // Slate-600
      pdf.text("CANDIDATE PROFILE DETAILS", margin + 5, y + 6);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42); // Slate-900
      pdf.text(`Applicant Name: ${application.employeeName}`, margin + 5, y + 13);
      pdf.text(`Contact Email: ${application.employeeEmail}`, margin + 5, y + 19);
      pdf.text(`Phone Number: ${application.phoneNumber || "Not provided"}`, margin + 5, y + 25);
      pdf.text(`Employee ID: ${application.employeeId || "Guest Candidate"}`, margin + 5, y + 31);

      // Right column metrics
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.text("COMPANY RECRUITMENT PATHWAY", margin + usableWidth / 2 + 5, y + 6);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`Job Title: ${application.jobTitle}`, margin + usableWidth / 2 + 5, y + 13);
      pdf.text(`Division/Company: ${application.companyName}`, margin + usableWidth / 2 + 5, y + 19);
      pdf.text(`Applied On: ${new Date(application.appliedAt).toLocaleDateString()}`, margin + usableWidth / 2 + 5, y + 25);
      pdf.text(`Status Code: ${application.status}`, margin + usableWidth / 2 + 5, y + 31);

      y += 46;

      // Body container
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(14, 116, 144); // Sky-700
      pdf.text("FILE CONTENT VIEWPORT", margin, y);
      y += 4;
      pdf.setDrawColor(203, 213, 225); // Slate-300
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Extract raw textual content
      let rawText = "";
      if (doc.content) {
        if (doc.content.startsWith("data:")) {
          try {
            const parts = doc.content.split(",");
            if (parts.length > 1) {
              const decoded = atob(parts[1]);
              rawText = decodeURIComponent(escape(decoded));
            } else {
              rawText = doc.content;
            }
          } catch (e) {
            rawText = doc.content;
          }
        } else {
          rawText = doc.content;
        }
      }

      // Check if it is an image
      const isImage = (doc.content && doc.content.startsWith("data:image/")) || 
                      doc.name.match(/\.(png|jpe?g|gif|webp)$/i);

      if (isImage && doc.content) {
        let imgType = "JPEG";
        if (doc.content.includes("image/png")) imgType = "PNG";
        else if (doc.content.includes("image/gif")) imgType = "GIF";
        else if (doc.content.includes("image/webp")) imgType = "WEBP";

        const maxImgHeight = 160;
        const aspect = 4 / 3; 
        const displayWidth = usableWidth;
        const displayHeight = Math.min(displayWidth / aspect, maxImgHeight);

        try {
          pdf.addImage(doc.content, imgType, margin, y, displayWidth, displayHeight);
          y += displayHeight + 10;
        } catch (imgError) {
          console.error("Image incorporation failed, fallback to descriptor", imgError);
          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(9);
          pdf.setTextColor(100, 116, 139);
          pdf.text("[Render Error: Compressed Image Payload Format]", margin, y);
        }
      } else {
        // Render text
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.5);
        pdf.setTextColor(51, 65, 85);

        if (!rawText) {
          rawText = `No printable text content found in ${doc.name}. The document was submitted as an active binary database resource node.`;
        }

        // Filter out binary characters in fallback if any
        if (rawText.startsWith("data:application/") || rawText.match(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/)) {
          rawText = `[File Attachment: ${doc.name}]\nFormat: ${doc.fileType || "Dynamic Archive Object"}\nSize: ${doc.size ? Math.round(doc.size / 1024) + " KB" : "Unknown KB"}\n\nThis is a supplementary document attached securely inside the application submission database stream. The document remains fully accessible to the system evaluators. For raw file viewing, please download the attachment files.`;
        }

        const lines = pdf.splitTextToSize(rawText, usableWidth);
        const lineHeight = 5.5;

        for (let i = 0; i < lines.length; i++) {
          if (y + lineHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin + 10;
            
            // Running page header
            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(8);
            pdf.setTextColor(148, 163, 184); // Slate-400
            pdf.text(`Attachment Continuation [${doc.name}] - Page ${pdf.getNumberOfPages()}`, margin, y - 4);
            pdf.setDrawColor(241, 245, 249);
            pdf.line(margin, y - 2, pageWidth - margin, y - 2);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9.5);
            pdf.setTextColor(51, 65, 85);
          }
          pdf.text(lines[i], margin, y);
          y += lineHeight;
        }
      }

      // Add footnotes and numbering to all pages
      const totalPages = pdf.getNumberOfPages();
      for (let page = 1; page <= totalPages; page++) {
        pdf.setPage(page);
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(7.5);
        pdf.setTextColor(148, 163, 184); // Slate-400
        pdf.text(
          "JOB PORTAL SECTOR NETWORKS • CONFIDENTIAL APPLICANT DOSSIER",
          margin,
          pageHeight - 12
        );
        pdf.text(
          `Page ${page} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 12,
          { align: "right" }
        );
      }

      const pdfFilename = doc.name.toLowerCase().endsWith(".pdf") 
        ? doc.name 
        : `${doc.name.split(".")[0] || "document"}.pdf`;
      pdf.save(pdfFilename);

    } catch (err) {
      console.error("PDF generation failed, launching default client downloader", err);
      // Perfect safe fallback
      let href = doc.content;
      if (!href) return;
      if (!href.startsWith("data:")) {
        const base64 = btoa(unescape(encodeURIComponent(doc.content)));
        href = `data:text/plain;charset=utf-8;base64,${base64}`;
      }
      const link = document.createElement("a");
      link.href = href;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formattedDate = new Date(application.appliedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Formulate unified downloadable files list
  const downloadableDocs: Array<{ id: string; name: string; type: string; content: string; fileType?: string; size?: number }> = [];

  // Add primary CV if present
  if (application.cvName) {
    downloadableDocs.push({
      id: "primary-cv",
      name: application.cvName,
      type: "CV/Resume",
      content: application.cvContent || "",
      fileType: "text/plain"
    });
  }

  // Add legacy documentName if present and not already matching
  if (application.documentName) {
    downloadableDocs.push({
      id: "legacy-doc",
      name: application.documentName,
      type: "Supporting Document",
      content: "",
      fileType: "application/octet-stream"
    });
  }

  // Add actual dynamic files list
  if (application.documents && Array.isArray(application.documents)) {
    application.documents.forEach((doc) => {
      if (doc.type === "CV/Resume") {
        const existingIdx = downloadableDocs.findIndex(d => d.type === "CV/Resume");
        if (existingIdx !== -1) {
          downloadableDocs[existingIdx] = doc;
        } else {
          downloadableDocs.push(doc);
        }
      } else {
        const exists = downloadableDocs.some(d => d.name === doc.name && d.type === doc.type);
        if (!exists) {
          downloadableDocs.push(doc);
        }
      }
    });
  }

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
                {application.phoneNumber && (
                  <div className="flex items-center space-x-2 border-t border-slate-50 pt-1.5 mt-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                    <span>Phone: <b className="text-slate-800 font-semibold">{application.phoneNumber}</b></span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 font-sans">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Professional Status</h5>
              <div className="mt-2.5 space-y-2 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate font-semibold text-slate-800">{application.currentRole || "General Employee"}</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed">
                  Candidate background verified with corporate role association context.
                </div>
              </div>
            </div>
          </div>

          {/* Applicant Portfolios & Supporting Documents */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4 font-sans">
            <div>
              <h4 className="text-sm font-bold text-slate-800 font-display">Candidate Portfolios, CVs & Supporting Documents ({downloadableDocs.length})</h4>
              <p className="text-[11px] text-slate-450 leading-relaxed mt-0.5">Review and download academic transcripts, certificates, portfolios, recommendation letters, or files uploaded by {application.employeeName}.</p>
            </div>
            
            {downloadableDocs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No files attached to this application setup.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {downloadableDocs.map((doc, idx) => {
                  const sizeInKb = doc.size ? Math.round(doc.size / 1024) : null;
                  const canDownload = !!doc.content;
                  return (
                    <div key={doc.id || idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all shrink-0">
                      <div className="flex items-center space-x-2.5 min-w-0 w-8/12">
                        <FileText className={`h-5 w-5 shrink-0 ${doc.type === "CV/Resume" ? "text-indigo-500" : "text-sky-500"}`} />
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-bold text-slate-700 truncate" title={doc.name}>{doc.name}</p>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-[9px] font-extrabold text-sky-700 bg-sky-50 border border-sky-100 px-1 rounded font-sans">
                              {doc.type}
                            </span>
                            {sizeInKb !== null && <span className="text-[9px] text-slate-400">{sizeInKb} KB</span>}
                          </div>
                        </div>
                      </div>
                      
                      {canDownload ? (
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="inline-flex items-center space-x-1 rounded-lg bg-white hover:bg-sky-50 hover:text-sky-700 px-2.5 py-1.5 text-xs font-bold text-slate-700 border border-slate-250 hover:border-sky-350 transition-all shadow-3xs cursor-pointer active:scale-95"
                          title={`Download ${doc.name}`}
                        >
                          <Download className="h-3.5 w-3.5 text-slate-450 hover:text-sky-600" />
                          <span>Download</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic font-medium">Text only reference</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
