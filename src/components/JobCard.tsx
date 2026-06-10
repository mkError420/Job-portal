import React from "react";
import { JobPost } from "../types";
import { Briefcase, MapPin, Calendar, CircleDollarSign, ArrowRight, Building, CheckCircle } from "lucide-react";

interface JobCardProps {
  key?: React.Key;
  job: JobPost;
  onApplyClick: (job: JobPost) => void;
  onViewDetailsClick: (job: JobPost) => void;
  hasApplied?: boolean;
}

const getCompanyBadgeClass = (company: string) => {
  switch (company.toLowerCase()) {
    case "apex digital":
      return "bg-blue-55 text-blue-700 bg-sky-50 border-sky-100";
    case "apex capital":
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
    case "apex healthcare":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "apex logistics":
      return "bg-amber-50 text-amber-700 border-amber-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
  }
};

const getTypeBadgeClass = (type: string) => {
  switch (type.toLowerCase()) {
    case "full-time":
      return "bg-emerald-100/60 text-emerald-800";
    case "remote":
      return "bg-purple-100/60 text-purple-800";
    case "contract":
      return "bg-blue-100/60 text-blue-800";
    case "part-time":
      return "bg-orange-100/60 text-orange-850";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function JobCard({ job, onApplyClick, onViewDetailsClick, hasApplied = false }: JobCardProps) {
  const formattedDate = new Date(job.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-md">
      {/* Top Company Badge Bar */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col space-y-1.5">
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getCompanyBadgeClass(job.companyName)}`}>
              <Building className="mr-1 h-3 w-3" />
              {job.companyName}
            </span>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getTypeBadgeClass(job.type)}`}>
              {job.type}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 hover:text-sky-600 font-display transition-colors">
            {job.title}
          </h3>
          <p className="text-xs text-slate-400 font-sans font-medium uppercase tracking-wider">
            {job.department}
          </p>
        </div>
      </div>

      {/* Description Snippet */}
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
        {job.description}
      </p>

      {/* Requirements Preview */}
      <div className="mt-4 border-t border-slate-50 pt-3">
        <p className="text-xs font-semibold text-slate-400 font-sans uppercase">Requirements Snippet</p>
        <ul className="mt-2 space-y-1">
          {job.requirements.slice(0, 2).map((req, i) => (
            <li key={i} className="flex items-start text-xs text-slate-500">
              <span className="mr-1.5 mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span className="line-clamp-1">{req}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer Meta Variables */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-50 pt-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
          <div className="flex items-center text-slate-450">
            <MapPin className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center text-slate-450">
            <CircleDollarSign className="mr-1.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="font-semibold text-slate-700">{job.salaryRange}</span>
          </div>
          <div className="flex items-center text-slate-450">
            <Calendar className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            <span>{formattedDate}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onViewDetailsClick(job)}
            id={`btn-view-${job.id}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Details
          </button>
          
          {hasApplied ? (
            <span className="inline-flex items-center space-x-1 rounded-lg bg-emerald-55 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-100">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Applied</span>
            </span>
          ) : (
            <button
              onClick={() => onApplyClick(job)}
              id={`btn-apply-${job.id}`}
              disabled={job.status === "Closed"}
              className={`inline-flex items-center space-x-1 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white transition-all ${
                job.status === "Closed"
                  ? "bg-slate-350 cursor-not-allowed"
                  : "bg-sky-600 hover:bg-sky-700 hover:shadow-xs active:scale-95"
              }`}
            >
              <span>{job.status === "Closed" ? "Closed" : "Apply"}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
