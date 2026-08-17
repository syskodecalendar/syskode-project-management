import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
dotenv.config();
const app = express();
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT) || 3000;
app.use(express.json({ limit: "60mb" }));
// Initialize Google GenAI client if GEMINI_API_KEY is available
let aiClient = null;
function getAIClient() {
    if (!aiClient && process.env.GEMINI_API_KEY) {
        aiClient = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
                headers: {
                    "User-Agent": "aistudio-build",
                },
            },
        });
    }
    return aiClient;
}
// Health check endpoint
app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        company: "Syskode Technologies W.L.L.",
        hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
        timestamp: new Date().toISOString(),
    });
});
// AI Endpoint: Summarize Proposal
app.post("/api/ai/summarize-proposal", async (req, res) => {
    try {
        const { proposalText, documentName, leadName } = req.body;
        const ai = getAIClient();
        if (!ai) {
            return res.status(503).json({ success: false, error: "GEMINI_API_KEY is not configured on the server." });
        }
        const prompt = `You are a senior IT technical proposal analyst for Syskode Technologies W.L.L.
Analyze the following proposal document for lead "${leadName || "Client"}" (Document: "${documentName || "Proposal.pdf"}"):

Text / Details provided:
${proposalText || "Standard Syskode proposal for enterprise web application development"}

Extract and summarize in JSON format with the following keys:
- executiveSummary (string)
- customerRequirements (array of strings)
- projectScope (string)
- deliverables (array of strings)
- technologyStack (array of strings)
- integrations (array of strings)
- timeline (string)
- commercialTerms (string)
- clientResponsibilities (array of strings)
- syskodeResponsibilities (array of strings)
- exclusions (array of strings)
- risks (array of strings)
- importantClauses (array of strings)
- recommendedNextActions (array of strings)
`;
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        const resultText = response.text || "{}";
        const summary = JSON.parse(resultText);
        res.json({
            success: true,
            summary,
        });
    }
    catch (error) {
        console.error("Error in summarize-proposal:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// AI Endpoint: Generate real project tasks from project context and assigned members.
app.post("/api/ai/generate-project-tasks", async (req, res) => {
    try {
        const { project, members = [], instructions = "", count = 8, dueDate = "" } = req.body || {};
        if (!project?.projectName)
            return res.status(400).json({ success: false, error: "A real project is required before generating tasks." });
        const ai = getAIClient();
        if (!ai)
            return res.status(503).json({ success: false, error: "GEMINI_API_KEY is not configured on the server." });
        const safeCount = Math.max(1, Math.min(30, Number(count) || 8));
        const prompt = `You are a senior delivery manager at Syskode Technologies W.L.L. Generate ${safeCount} actionable implementation tasks for the REAL project below.

Project:
${JSON.stringify(project, null, 2)}

Assigned project members:
${JSON.stringify(members, null, 2)}

Additional instructions:
${instructions || "None"}

Target due date if supplied: ${dueDate || "Use sensible dates based on the project completion date"}

Rules:
- Use only the provided project context. Do not invent client systems, integrations, requirements, people or credentials.
- If project details are insufficient, generate only tasks that are safely implied by the supplied description/stage.
- Prefer assigning tasks to the provided project members by matching role/responsibility. If there is no suitable assigned member, use "Unassigned".
- Break work into concrete delivery tasks, not generic advice.
- Keep estimated hours realistic and numeric.
- Priority must be Low, Medium, High or Critical.
- Return JSON only: {"tasks":[{"taskName":"","module":"","description":"","assignedMember":"","priority":"Medium","estimatedHours":4,"dueDate":"YYYY-MM-DD"}]}`;
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" },
        });
        const parsed = JSON.parse(response.text || "{}");
        res.json({ success: true, tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [] });
    }
    catch (error) {
        console.error("Error in generate-project-tasks:", error);
        res.status(500).json({ success: false, error: error?.message || "Unable to generate project tasks." });
    }
});

// AI Endpoint: Build a complete editable Syskode proposal from an uploaded RFQ.
app.post("/api/ai/create-proposal-from-rfq", async (req, res) => {
    try {
        const { fileBase64, mimeType, fileName, targetProposalName, clientName, companyName, proposalCategory, instructions, } = req.body || {};
        if (!fileBase64 || !mimeType) {
            return res.status(400).json({ success: false, error: "Upload an RFQ PDF before generating the proposal." });
        }
        const ai = getAIClient();
        if (!ai) {
            return res.status(503).json({
                success: false,
                error: "GEMINI_API_KEY is not configured on the server. Add it in Render environment variables to create proposals from RFQs.",
            });
        }
        const prompt = `You are the senior proposal manager for Syskode Technologies W.L.L., Kingdom of Bahrain.

Read the attached RFQ carefully and produce a complete, editable proposal for Syskode. The proposal must follow this house structure, inspired by Syskode's established proposal format but with modern, concise business writing:
1. Cover Letter
2. About Us
3. Your Partner for Software Innovation
4. Introduction
5. Project Deliverables
   - Executive Summary
   - Project Objectives
   - Scope of Work
   - Functional / Module details
   - Integrations and technical considerations when requested by the RFQ
6. Timeline
7. Pricing / Commercials
8. Contract Terms and Client Requirements
9. Our Process
10. Quality Assurance and Change Request
11. Acceptance Period and Terms & Conditions
12. Cancellation, Copyright and Reporting & Delivery
13. Acceptance

Proposal metadata:
- Proposal name: "${targetProposalName || "Syskode Proposal"}"
- Proposal category: "${proposalCategory || "Combined Proposal"}"
- Client/contact: "${clientName || ""}"
- Client company: "${companyName || ""}"
- Additional author instructions: "${instructions || "None"}"

Rules:
- Base technical scope, deliverables, quantities, integrations, mandatory requirements, compliance items and timelines on the RFQ. Do not silently invent RFQ requirements.
- Rephrase RFQ requirements into clear Syskode solution language while preserving their meaning.
- Do not invent commercial prices. If the RFQ contains no pricing, create an editable pricing table with "To be confirmed" values rather than fabricated amounts.
- Do not invent certifications, awards, client names, technical guarantees or legal claims.
- Use "Syskode Technologies W.L.L." or "Syskode" as the bidder/provider name.
- Keep client/company names from the RFQ intact.
- Use tables when the RFQ presents matrix-like scope, timeline, pricing, SLA, deliverables or compliance data.
- The output is an editable proposal builder, so split content into practical sections and blocks rather than one long narrative.
- Do not create image or signature blocks. The user can insert those manually.
- For the Acceptance section, include signature-ready text for both Syskode and the client, but do not invent the client's signatory name.

Return JSON only in this exact shape:
{
  "rfqSummary": "Short summary of the RFQ and requested solution",
  "assumptions": ["Only assumptions that are necessary because the RFQ is silent or ambiguous"],
  "sections": [
    {
      "name": "Section name",
      "blocks": [
        {"type":"heading","text":"Heading"},
        {"type":"subheading","text":"Subheading"},
        {"type":"paragraph","text":"Paragraph text"},
        {"type":"points","points":["Point one","Point two"]},
        {"type":"table","tableCaption":"Optional caption","tableHeaders":["Column 1","Column 2"],"tableRows":[["Value 1","Value 2"]]}
      ]
    }
  ],
  "notes": "Short generation note"
}

Only use block types heading, subheading, paragraph, points and table.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [{
                    role: "user",
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType, data: fileBase64 } },
                    ],
                }],
            config: { responseMimeType: "application/json" },
        });
        const parsed = JSON.parse(response.text || "{}");
        const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
        return res.json({
            success: true,
            rfqSummary: parsed.rfqSummary || "",
            assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
            sections,
            notes: parsed.notes || "",
        });
    }
    catch (error) {
        console.error("Error in create-proposal-from-rfq:", error);
        res.status(500).json({ success: false, error: error?.message || "Unable to create proposal from RFQ." });
    }
});
// AI Endpoint: Extract a selected section range from an uploaded vendor proposal
// and convert it into editable Syskode proposal-builder sections.
app.post("/api/ai/extract-vendor-proposal-sections", async (req, res) => {
    try {
        const { fileBase64, mimeType, fileName, vendorName, fromHeading, toHeading, targetProposalName, clientName, companyName, } = req.body || {};
        if (!fileBase64 || !mimeType) {
            return res.status(400).json({ success: false, error: "A vendor proposal file is required." });
        }
        const ai = getAIClient();
        if (!ai) {
            return res.status(503).json({
                success: false,
                error: "GEMINI_API_KEY is not configured on the server. Add it in Render environment variables to use vendor proposal extraction.",
            });
        }
        const prompt = `You are a proposal migration assistant for Syskode Technologies W.L.L.

A competitor/vendor proposal named "${fileName || "Vendor Proposal"}" from "${vendorName || "the vendor"}" is attached.
${fromHeading && toHeading ? `Use only the content beginning at the heading "${fromHeading}" and ending at the heading "${toHeading}" (include both boundary headings when they exist).` : "Use the full vendor proposal."}

Convert the selected content into a clean, editable Syskode proposal. Requirements:
1. Preserve the meaning, scope, technical requirements, lists, tables, commercial concepts and client-specific requirements from the selected content.
2. Replace references to the vendor/competitor company (including close variants of "${vendorName || "the vendor"}") with "Syskode Technologies W.L.L." or "Syskode" as grammatically appropriate.
3. Do NOT replace the client name, customer company, product names, technology names, third-party brands or people unless they are clearly the competitor/vendor identity.
4. Rewrite sentences sufficiently for a professional Syskode proposal; do not mention that the text came from a competitor.
5. Target proposal: "${targetProposalName || "Syskode Proposal"}".
6. Client/contact: "${clientName || ""}". Client company: "${companyName || ""}".
7. Return JSON only in this shape:
{
  "sections": [
    {
      "name": "Section name",
      "blocks": [
        {"type":"heading","text":"Heading"},
        {"type":"subheading","text":"Subheading"},
        {"type":"paragraph","text":"Paragraph text"},
        {"type":"points","points":["Point one","Point two"]},
        {"type":"table","tableCaption":"Optional caption","tableHeaders":["Column 1","Column 2"],"tableRows":[["Value 1","Value 2"]]}
      ]
    }
  ],
  "sourceRangeFound": true,
  "notes": "short note"
}
Only use block types heading, subheading, paragraph, points, and table. Use table when the source contains a real table. Do not invent images or signatures.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [{
                    role: "user",
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType, data: fileBase64 } },
                    ],
                }],
            config: { responseMimeType: "application/json" },
        });
        const parsed = JSON.parse(response.text || "{}");
        const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
        return res.json({
            success: true,
            sections,
            sourceRangeFound: parsed.sourceRangeFound !== false,
            notes: parsed.notes || "",
        });
    }
    catch (error) {
        console.error("Error in extract-vendor-proposal-sections:", error);
        res.status(500).json({ success: false, error: error?.message || "Unable to analyze vendor proposal." });
    }
});
// AI Endpoint: Compare Proposals (Syskode vs Vendor)
app.post("/api/ai/compare-proposals", async (req, res) => {
    try {
        const { syskodeProposal, syskodePricing, competitorName, vendorProposal, vendorPricing } = req.body;
        const ai = getAIClient();
        if (!ai) {
            return res.status(503).json({ success: false, error: "GEMINI_API_KEY is not configured on the server." });
        }
        const prompt = `You are a competitive sales strategy consultant for Syskode Technologies W.L.L.
Compare Syskode's Proposal/Pricing against Competitor/Vendor "${competitorName || "Competitor"}" proposal/pricing:

Syskode Proposal Details: ${JSON.stringify(syskodeProposal || {})}
Syskode Pricing Details: ${JSON.stringify(syskodePricing || {})}

Competitor Proposal Details: ${JSON.stringify(vendorProposal || {})}
Competitor Pricing Details: ${JSON.stringify(vendorPricing || {})}

Generate a structured JSON response with keys:
- matrix (array of objects with { area, syskode, competitor, difference })
- syskodeAdvantages (array of strings)
- competitorAdvantages (array of strings)
- missingFeaturesInCompetitor (array of strings)
- priceDifference (string)
- commercialRisks (array of strings)
- negotiationStrategy (array of strings)
- salesTalkingPoints (array of strings)
`;
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        const comparison = JSON.parse(response.text || "{}");
        res.json({ success: true, comparison });
    }
    catch (error) {
        console.error("Error in compare-proposals:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// AI Endpoint: Generate Test Cases
app.post("/api/ai/generate-test-cases", async (req, res) => {
    try {
        const { projectType, projectDescription, modules, websiteUrl } = req.body;
        const ai = getAIClient();
        if (!ai) {
            return res.status(503).json({ success: false, error: "GEMINI_API_KEY is not configured on the server." });
        }
        const prompt = `You are a QA lead engineer at Syskode Technologies W.L.L.
Generate structured test cases for project type: "${projectType || "Web Application"}"
Description: "${projectDescription || "Enterprise management portal"}"
Modules specified: ${JSON.stringify(modules || ["Auth", "Dashboard", "CRUD", "Forms", "Security"])}
Target URL/Specs: "${websiteUrl || "N/A"}"

Return JSON as an array of test case objects, each containing:
- module (string)
- feature (string)
- scenario (string)
- preconditions (string)
- steps (array of strings)
- expectedResult (string)
- priority ("Low" | "Medium" | "High" | "Critical")
- severity ("Minor" | "Major" | "Critical" | "Blocker")
`;
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        const testCases = JSON.parse(response.text || "[]");
        res.json({ success: true, testCases });
    }
    catch (error) {
        console.error("Error in generate-test-cases:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// AI Endpoint: Project Assistant Analysis
app.post("/api/ai/project-assistant", async (req, res) => {
    try {
        const { action, projectDetails } = req.body;
        const ai = getAIClient();
        if (!ai) {
            return res.status(503).json({ success: false, error: "GEMINI_API_KEY is not configured on the server." });
        }
        const prompt = `You are the Syskode AI Project Assistant.
Action requested: "${action}"
Project Data: ${JSON.stringify(projectDetails || {})}

Provide a comprehensive JSON response containing:
- title (string)
- summary (string)
- keyRisks (array of strings)
- recommendedActions (array of strings)
- checklists (array of strings)
`;
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        const analysis = JSON.parse(response.text || "{}");
        res.json({ success: true, analysis });
    }
    catch (error) {
        console.error("Error in project-assistant:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// -----------------------------------------------------------------------------
// Employee / Role / Permission Administration
// Uses the Supabase service-role key ONLY on the Node server. Never expose this
// key through a VITE_* variable or send it to the browser.
// -----------------------------------------------------------------------------
let adminSupabase = null;
function getAdminSupabase() {
    if (adminSupabase)
        return adminSupabase;
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
        throw new Error("Employee management requires SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL (or VITE_SUPABASE_URL) in the server .env file.");
    }
    adminSupabase = createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    return adminSupabase;
}
const validRoles = new Set(["Admin", "Management", "Sales", "Project Manager", "Developer", "QA"]);
function profileToClient(row) {
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        email: row.email,
        role: row.role,
        department: row.department || undefined,
        phone: row.phone || undefined,
        avatar: row.avatar_url || undefined,
        jobTitle: row.job_title || undefined,
        employeeCode: row.employee_code || undefined,
        status: row.status || "Active",
        permissions: Array.isArray(row.permissions) ? row.permissions : [],
        permissionsCustomized: Boolean(row.permissions_customized)
    };
}
async function requireUserManager(req, res, next) {
    try {
        const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
        if (!token)
            return res.status(401).json({ error: "Missing authenticated session." });
        const admin = getAdminSupabase();
        const { data: authData, error: authError } = await admin.auth.getUser(token);
        if (authError || !authData.user)
            return res.status(401).json({ error: "Invalid or expired session." });
        const { data: profile, error: profileError } = await admin
            .from("profiles")
            .select("*")
            .eq("user_id", authData.user.id)
            .maybeSingle();
        if (profileError || !profile)
            return res.status(403).json({ error: "No employee profile is linked to this account." });
        if (profile.status === "Inactive")
            return res.status(403).json({ error: "This employee account is inactive." });
        const customPermissions = Array.isArray(profile.permissions) ? profile.permissions : [];
        const canManage = profile.role === "Admin" || (profile.permissions_customized
            ? customPermissions.includes("manage_users")
            : profile.role === "Management");
        if (!canManage)
            return res.status(403).json({ error: "You do not have permission to manage employees." });
        req.syskodeRequester = { authUser: authData.user, profile };
        next();
    }
    catch (error) {
        res.status(500).json({ error: error?.message || "Unable to validate employee management permission." });
    }
}
app.get("/api/admin/users", requireUserManager, async (_req, res) => {
    try {
        const admin = getAdminSupabase();
        const { data, error } = await admin.from("profiles").select("*").order("name");
        if (error)
            throw error;
        res.json({ users: (data || []).map(profileToClient) });
    }
    catch (error) {
        res.status(500).json({ error: error?.message || "Unable to load employees." });
    }
});
app.post("/api/admin/users", requireUserManager, async (req, res) => {
    try {
        const admin = getAdminSupabase();
        const { name, email, password, role = "Sales", department, phone, jobTitle, employeeCode, status = "Active", permissions = [], permissionsCustomized = true } = req.body || {};
        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({ error: "Name, email and temporary password are required." });
        }
        if (String(password).length < 8)
            return res.status(400).json({ error: "Password must be at least 8 characters." });
        if (!validRoles.has(role))
            return res.status(400).json({ error: "Invalid employee role." });
        const { data: created, error: createError } = await admin.auth.admin.createUser({
            email: String(email).trim().toLowerCase(),
            password: String(password),
            email_confirm: true,
            user_metadata: { name: String(name).trim() }
        });
        if (createError)
            throw createError;
        if (!created.user)
            throw new Error("Supabase did not return the new user.");
        const profilePayload = {
            user_id: created.user.id,
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            role,
            department: department || null,
            phone: phone || null,
            job_title: jobTitle || null,
            employee_code: employeeCode || null,
            status: status === "Inactive" ? "Inactive" : "Active",
            permissions: Array.isArray(permissions) ? permissions : [],
            permissions_customized: Boolean(permissionsCustomized)
        };
        let { data: profile, error: updateError } = await admin
            .from("profiles")
            .update(profilePayload)
            .eq("user_id", created.user.id)
            .select("*")
            .maybeSingle();
        if (updateError)
            throw updateError;
        if (!profile) {
            const inserted = await admin.from("profiles").insert(profilePayload).select("*").single();
            if (inserted.error)
                throw inserted.error;
            profile = inserted.data;
        }
        res.status(201).json({ user: profileToClient(profile) });
    }
    catch (error) {
        res.status(400).json({ error: error?.message || "Unable to create employee." });
    }
});
app.patch("/api/admin/users/:profileId", requireUserManager, async (req, res) => {
    try {
        const admin = getAdminSupabase();
        const { data: existing, error: existingError } = await admin
            .from("profiles").select("*").eq("id", req.params.profileId).maybeSingle();
        if (existingError)
            throw existingError;
        if (!existing)
            return res.status(404).json({ error: "Employee not found." });
        const body = req.body || {};
        if (body.role && !validRoles.has(body.role))
            return res.status(400).json({ error: "Invalid employee role." });
        const authChanges = {};
        if (body.email && body.email !== existing.email) {
            authChanges.email = String(body.email).trim().toLowerCase();
            authChanges.email_confirm = true;
        }
        if (body.password) {
            if (String(body.password).length < 8)
                return res.status(400).json({ error: "Password must be at least 8 characters." });
            authChanges.password = String(body.password);
        }
        if (Object.keys(authChanges).length) {
            const { error } = await admin.auth.admin.updateUserById(existing.user_id, authChanges);
            if (error)
                throw error;
        }
        const update = {};
        const mappings = {
            name: "name", email: "email", role: "role", department: "department", phone: "phone",
            jobTitle: "job_title", employeeCode: "employee_code", status: "status",
            permissions: "permissions", permissionsCustomized: "permissions_customized"
        };
        for (const [clientKey, dbKey] of Object.entries(mappings)) {
            if (body[clientKey] !== undefined)
                update[dbKey] = body[clientKey];
        }
        if (update.email)
            update.email = String(update.email).trim().toLowerCase();
        update.updated_at = new Date().toISOString();
        const { data: profile, error } = await admin.from("profiles").update(update).eq("id", existing.id).select("*").single();
        if (error)
            throw error;
        res.json({ user: profileToClient(profile) });
    }
    catch (error) {
        res.status(400).json({ error: error?.message || "Unable to update employee." });
    }
});
app.delete("/api/admin/users/:profileId", requireUserManager, async (req, res) => {
    try {
        const admin = getAdminSupabase();
        const { data: existing, error } = await admin.from("profiles").select("*").eq("id", req.params.profileId).maybeSingle();
        if (error)
            throw error;
        if (!existing)
            return res.status(404).json({ error: "Employee not found." });
        if (existing.user_id === req.syskodeRequester.authUser.id) {
            return res.status(400).json({ error: "You cannot delete the account you are currently signed in with." });
        }
        const deleted = await admin.auth.admin.deleteUser(existing.user_id);
        if (deleted.error)
            throw deleted.error;
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error?.message || "Unable to delete employee." });
    }
});
// -----------------------------------------------------------------------------
// Zoho Books OAuth + Project Billing
// OAuth tokens remain server-side and are encrypted before being stored in
// Supabase. Browser clients never receive Zoho access/refresh tokens.
// -----------------------------------------------------------------------------
const ZOHO_BOOKS_SCOPES = [
    "ZohoBooks.contacts.ALL",
    "ZohoBooks.invoices.ALL",
    "ZohoBooks.settings.READ",
].join(",");
function serverProfileHas(profile, permission) {
    if (profile?.role === "Admin")
        return true;
    const custom = Array.isArray(profile?.permissions) ? profile.permissions : [];
    if (profile?.permissions_customized)
        return custom.includes(permission);
    const defaults = {
        Management: ["manage_projects", "manage_settings", "manage_users"],
        "Project Manager": ["manage_projects"],
        Sales: [], Developer: [], QA: [],
    };
    return (defaults[profile?.role] || []).includes(permission);
}
async function requireAuthenticatedProfile(req, res, next) {
    try {
        const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
        if (!token)
            return res.status(401).json({ error: "Missing authenticated session." });
        const admin = getAdminSupabase();
        const { data: authData, error: authError } = await admin.auth.getUser(token);
        if (authError || !authData.user)
            return res.status(401).json({ error: "Invalid or expired session." });
        const { data: profile, error: profileError } = await admin.from("profiles").select("*").eq("user_id", authData.user.id).maybeSingle();
        if (profileError || !profile)
            return res.status(403).json({ error: "No employee profile is linked to this account." });
        if (profile.status === "Inactive")
            return res.status(403).json({ error: "This employee account is inactive." });
        req.syskodeRequester = { authUser: authData.user, profile };
        next();
    }
    catch (error) {
        res.status(500).json({ error: error?.message || "Unable to validate authenticated session." });
    }
}
function requireZohoAdmin(req, res, next) {
    return requireAuthenticatedProfile(req, res, () => {
        const profile = req.syskodeRequester.profile;
        if (!serverProfileHas(profile, "manage_settings") && !serverProfileHas(profile, "manage_users")) {
            return res.status(403).json({ error: "Only Admin/Management users can configure Zoho Books." });
        }
        next();
    });
}
function requireBillingManager(req, res, next) {
    return requireAuthenticatedProfile(req, res, () => {
        if (!serverProfileHas(req.syskodeRequester.profile, "manage_projects")) {
            return res.status(403).json({ error: "You do not have permission to create project invoices." });
        }
        next();
    });
}
function tokenCryptoKey() {
    const seed = process.env.ZOHO_TOKEN_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!seed)
        throw new Error("ZOHO_TOKEN_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY is required for Zoho token encryption.");
    return createHash("sha256").update(seed).digest();
}
function encryptSecret(value) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", tokenCryptoKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv, tag, encrypted].map(v => v.toString("base64url")).join(".");
}
function decryptSecret(value) {
    if (!value)
        return "";
    const [ivRaw, tagRaw, bodyRaw] = value.split(".");
    const decipher = createDecipheriv("aes-256-gcm", tokenCryptoKey(), Buffer.from(ivRaw, "base64url"));
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(bodyRaw, "base64url")), decipher.final()]).toString("utf8");
}
function oauthStateSecret() {
    return process.env.ZOHO_OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "syskode-zoho-books";
}
function signOAuthState(userId) {
    const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 10 * 60 * 1000 })).toString("base64url");
    const signature = createHmac("sha256", oauthStateSecret()).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}
function verifyOAuthState(state) {
    const [payload, signature] = String(state || "").split(".");
    if (!payload || !signature)
        throw new Error("Invalid OAuth state.");
    const expected = createHmac("sha256", oauthStateSecret()).update(payload).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied))
        throw new Error("OAuth state verification failed.");
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed.userId || Number(parsed.exp) < Date.now())
        throw new Error("OAuth state expired.");
    return parsed;
}
function zohoAccountsUrl() {
    return (process.env.ZOHO_BOOKS_ACCOUNTS_URL || "https://accounts.zoho.com").replace(/\/$/, "");
}
function zohoRedirectUri(req) {
    return process.env.ZOHO_BOOKS_REDIRECT_URI || `${req.protocol}://${req.get("host")}/api/zoho-books/callback`;
}
async function zohoFetchJson(url, init = {}) {
    const response = await fetch(url, init);
    const text = await response.text();
    let json = {};
    try {
        json = text ? JSON.parse(text) : {};
    }
    catch {
        json = { message: text };
    }
    if (!response.ok || (json.code !== undefined && Number(json.code) !== 0)) {
        throw new Error(json.message || json.error || `Zoho Books request failed (${response.status}).`);
    }
    return json;
}
async function getZohoConnection() {
    const admin = getAdminSupabase();
    const { data, error } = await admin.from("zoho_books_connections").select("*").eq("id", "default").maybeSingle();
    if (error)
        throw error;
    return data;
}
async function getZohoAccessToken() {
    const connection = await getZohoConnection();
    if (!connection)
        throw new Error("Zoho Books is not connected. Connect it from Settings → Zoho Books.");
    const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
    if (connection.access_token_encrypted && expiresAt > Date.now() + 120000) {
        return { accessToken: decryptSecret(connection.access_token_encrypted), connection };
    }
    const clientId = process.env.ZOHO_BOOKS_CLIENT_ID;
    const clientSecret = process.env.ZOHO_BOOKS_CLIENT_SECRET;
    if (!clientId || !clientSecret)
        throw new Error("ZOHO_BOOKS_CLIENT_ID and ZOHO_BOOKS_CLIENT_SECRET are not configured.");
    const refreshToken = decryptSecret(connection.refresh_token_encrypted);
    const body = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
    });
    const tokenData = await zohoFetchJson(`${connection.accounts_url || zohoAccountsUrl()}/oauth/v2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
    const accessToken = tokenData.access_token;
    if (!accessToken)
        throw new Error("Zoho did not return a refreshed access token.");
    const apiDomain = tokenData.api_domain || connection.api_domain || "https://www.zohoapis.com";
    const { data: updated, error } = await getAdminSupabase().from("zoho_books_connections").update({
        access_token_encrypted: encryptSecret(accessToken),
        token_expires_at: new Date(Date.now() + (Number(tokenData.expires_in || 3600) * 1000)).toISOString(),
        api_domain: apiDomain,
        updated_at: new Date().toISOString(),
    }).eq("id", "default").select("*").single();
    if (error)
        throw error;
    return { accessToken, connection: updated };
}
app.get("/api/zoho-books/status", requireAuthenticatedProfile, async (_req, res) => {
    try {
        const connection = await getZohoConnection();
        res.json(connection ? {
            connected: true,
            organizationId: connection.organization_id,
            organizationName: connection.organization_name,
            connectedAt: connection.connected_at,
            scopes: connection.scopes,
            defaultItemId: connection.default_item_id || undefined,
            defaultItemName: connection.default_item_name || undefined,
        } : { connected: false });
    }
    catch (error) {
        res.status(500).json({ error: error?.message || "Unable to load Zoho Books connection status." });
    }
});
app.get("/api/zoho-books/connect", requireZohoAdmin, async (req, res) => {
    try {
        const clientId = process.env.ZOHO_BOOKS_CLIENT_ID;
        const clientSecret = process.env.ZOHO_BOOKS_CLIENT_SECRET;
        if (!clientId || !clientSecret)
            return res.status(400).json({ error: "Add ZOHO_BOOKS_CLIENT_ID and ZOHO_BOOKS_CLIENT_SECRET to the Render environment first." });
        const params = new URLSearchParams({
            scope: ZOHO_BOOKS_SCOPES,
            client_id: clientId,
            response_type: "code",
            access_type: "offline",
            prompt: "consent",
            redirect_uri: zohoRedirectUri(req),
            state: signOAuthState(req.syskodeRequester.authUser.id),
        });
        res.json({ authorizationUrl: `${zohoAccountsUrl()}/oauth/v2/auth?${params.toString()}` });
    }
    catch (error) {
        res.status(500).json({ error: error?.message || "Unable to start Zoho Books authorization." });
    }
});
app.get("/api/zoho-books/callback", async (req, res) => {
    try {
        const { code, state, error: oauthError } = req.query || {};
        if (oauthError)
            throw new Error(`Zoho authorization failed: ${oauthError}`);
        if (!code || !state)
            throw new Error("Zoho did not return the authorization code/state.");
        const stateData = verifyOAuthState(String(state));
        const clientId = process.env.ZOHO_BOOKS_CLIENT_ID;
        const clientSecret = process.env.ZOHO_BOOKS_CLIENT_SECRET;
        if (!clientId || !clientSecret)
            throw new Error("Zoho Books OAuth client credentials are not configured.");
        const body = new URLSearchParams({
            code: String(code),
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: zohoRedirectUri(req),
            grant_type: "authorization_code",
        });
        const tokenData = await zohoFetchJson(`${zohoAccountsUrl()}/oauth/v2/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
        });
        if (!tokenData.access_token || !tokenData.refresh_token)
            throw new Error("Zoho did not return both access and refresh tokens. Reconnect and approve offline access.");
        const apiDomain = tokenData.api_domain || "https://www.zohoapis.com";
        const organizations = await zohoFetchJson(`${apiDomain}/books/v3/organizations`, {
            headers: { Authorization: `Zoho-oauthtoken ${tokenData.access_token}` },
        });
        const orgs = Array.isArray(organizations.organizations) ? organizations.organizations : [];
        const organization = orgs.find((org) => org.is_default_org) || orgs[0];
        if (!organization?.organization_id)
            throw new Error("No Zoho Books organization was available for the connected account.");
        const payload = {
            id: "default",
            access_token_encrypted: encryptSecret(tokenData.access_token),
            refresh_token_encrypted: encryptSecret(tokenData.refresh_token),
            token_expires_at: new Date(Date.now() + (Number(tokenData.expires_in || 3600) * 1000)).toISOString(),
            api_domain: apiDomain,
            accounts_url: zohoAccountsUrl(),
            organization_id: String(organization.organization_id),
            organization_name: organization.name || null,
            scopes: ZOHO_BOOKS_SCOPES,
            connected_by: stateData.userId,
            connected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        const { error } = await getAdminSupabase().from("zoho_books_connections").upsert(payload, { onConflict: "id" });
        if (error)
            throw error;
        res.redirect("/?zoho_books=connected");
    }
    catch (error) {
        console.error("Zoho Books callback error:", error);
        const message = encodeURIComponent(error?.message || "Zoho Books connection failed.");
        res.redirect(`/?zoho_books=error&message=${message}`);
    }
});
app.get("/api/zoho-books/items", requireZohoAdmin, async (_req, res) => {
    try {
        const { accessToken, connection } = await getZohoAccessToken();
        const apiDomain = connection.api_domain || "https://www.zohoapis.com";
        const result = await zohoFetchJson(`${apiDomain}/books/v3/items?organization_id=${encodeURIComponent(connection.organization_id)}&filter_by=Status.Active&per_page=200`, {
            headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
        });
        const items = (Array.isArray(result.items) ? result.items : []).map((item) => ({
            itemId: String(item.item_id || ""),
            name: item.name || "Unnamed Item",
            rate: Number(item.rate || 0),
            description: item.description || "",
            status: item.status || "active",
        })).filter((item) => item.itemId);
        res.json({ success: true, items });
    }
    catch (error) {
        res.status(400).json({ error: error?.message || "Unable to list Zoho Books items." });
    }
});
app.post("/api/zoho-books/default-item", requireZohoAdmin, async (req, res) => {
    try {
        const itemId = String(req.body?.itemId || "").trim();
        if (!itemId)
            return res.status(400).json({ error: "Select a Zoho Books service item." });
        const { accessToken, connection } = await getZohoAccessToken();
        const apiDomain = connection.api_domain || "https://www.zohoapis.com";
        const result = await zohoFetchJson(`${apiDomain}/books/v3/items/${encodeURIComponent(itemId)}?organization_id=${encodeURIComponent(connection.organization_id)}`, {
            headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
        });
        const item = result.item;
        if (!item?.item_id)
            return res.status(404).json({ error: "Zoho Books item was not found." });
        const { error } = await getAdminSupabase().from("zoho_books_connections").update({
            default_item_id: String(item.item_id),
            default_item_name: item.name || null,
            updated_at: new Date().toISOString(),
        }).eq("id", "default");
        if (error)
            throw error;
        res.json({ success: true, item: { itemId: String(item.item_id), name: item.name || "Zoho Books Item" } });
    }
    catch (error) {
        res.status(400).json({ error: error?.message || "Unable to save the default Zoho Books item." });
    }
});
app.post("/api/zoho-books/disconnect", requireZohoAdmin, async (_req, res) => {
    try {
        const { error } = await getAdminSupabase().from("zoho_books_connections").delete().eq("id", "default");
        if (error)
            throw error;
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error?.message || "Unable to disconnect Zoho Books." });
    }
});
function mapZohoInvoiceStatus(status) {
    const value = String(status || "").toLowerCase();
    if (value === "paid")
        return "Paid";
    if (value.includes("partial"))
        return "Partially Paid";
    if (value === "void")
        return "Void";
    return "Invoiced";
}
app.post("/api/zoho-books/invoices", requireBillingManager, async (req, res) => {
    try {
        const projectId = req.body?.project?.id;
        const milestoneId = req.body?.milestone?.id;
        if (!projectId || !milestoneId)
            return res.status(400).json({ error: "Project and billing milestone are required." });
        const admin = getAdminSupabase();
        const [{ data: project, error: projectError }, { data: milestone, error: milestoneError }] = await Promise.all([
            admin.from("projects").select("*").eq("id", projectId).maybeSingle(),
            admin.from("project_billing_milestones").select("*").eq("id", milestoneId).eq("project_id", projectId).maybeSingle(),
        ]);
        if (projectError)
            throw projectError;
        if (milestoneError)
            throw milestoneError;
        if (!project || !milestone)
            return res.status(404).json({ error: "Project or billing milestone not found." });
        if (milestone.zoho_invoice_id)
            return res.status(409).json({ error: `This milestone is already invoiced as ${milestone.zoho_invoice_number || milestone.zoho_invoice_id}.` });
        const { accessToken, connection } = await getZohoAccessToken();
        const apiDomain = connection.api_domain || "https://www.zohoapis.com";
        const orgId = connection.organization_id;
        let customerId = project.zoho_books_customer_id || milestone.zoho_contact_id;
        const customer = req.body?.customer || {};
        if (!customerId) {
            const contactPayload = {
                contact_name: customer.company || customer.name || project.client || project.project_name,
                company_name: customer.company || project.client || undefined,
                contact_type: "customer",
            };
            if (customer.email || customer.phone) {
                const nameParts = String(customer.name || customer.company || project.client || "Client").trim().split(/\s+/);
                contactPayload.contact_persons = [{
                        first_name: nameParts[0] || "Client",
                        last_name: nameParts.slice(1).join(" ") || undefined,
                        email: customer.email || undefined,
                        phone: customer.phone || undefined,
                        is_primary_contact: true,
                    }];
            }
            const contactResponse = await zohoFetchJson(`${apiDomain}/books/v3/contacts?organization_id=${encodeURIComponent(orgId)}`, {
                method: "POST",
                headers: { Authorization: `Zoho-oauthtoken ${accessToken}`, "Content-Type": "application/json" },
                body: JSON.stringify(contactPayload),
            });
            customerId = String(contactResponse.contact?.contact_id || "");
            if (!customerId)
                throw new Error("Zoho Books created the customer but did not return a customer ID.");
            const { error: projectUpdateError } = await admin.from("projects").update({ zoho_books_customer_id: customerId }).eq("id", project.id);
            if (projectUpdateError)
                throw projectUpdateError;
        }
        const itemId = connection.default_item_id || process.env.ZOHO_BOOKS_ITEM_ID;
        if (!itemId) {
            return res.status(400).json({
                error: "Select a default service item in Settings → Zoho Books before creating invoices.",
            });
        }
        const lineItem = {
            item_id: itemId,
            description: `${project.project_name} — ${milestone.title} (${Number(milestone.percentage)}%)\n${milestone.trigger_label || "Project milestone"}`,
            rate: Number(milestone.amount),
            quantity: 1,
        };
        const invoicePayload = {
            customer_id: customerId,
            date: new Date().toISOString().slice(0, 10),
            reference_number: `${project.project_id || project.id} / ${milestone.title}`.slice(0, 100),
            line_items: [lineItem],
            notes: milestone.notes || `Project billing milestone: ${milestone.trigger_label}`,
        };
        if (milestone.due_date)
            invoicePayload.due_date = milestone.due_date;
        const invoiceResponse = await zohoFetchJson(`${apiDomain}/books/v3/invoices?organization_id=${encodeURIComponent(orgId)}`, {
            method: "POST",
            headers: { Authorization: `Zoho-oauthtoken ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify(invoicePayload),
        });
        const invoice = invoiceResponse.invoice || {};
        const total = Number(invoice.total ?? milestone.amount) || Number(milestone.amount);
        const balance = Number(invoice.balance ?? total);
        const amountPaid = Math.max(0, total - balance);
        const now = new Date().toISOString();
        const update = {
            status: mapZohoInvoiceStatus(invoice.status),
            zoho_invoice_id: String(invoice.invoice_id || ""),
            zoho_invoice_number: invoice.invoice_number || null,
            zoho_invoice_status: invoice.status || "draft",
            zoho_contact_id: customerId,
            amount_paid: amountPaid,
            invoiced_at: now,
            last_synced_at: now,
            updated_at: now,
        };
        if (!update.zoho_invoice_id)
            throw new Error("Zoho Books did not return an invoice ID.");
        const { data: saved, error: saveError } = await admin.from("project_billing_milestones").update(update).eq("id", milestone.id).select("*").single();
        if (saveError)
            throw saveError;
        res.json({ success: true, invoice: { id: update.zoho_invoice_id, number: update.zoho_invoice_number, status: update.zoho_invoice_status, total, balance }, milestone: saved });
    }
    catch (error) {
        console.error("Zoho Books create invoice error:", error);
        res.status(400).json({ error: error?.message || "Unable to create Zoho Books invoice." });
    }
});
app.post("/api/zoho-books/invoices/:milestoneId/refresh", requireBillingManager, async (req, res) => {
    try {
        const admin = getAdminSupabase();
        const { data: milestone, error } = await admin.from("project_billing_milestones").select("*").eq("id", req.params.milestoneId).maybeSingle();
        if (error)
            throw error;
        if (!milestone?.zoho_invoice_id)
            return res.status(404).json({ error: "This billing milestone does not have a Zoho Books invoice yet." });
        const { accessToken, connection } = await getZohoAccessToken();
        const apiDomain = connection.api_domain || "https://www.zohoapis.com";
        const result = await zohoFetchJson(`${apiDomain}/books/v3/invoices/${encodeURIComponent(milestone.zoho_invoice_id)}?organization_id=${encodeURIComponent(connection.organization_id)}`, {
            headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
        });
        const invoice = result.invoice || {};
        const total = Number(invoice.total ?? milestone.amount) || Number(milestone.amount);
        const balance = Number(invoice.balance ?? Math.max(0, total - Number(milestone.amount_paid || 0)));
        const now = new Date().toISOString();
        const update = {
            status: mapZohoInvoiceStatus(invoice.status),
            zoho_invoice_number: invoice.invoice_number || milestone.zoho_invoice_number,
            zoho_invoice_status: invoice.status || milestone.zoho_invoice_status,
            amount_paid: Math.max(0, total - balance),
            last_synced_at: now,
            updated_at: now,
        };
        const { data: saved, error: saveError } = await admin.from("project_billing_milestones").update(update).eq("id", milestone.id).select("*").single();
        if (saveError)
            throw saveError;
        res.json({ success: true, invoice: { id: milestone.zoho_invoice_id, number: update.zoho_invoice_number, status: update.zoho_invoice_status, total, balance }, milestone: saved });
    }
    catch (error) {
        console.error("Zoho Books refresh invoice error:", error);
        res.status(400).json({ error: error?.message || "Unable to refresh Zoho Books invoice." });
    }
});
// Vite middleware in development or static serve in production
async function startServer() {
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    }
    else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (_req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Syskode Project Hub server listening on http://0.0.0.0:${PORT}`);
    });
}
startServer();
