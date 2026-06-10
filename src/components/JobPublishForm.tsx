import React, { useState, FormEvent, useEffect } from "react";
import { JobType, JobPost } from "../types";
import { X, Briefcase, Plus, MapPin, DollarSign, Building, FileText, CheckCircle2, Save } from "lucide-react";

interface JobPublishFormProps {
  onClose: () => void;
  onPublish: (jobData: any) => Promise<void>;
  initialJob?: JobPost | null;
  categories?: string[];
  companies?: string[];
}

const DEFAULT_CATEGORIES = [
  "Technology & IT",
  "Finance & Accounts",
  "Human Resources",
  "Design & Creatives",
  "Engineering & Operations",
  "Marketing & Corporate Sales"
];

const DEFAULT_COMPANIES = [
  "Rangpur Digital",
  "Rangpur Capital",
  "Rangpur Healthcare",
  "Rangpur Logistics",
  "Rangpur Group HQ"
];

export default function JobPublishForm({ 
  onClose, 
  onPublish, 
  initialJob, 
  categories = DEFAULT_CATEGORIES,
  companies = DEFAULT_COMPANIES
}: JobPublishFormProps) {
  const [title, setTitle] = useState(initialJob ? initialJob.title : "");
  const [companyName, setCompanyName] = useState(initialJob ? initialJob.companyName : (companies[0] || "Rangpur Group HQ"));
  const [category, setCategory] = useState(initialJob ? initialJob.category : (categories[0] || "General"));
  const [department, setDepartment] = useState(initialJob ? initialJob.department : "");
  const [location, setLocation] = useState(initialJob ? initialJob.location : "");
  const [type, setType] = useState<JobType>(initialJob ? initialJob.type : "Full-Time");
  const [salaryRange, setSalaryRange] = useState(initialJob ? initialJob.salaryRange : "");
  const [description, setDescription] = useState(initialJob ? initialJob.description : "");
  const [reqsText, setReqsText] = useState(initialJob ? initialJob.requirements.join("\n") : "");
  const [benefitsText, setBenefitsText] = useState(initialJob ? initialJob.benefits.join("\n") : "");
  const [status, setStatus] = useState<"Active" | "Closed">(initialJob ? initialJob.status : "Active");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync state if initialJob reference updates
  useEffect(() => {
    if (initialJob) {
      setTitle(initialJob.title);
      setCompanyName(initialJob.companyName);
      setCategory(initialJob.category);
      setDepartment(initialJob.department);
      setLocation(initialJob.location);
      setType(initialJob.type);
      setSalaryRange(initialJob.salaryRange);
      setDescription(initialJob.description);
      setReqsText(initialJob.requirements.join("\n"));
      setBenefitsText(initialJob.benefits.join("\n"));
      setStatus(initialJob.status);
    }
  }, [initialJob]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg("Please complete the vacancy title and core description.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    // Split requirement and benefits lines
    const requirements = reqsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const benefits = benefitsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    try {
      await onPublish({
        ...(initialJob ? { id: initialJob.id } : {}),
        title: title.trim(),
        companyName,
        category,
        department: department.trim() || "General",
        location: location.trim() || "Hybrid",
        type,
        salaryRange: salaryRange.trim() || "Negotiable",
        description: description.trim(),
        requirements: requirements.length > 0 ? requirements : ["Relevant industry experience."],
        benefits: benefits.length > 0 ? benefits : ["Standard corporate benefits and appraisals."],
        status
      });
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || "Something failed while registering the internal opening.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex h-full max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-0 shadow-2xl overflow-hidden">
        
        {/* Modal Sticky Head */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
              {initialJob ? (
                <Save className="h-4.5 w-4.5" />
              ) : (
                <Plus className="h-4.5 w-4.5" />
              )}
            </div>
            <h3 className="text-base font-bold text-slate-800 font-display">
              {initialJob ? "Modify Position Details" : "Publish New Internal Opening"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-100">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Vacancy Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lead React Architect, HR Assistant Manager"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Group Entity *</label>
              <select
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-sky-500 focus:outline-hidden bg-white"
              >
                {companies.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Sector / Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-sky-500 focus:outline-hidden bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Functional Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. strategic development, microfinance core"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Job Schedule/Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as JobType)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-sky-500 focus:outline-hidden bg-white"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Location Workspace</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dhaka (Hybrid), Port Terminal (On-site)"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Compensation Package</label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g. ৳80,000 - ৳100,000 / month"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            {/* Vacancy Status */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Vacancy Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "Active" | "Closed")}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-sky-500 focus:outline-hidden bg-white"
              >
                <option value="Active">Active (Open for applications)</option>
                <option value="Closed">Closed (Hidden or filled)</option>
              </select>
            </div>

            {/* Job Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Core Job Description *</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the roles, day-to-day work metrics, and strategic goals for this internal position..."
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            {/* Requirements list */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Requirements List (One item per line)</label>
              <textarea
                rows={3}
                value={reqsText}
                onChange={(e) => setReqsText(e.target.value)}
                placeholder="Enter specific criteria. For example:&#10;BBA in finance with 1+ years experience&#10;Able to relocate to Chittagong Port&#10;Highly conversational executive levels"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-sky-500 focus:outline-hidden font-sans"
              />
            </div>

            {/* Benefits list */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Corporate Perks & Benefits (One item per line)</label>
              <textarea
                rows={3}
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                placeholder="Enter perks. For example:&#10;Subsidized healthcare insurance for dependents&#10;Double festive bonus packages annually&#10;Continuing certifications budgeting"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-sky-500 focus:outline-hidden font-sans"
              />
            </div>
          </div>
        </form>

        {/* Modal Sticky Foot */}
        <div className="flex justify-end space-x-3 border-t border-slate-205 border-slate-100 px-6 py-4 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-250 border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-sky-700 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting
              ? (initialJob ? "Saving Changes..." : "Publishing Opening...")
              : (initialJob ? "Save Changes" : "Publish Vacancy")}
          </button>
        </div>

      </div>
    </div>
  );
}
