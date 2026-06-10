import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Briefcase, FileText, Award, CheckCircle2, TrendingUp, AlertCircle, BookOpen } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    categoryData: { name: string; value: number }[];
    statusData: { name: string; value: number }[];
    timelineData: { date: string; count: number }[];
  } | null;
  applications: any[];
}

const COLORS = ["#0284c7", "#10b981", "#f59e0b", "#3b82f6", "#6366f1", "#ec4899", "#8b5cf6"];
const STATUS_COLORS: { [key: string]: string } = {
  Applied: "#3b82f6",
  Screening: "#2563eb",
  Interviewing: "#f59e0b",
  Offered: "#10b981",
  Rejected: "#ef4444"
};

export default function DashboardStats({ stats, applications }: DashboardStatsProps) {
  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 animate-pulse text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">Loading metrics engine...</p>
        </div>
      </div>
    );
  }

  // Calculate Average AI Suitability Score for applications scored by Gemini
  const scoredApps = applications.filter((app) => typeof app.aiScore === 'number');
  const avgAiScore = scoredApps.length > 0 
    ? Math.round(scoredApps.reduce((acc, app) => acc + app.aiScore, 0) / scoredApps.length)
    : 0;

  // Calculate Offered ratio
  const offeredApps = applications.filter((app) => app.status === "Offered");
  const offerRatio = applications.length > 0
    ? Math.round((offeredApps.length / applications.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Metrics Bento Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">Active Openings</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-800 font-display">{stats.activeJobs}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Briefcase className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="font-semibold text-emerald-600 mr-1">Rangpur Group</span>
            <span>across all 4 corporate divisions</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">Total Applications</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-800 font-display">{stats.totalApplications}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-indigo-650">
            <TrendingUp className="mr-1 h-3.5 w-3.5 text-indigo-505" />
            <span>Active monitoring via standard ATS</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">Avg AI Suitability</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-800 font-display">{avgAiScore}%</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Award className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="font-semibold text-teal-600 mr-1">Gemini AI</span>
            <span>resume matches benchmark</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">Hiring Offer Rate</p>
              <h3 className="mt-2 text-3xl font-bold text-slate-800 font-display">{offerRatio}%</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="font-semibold text-emerald-600 mr-1">{offeredApps.length} offers</span>
            <span>sent from {stats.totalApplications} applied</span>
          </div>
        </div>
      </div>

      {/* Main Graphs Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart 1: Applications by Category */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold text-slate-800 font-display">Applications by Job Category</h4>
              <p className="text-xs text-slate-400">Shows department load distribution</p>
            </div>
            <BookOpen className="h-5 w-5 text-slate-400" />
          </div>
          <div className="h-64 w-full">
            {stats.categoryData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-450">
                No application data logged per category yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontFamily: 'Inter' }}
                    labelClassName="font-medium text-slate-800"
                  />
                  <Bar dataKey="value" fill="#0284c7" name="Applications" radius={[6, 6, 0, 0]}>
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Pipeline Stage Distribution */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="mb-4">
            <h4 className="text-base font-semibold text-slate-800 font-display">ATS Pipeline Stages</h4>
            <p className="text-xs text-slate-400">Total metrics classified by status</p>
          </div>
          <div className="relative flex h-52 items-center justify-center">
            {stats.totalApplications === 0 ? (
              <div className="text-xs text-slate-450">No status distributions</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontFamily: 'Inter' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-slate-800 font-display">{stats.totalApplications}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans">Applicants</span>
            </div>
          </div>
          {/* Pie Chart Custom Legends */}
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {stats.statusData.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-1.5 p-1 rounded-sm">
                <span 
                  className="h-2 w-2 rounded-full shrink-0" 
                  style={{ backgroundColor: STATUS_COLORS[item.name] || "#94a3b8" }} 
                />
                <span className="truncate text-[11px] text-slate-600 font-sans">{item.name}: <b>{item.value}</b></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Applications Over Time Line Chart */}
      {stats.timelineData.length > 1 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <h4 className="mb-4 text-base font-semibold text-slate-800 font-display">Applications Application Timeline</h4>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontFamily: 'Inter' }} />
                <Line type="monotone" dataKey="count" stroke="#0f766e" strokeWidth={2.5} name="Daily Submissions" dot={{ r: 4, fill: "#0f766e" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
