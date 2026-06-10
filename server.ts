import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "server-db.json");

// Middleware to parse larger payloads for CV file contents
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Helper to safely read database
async function readDB() {
  const defaultCategories = [
    "Technology & IT",
    "Finance & Accounts",
    "Human Resources",
    "Design & Creatives",
    "Engineering & Operations",
    "Marketing & Corporate Sales"
  ];
  const defaultCompanies = [
    "Rangpur Digital",
    "Rangpur Capital",
    "Rangpur Healthcare",
    "Rangpur Logistics",
    "Rangpur Group HQ"
  ];
  const defaultSettings = {
    portalName: "JOB PORTAL",
    portalSubtitle: "Global Career Gate",
    logoBase64: "",
    admins: [
      "mk.rabbani.cse@gmail.com",
      "admin.hq@apex-group.com"
    ]
  };

  try {
    if (!fs.existsSync(DB_FILE)) {
      return { 
        jobs: [], 
        applications: [], 
        notifications: [], 
        categories: defaultCategories, 
        companies: defaultCompanies, 
        settings: defaultSettings 
      };
    }
    const data = await fs.promises.readFile(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.categories || !Array.isArray(parsed.categories)) {
      parsed.categories = defaultCategories;
    }
    if (!parsed.companies || !Array.isArray(parsed.companies)) {
      parsed.companies = defaultCompanies;
    }
    if (!parsed.settings || typeof parsed.settings !== "object") {
      parsed.settings = defaultSettings;
    } else {
      // Ensure admins exists
      if (!parsed.settings.admins || !Array.isArray(parsed.settings.admins)) {
        parsed.settings.admins = defaultSettings.admins;
      }
      // Guarantee mk.rabbani.cse@gmail.com is an admin
      if (!parsed.settings.admins.includes("mk.rabbani.cse@gmail.com")) {
        parsed.settings.admins.push("mk.rabbani.cse@gmail.com");
      }
    }
    return parsed;
  } catch (err) {
    console.error("Database reading error, starting empty:", err);
    return {
      jobs: [],
      applications: [],
      notifications: [],
      categories: defaultCategories,
      companies: defaultCompanies,
      settings: defaultSettings
    };
  }
}

// Helper to safely write database
async function writeDB(data: any) {
  try {
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Database writing error:", err);
  }
}

// Lazy initialization of Gemini API Client to prevent crashes during startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    console.warn("GEMINI_API_KEY environment variable is not configured. Running AI features in fallback mode.");
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    return aiClient;
  } catch (e) {
    console.error("Error creating Gemini developer client:", e);
    return null;
  }
}

// Helper function to call Gemini and analyze CV
async function analyzeCVAIEngine(jobTitle: string, jobDesc: string, cvName: string, cvContent: string) {
  const cleanCVContent = cvContent ? cvContent.substring(0, 15000) : ""; // limit input text length
  const prompt = `
You are an expert HR evaluation agent and recruiter. 
Analyze the candidate's CV/Resume for the position of "${jobTitle}".
Job Details: ${jobDesc}

Candidate Resume File: ${cvName}
Resume/CV Text Content:
---
${cleanCVContent}
---

Your task is to evaluate this candidate and return:
1. An overall match suitability score from 0 to 100 (integer only).
2. A very concise analysis summary (max 3 sentences) highlighting their key strengths for this position, or what they lack.
`;

  const client = getGeminiClient();
  if (!client) {
    // Elegant system fallback if a key is not entered yet
    console.log("Using system-fallback CV matching analysis...");
    const mockScore = Math.floor(Math.random() * 31) + 65; // rand 65 to 95
    return {
      score: mockScore,
      analysis: `[Fallback Analysis: Set your GEMINI_API_KEY for true AI evaluation] Candidate CV (${cvName}) shows strong alignment with ${jobTitle} objectives. Demonstrates active corporate experience and relevant tech stacks.`
    };
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["score", "analysis"],
          properties: {
            score: {
              type: Type.NUMBER,
              description: "Overall suitability score matching the job from 0 to 100",
            },
            analysis: {
              type: Type.STRING,
              description: "Short concise evaluation overview of max 3 sentences",
            }
          }
        }
      }
    });

    const textOutput = response.text?.trim() || "{}";
    const result = JSON.parse(textOutput);
    return {
      score: typeof result.score === 'number' ? result.score : 70,
      analysis: result.analysis || "Analysis completed successfully."
    };
  } catch (err) {
    console.error("Gemini CV analysis error:", err);
    return {
      score: 75,
      analysis: `CV submitted. Standard keyword validation indicates basic suitability. [AI Evaluation temporarily unavailable: ${(err as Error).message}]`
    };
  }
}

// === API ROUTES ===

// 1. Jobs Listing & Categories
app.get("/api/jobs", async (req, res) => {
  const db = await readDB();
  res.json(db.jobs || []);
});

// 2. Single Job Details
app.get("/api/jobs/:id", async (req, res) => {
  const db = await readDB();
  const job = db.jobs.find((j: any) => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: "Job opening not found" });
  }
  res.json(job);
});

// 3. Create Job (Admin)
app.post("/api/jobs", async (req, res) => {
  const { title, category, department, companyName, location, type, salaryRange, description, requirements, benefits } = req.body;

  if (!title || !category || !companyName || !description) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const db = await readDB();
  const newJob = {
    id: `job-${Date.now()}`,
    title,
    category,
    department: department || "General",
    companyName,
    location: location || "All locations",
    type: type || "Full-Time",
    salaryRange: salaryRange || "Negotiable",
    description,
    requirements: Array.isArray(requirements) ? requirements : [requirements],
    benefits: Array.isArray(benefits) ? benefits : [benefits],
    createdAt: new Date().toISOString(),
    status: "Active"
  };

  db.jobs.unshift(newJob);
  await writeDB(db);
  res.status(201).json(newJob);
});

// 4. Update Job Post (Admin)
app.put("/api/jobs/:id", async (req, res) => {
  const db = await readDB();
  const index = db.jobs.findIndex((j: any) => j.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Job not found" });
  }

  db.jobs[index] = {
    ...db.jobs[index],
    ...req.body,
    id: req.params.id // freeze ID
  };

  await writeDB(db);
  res.json(db.jobs[index]);
});

// 4.5 Delete Job Post (Admin)
app.delete("/api/jobs/:id", async (req, res) => {
  const db = await readDB();
  const index = db.jobs.findIndex((j: any) => j.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Job not found" });
  }

  db.jobs.splice(index, 1);
  await writeDB(db);
  res.json({ success: true, message: "Job deleted successfully." });
});

// === CATEGORIES ENDPOINTS ===

// GET list of categories
app.get("/api/categories", async (req, res) => {
  const db = await readDB();
  res.json(db.categories || []);
});

// Create new category
app.post("/api/categories", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Category name is required" });
  }
  const db = await readDB();
  const cleanName = name.trim();
  if (db.categories.some((c: string) => c.toLowerCase() === cleanName.toLowerCase())) {
    return res.status(400).json({ error: "Category already exists" });
  }
  db.categories.push(cleanName);
  await writeDB(db);
  res.status(201).json({ success: true, categories: db.categories });
});

// Rename category
app.put("/api/categories", async (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName || typeof oldName !== "string" || typeof newName !== "string") {
    return res.status(400).json({ error: "Both old name and new name are required" });
  }
  const db = await readDB();
  const cleanOld = oldName.trim();
  const cleanNew = newName.trim();
  const index = db.categories.findIndex((c: string) => c.toLowerCase() === cleanOld.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ error: "Category not found to rename" });
  }
  db.categories[index] = cleanNew;
  
  // Update in all jobs
  if (db.jobs && Array.isArray(db.jobs)) {
    db.jobs.forEach((j: any) => {
      if (j.category === cleanOld) {
        j.category = cleanNew;
      }
    });
  }
  await writeDB(db);
  res.json({ success: true, categories: db.categories });
});

// Delete category
app.delete("/api/categories", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Category name is required" });
  }
  const db = await readDB();
  const cleanName = name.trim();
  const index = db.categories.findIndex((c: string) => c.toLowerCase() === cleanName.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ error: "Category not found" });
  }
  
  // Remove category from list
  db.categories.splice(index, 1);
  
  // Reassign any jobs that belong to this category to a remaining category or "General"
  const fallbackCategory = db.categories[0] || "General";
  if (db.jobs && Array.isArray(db.jobs)) {
    db.jobs.forEach((j: any) => {
      if (j.category === cleanName) {
        j.category = fallbackCategory;
      }
    });
  }
  
  await writeDB(db);
  res.json({ success: true, categories: db.categories });
});

// === COMPANIES (GROUP ENTITIES) ENDPOINTS ===

// GET list of companies
app.get("/api/companies", async (req, res) => {
  const db = await readDB();
  res.json(db.companies || []);
});

// Create new company
app.post("/api/companies", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Company name is required" });
  }
  const db = await readDB();
  const cleanName = name.trim();
  if (db.companies.some((c: string) => c.toLowerCase() === cleanName.toLowerCase())) {
    return res.status(400).json({ error: "Company already exists" });
  }
  db.companies.push(cleanName);
  await writeDB(db);
  res.status(201).json({ success: true, companies: db.companies });
});

// Rename company
app.put("/api/companies", async (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName || typeof oldName !== "string" || typeof newName !== "string") {
    return res.status(400).json({ error: "Both old name and new name are required" });
  }
  const db = await readDB();
  const cleanOld = oldName.trim();
  const cleanNew = newName.trim();
  const index = db.companies.findIndex((c: string) => c.toLowerCase() === cleanOld.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ error: "Company not found to rename" });
  }
  db.companies[index] = cleanNew;
  
  // Update in all jobs
  if (db.jobs && Array.isArray(db.jobs)) {
    db.jobs.forEach((j: any) => {
      if (j.companyName === cleanOld) {
        j.companyName = cleanNew;
      }
    });
  }
  await writeDB(db);
  res.json({ success: true, companies: db.companies });
});

// Delete company
app.delete("/api/companies", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Company name is required" });
  }
  const db = await readDB();
  const cleanName = name.trim();
  const index = db.companies.findIndex((c: string) => c.toLowerCase() === cleanName.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ error: "Company not found" });
  }
  
  // Remove company from list
  db.companies.splice(index, 1);
  
  // Reassign any jobs that belong to this company to a remaining company or a default fallback
  const fallbackCompany = db.companies[0] || "Rangpur Group HQ";
  if (db.jobs && Array.isArray(db.jobs)) {
    db.jobs.forEach((j: any) => {
      if (j.companyName === cleanName) {
        j.companyName = fallbackCompany;
      }
    });
  }
  
  await writeDB(db);
  res.json({ success: true, companies: db.companies });
});

// 5. Applications List
app.get("/api/applications", async (req, res) => {
  const db = await readDB();
  res.json(db.applications || []);
});

// 6. Application Analytics Metrics
app.get("/api/applications/stats", async (req, res) => {
  const db = await readDB();
  const apps = db.applications || [];
  const jobs = db.jobs || [];

  // 1. Applications by category
  const categoryStats: { [key: string]: number } = {};
  // Initialize with known job categories
  jobs.forEach((j: any) => {
    categoryStats[j.category] = 0;
  });
  apps.forEach((app: any) => {
    const job = jobs.find((j: any) => j.id === app.jobId);
    if (job) {
      categoryStats[job.category] = (categoryStats[job.category] || 0) + 1;
    } else {
      categoryStats["General"] = (categoryStats["General"] || 0) + 1;
    }
  });

  const categoryData = Object.entries(categoryStats).map(([name, count]) => ({ name, value: count }));

  // 2. Applications by status
  const statusStats = {
    Applied: 0,
    Screening: 0,
    Interviewing: 0,
    Offered: 0,
    Rejected: 0
  };
  apps.forEach((app: any) => {
    if (app.status in statusStats) {
      statusStats[app.status as keyof typeof statusStats]++;
    }
  });
  const statusData = Object.entries(statusStats).map(([name, count]) => ({ name, value: count }));

  // 3. Applications over time / timeline (last 7 applications group by date)
  const timelineCoords: { [key: string]: number } = {};
  apps.forEach((app: any) => {
    const dateStr = new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    timelineCoords[dateStr] = (timelineCoords[dateStr] || 0) + 1;
  });
  const timelineData = Object.entries(timelineCoords).map(([date, count]) => ({ date, count })).slice(-10);

  res.json({
    totalJobs: jobs.length,
    activeJobs: jobs.filter((j: any) => j.status === "Active").length,
    totalApplications: apps.length,
    categoryData,
    statusData,
    timelineData
  });
});

// 7. Apply Internally (Submit application with automatic resume parsing & evaluator)
app.post("/api/applications", async (req, res) => {
  const { jobId, employeeName, employeeEmail, employeeId, currentRole, cvName, cvContent, documentName, coverLetter, documents, phoneNumber } = req.body;

  if (!jobId || !employeeName || !employeeEmail || !employeeId) {
    return res.status(400).json({ error: "Missing candidate credentials" });
  }

  const db = await readDB();
  const targetJob = db.jobs.find((j: any) => j.id === jobId);
  if (!targetJob) {
    return res.status(404).json({ error: "The selected job opening cannot be located." });
  }

  // Prevent multiple applications for the exact same job by the same employee ID
  const alreadyApplied = db.applications.find((app: any) => app.jobId === jobId && app.employeeEmail.toLowerCase() === employeeEmail.toLowerCase());
  if (alreadyApplied) {
    return res.status(400).json({ error: "You have already submitted an internal application for this post." });
  }

  // Analyze Resume CV using Gemini
  console.log(`Analyzing internal application CV for candidate: ${employeeName}...`);
  const jobHeader = `${targetJob.title} at ${targetJob.companyName}`;
  const jobDetails = `Category: ${targetJob.category}. Description: ${targetJob.description}. Requirements: ${targetJob.requirements.join("; ")}`;
  const aiEval = await analyzeCVAIEngine(jobHeader, jobDetails, cvName || "Resume", cvContent || "");

  const newApp = {
    id: `app-${Date.now()}`,
    jobId,
    jobTitle: targetJob.title,
    companyName: targetJob.companyName,
    employeeName,
    employeeEmail,
    employeeId,
    currentRole: currentRole || "General Employee",
    cvName: cvName || "uploaded_resume.txt",
    cvContent: cvContent || "",
    documentName: documentName || "",
    coverLetter: coverLetter || "",
    phoneNumber: phoneNumber || "",
    documents: documents || [],
    status: "Applied",
    appliedAt: new Date().toISOString(),
    adminNotes: "",
    aiScore: aiEval.score,
    aiAnalysis: aiEval.analysis
  };

  db.applications.unshift(newApp);

  // Add a real-time status notification for the applicant
  const newNotif = {
    id: `notif-${Date.now()}`,
    employeeEmail,
    jobTitle: targetJob.title,
    message: `Your application for ${targetJob.title} has been successfully submitted internal evaluation.`,
    status: "Applied",
    createdAt: new Date().toISOString(),
    read: false
  };
  db.notifications.unshift(newNotif);

  await writeDB(db);
  res.status(201).json({ application: newApp, message: "Application submitted successfully with automated evaluation summary!" });
});

// 8. Update Application Status (Admin) - Triggers status notification
app.put("/api/applications/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: "Missing required status field" });
  }

  const db = await readDB();
  const appIndex = db.applications.findIndex((a: any) => a.id === req.params.id);
  if (appIndex === -1) {
    return res.status(404).json({ error: "Application record not found" });
  }

  const oldApp = db.applications[appIndex];
  db.applications[appIndex].status = status;

  // Create real-time notification
  const newNotif = {
    id: `notif-${Date.now()}`,
    employeeEmail: oldApp.employeeEmail,
    jobTitle: oldApp.jobTitle,
    message: `Your internal application status for "${oldApp.jobTitle}" has been updated to "${status}".`,
    status: status,
    createdAt: new Date().toISOString(),
    read: false
  };
  db.notifications.unshift(newNotif);

  await writeDB(db);
  res.json(db.applications[appIndex]);
});

// 9. Update Application Private Notes (Admin)
app.put("/api/applications/:id/notes", async (req, res) => {
  const { notes } = req.body;

  const db = await readDB();
  const appIndex = db.applications.findIndex((a: any) => a.id === req.params.id);
  if (appIndex === -1) {
    return res.status(404).json({ error: "Application record not found" });
  }

  db.applications[appIndex].adminNotes = notes || "";
  await writeDB(db);
  res.json(db.applications[appIndex]);
});

// 9.5 Delete Candidate Application Profile (Admin)
app.delete("/api/applications/:id", async (req, res) => {
  const db = await readDB();
  const index = db.applications.findIndex((a: any) => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Application profile record not found" });
  }
  db.applications.splice(index, 1);
  await writeDB(db);
  res.json({ success: true, message: "Application profile deleted successfully", deletedId: req.params.id });
});

// 9.6 Get Portal Settings
app.get("/api/settings", async (req, res) => {
  const db = await readDB();
  res.json(db.settings);
});

// 9.7 Update Portal Settings (Change portal name, admins, logo, etc.)
app.put("/api/settings", async (req, res) => {
  const { portalName, portalSubtitle, logoBase64, admins } = req.body;
  if (!portalName || typeof portalName !== "string" || !portalName.trim()) {
    return res.status(400).json({ error: "Portal name is required" });
  }

  const db = await readDB();
  db.settings = {
    portalName: portalName.trim(),
    portalSubtitle: (portalSubtitle || "").trim(),
    logoBase64: logoBase64 || "",
    admins: Array.isArray(admins) ? admins.map((e: string) => e.trim().toLowerCase()).filter(Boolean) : db.settings.admins
  };

  // Keep admin from metadata in the admin pool
  if (!db.settings.admins.includes("mk.rabbani.cse@gmail.com")) {
    db.settings.admins.push("mk.rabbani.cse@gmail.com");
  }

  await writeDB(db);
  res.json(db.settings);
});

// 10. Notifications List
app.get("/api/notifications", async (req, res) => {
  const db = await readDB();
  const email = req.query.email as string;
  if (email) {
    const filtered = db.notifications.filter((n: any) => n.employeeEmail.toLowerCase() === email.toLowerCase());
    return res.json(filtered);
  }
  res.json(db.notifications || []);
});

// 11. Mark Notification Log as Read
app.post("/api/notifications/:id/read", async (req, res) => {
  const db = await readDB();
  const index = db.notifications.findIndex((n: any) => n.id === req.params.id);
  if (index !== -1) {
    db.notifications[index].read = true;
    await writeDB(db);
  }
  res.json({ success: true });
});

// 12. Robust Data Export for Reporting (CSV generation)
app.get("/api/export", async (req, res) => {
  try {
    const db = await readDB();
    const apps = db.applications || [];

    // Formulate clean structured CSV
    const headers = [
      "Application ID",
      "Employee ID",
      "Candidate Name",
      "Employee Email",
      "Phone Number",
      "Current Role",
      "Applied Position",
      "Company Entity",
      "Current Status",
      "Application Date",
      "AI Suitability Score",
      "CV Filename",
      "Admin Notes Summary"
    ];

    const rows = apps.map((app: any) => {
      return [
        app.id,
        app.employeeId,
        `"${app.employeeName.replace(/"/g, '""')}"`,
        app.employeeEmail,
        `"${(app.phoneNumber || "").replace(/"/g, '""')}"`,
        `"${app.currentRole.replace(/"/g, '""')}"`,
        `"${app.jobTitle.replace(/"/g, '""')}"`,
        `"${app.companyName.replace(/"/g, '""')}"`,
        app.status,
        app.appliedAt,
        app.aiScore !== undefined ? app.aiScore : "N/A",
        `"${(app.cvName || "").replace(/"/g, '""')}"`,
        `"${(app.adminNotes || "").replace(r => "", "").replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=applications_report_${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Export failure:", error);
    res.status(500).json({ error: "Failed to generate CSV export file." });
  }
});

// === VITE / STATIC FILE SERVING MIDDLEWARE ===
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve SPA backup on all random routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}...`);
  });
}

startServer();
