import { diffLines } from "diff";
import { Readable } from "stream";
import cloudinary from "../Lib/cloudinary.js";
import Project from "../Models/projectModel.js";
import Milestone from "../Models/milestoneModel.js";

const normalizeManuscriptToText = (manuscript) => {
    if (!manuscript) return "";
    if (typeof manuscript === "string") return manuscript;

    const lines = [];

    const walk = (node) => {
        if (!node) return;

        if (typeof node === "string") {
            lines.push(node);
            return;
        }

        if (Array.isArray(node)) {
            node.forEach(walk);
            return;
        }

        if (node.text) {
            lines.push(node.text);
        }

        if (Array.isArray(node.content)) {
            node.content.forEach(walk);
        }

        if (["paragraph", "heading", "blockquote", "listItem"].includes(node.type)) {
            lines.push("\n");
        }
    };

    walk(manuscript);
    return lines
        .join("")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

const countLines = (value = "") => {
    if (!value) return 0;
    const normalized = value.endsWith("\n") ? value.slice(0, -1) : value;
    if (!normalized) return 0;
    return normalized.split("\n").length;
};

const getNextVersionName = async (projectId) => {
    const count = await Milestone.countDocuments({ projectId });
    return `v1.${count + 1}`;
};

const toPlainClone = (value) => JSON.parse(JSON.stringify(value ?? null));

const assertProjectOwner = (project, user) => {
    if (!user) return false;
    return String(project.author) === String(user._id);
};

const getUploadFileType = (file) => {
    const mimeType = file.mimetype || "";
    const fileName = file.originalname || "";
    const extension = fileName.split(".").pop()?.toLowerCase();

    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf" || extension === "pdf") return "pdf";
    if (
        mimeType.includes("wordprocessingml") ||
        mimeType === "application/msword" ||
        ["doc", "docx"].includes(extension)
    ) {
        return "doc";
    }
    if (
        mimeType.includes("spreadsheet") ||
        mimeType === "text/csv" ||
        ["csv", "xls", "xlsx"].includes(extension)
    ) {
        return "sheet";
    }

    return "file";
};

const getRelativePath = (paths, index, fallbackName) => {
    const rawPath = paths[index] || fallbackName || "";
    return String(rawPath).replace(/\\/g, "/");
};

const getFolderPath = (relativePath) => {
    if (!relativePath.includes("/")) return "";
    return relativePath.split("/").slice(0, -1).join("/");
};

const uploadBufferToCloudinary = (file, projectId) =>
    new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `Tagore/workspaces/${projectId}`,
                resource_type: "auto",
                use_filename: true,
                unique_filename: true,
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            }
        );

        Readable.from(file.buffer).pipe(uploadStream);
    });

const toWorkspacePayload = (project) => ({
    projectId: project._id,
    title: project.title,
    currentManuscript: project.currentManuscript,
    activePapers: project.activePapers,
    papers: project.paperLibrary?.length
        ? project.paperLibrary
        : project.activePapers.map((paperId) => ({
            id: paperId,
            title: "Untitled Paper",
            type: "paper",
        })),
    uploadedFiles: project.uploadedFiles,
    authoredDocs: project.authoredDocs,
    lastAutoSavedAt: project.lastAutoSavedAt,
});

// 1. Get All Projects (For Discover Page)
export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.status(200).json(projects);
    } catch (error) {
        console.log("Error in getAllProjects:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// 2. Get Single Project (For Paper View)
export const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id).populate("author", "fullName email profilePic");
        
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.status(200).json(project);
    } catch (error) {
        console.log("Error in getProjectById:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// 3. Create a Project (For Seeding/Publishing)
export const createProject = async (req, res) => {
    try {
        const {
            title,
            abstract,
            category,
            fundingGoal,
            imageUrl,
            institution,
            tags,
            content,
            description,
            currentManuscript,
            activePapers,
            paperLibrary,
        } = req.body;
        const userId = req.user._id; // Comes from protectRoute middleware
        const safeTitle = title?.trim() || `Untitled Research Project ${Date.now()}`;
        const safeDescription =
            description?.trim() ||
            abstract?.trim() ||
            `Workspace draft ${userId}-${Date.now()}`;

        const newProject = new Project({
            title: safeTitle,
            abstract: abstract || "",
            content: content || "Full paper content pending...",
            author: userId,
            researcherName: req.user.fullName, // Auto-fill from logged in user
            description: safeDescription,
            institution: institution || "Independent",
            category: category || "Workspace",
            tags: tags || [],
            imageUrl,
            isFundable: fundingGoal > 0,
            fundingGoal: Number(fundingGoal) || 0,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days form now
            currentManuscript,
            activePapers: Array.isArray(activePapers) ? activePapers.map(String) : [],
            paperLibrary: Array.isArray(paperLibrary)
                ? paperLibrary.map((paper) => ({
                    id: String(paper.id),
                    title: paper.title || paper?.bibjson?.title || "Untitled Paper",
                    authors: paper.authors || paper?.bibjson?.author?.map((a) => a.name).join(", ") || "",
                    venue: paper.venue || paper?.bibjson?.journal?.title || "",
                    year: String(paper.year || paper?.bibjson?.year || ""),
                    abstract: paper.abstract || paper?.bibjson?.abstract || "",
                    rawUrl: paper.rawUrl || paper?.bibjson?.link?.[0]?.url || "",
                    pdfUrl: paper.pdfUrl || "",
                }))
                : [],
        });

        await newProject.save();
        res.status(201).json(newProject);

    } catch (error) {
        console.log("Error in createProject:", error);
        if (error?.code === 11000) {
            return res.status(409).json({
                message: "A project with this generated workspace identity already exists. Please try again.",
                duplicateKey: error.keyPattern,
            });
        }
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};

// 4. Auto-save volatile workspace draft
export const updateProjectDraft = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentManuscript, manuscriptContent, content, activePapers, paperLibrary, title } = req.body;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (!assertProjectOwner(project, req.user)) {
            return res.status(403).json({ message: "You do not have access to update this project" });
        }

        const nextManuscript = currentManuscript ?? manuscriptContent ?? content;
        if (nextManuscript !== undefined) {
            project.currentManuscript = nextManuscript;
        }

        if (Array.isArray(activePapers)) {
            project.activePapers = activePapers.map(String);
        }

        if (Array.isArray(paperLibrary)) {
            project.paperLibrary = paperLibrary.map((paper) => ({
                id: String(paper.id),
                title: paper.title || "Untitled Paper",
                authors: paper.authors || "",
                venue: paper.venue || "",
                year: String(paper.year || ""),
                abstract: paper.abstract || "",
                rawUrl: paper.rawUrl || "",
                pdfUrl: paper.pdfUrl || "",
            }));
        }

        if (typeof title === "string" && title.trim()) {
            project.title = title.trim();
        }

        project.lastAutoSavedAt = new Date();
        await project.save();

        res.status(200).json({
            message: "Draft auto-saved",
            projectId: project._id,
            currentManuscript: project.currentManuscript,
            activePapers: project.activePapers,
            papers: project.paperLibrary,
            lastAutoSavedAt: project.lastAutoSavedAt,
        });
    } catch (error) {
        console.log("Error in updateProjectDraft:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// 5. Create an authored workspace document
export const createWorkspaceDoc = async (req, res) => {
    try {
        const { id } = req.params;
        const { type = "text", name, content = "" } = req.body;
        const allowedTypes = ["text", "latex", "docx", "sheet"];

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({ message: "Unsupported document type" });
        }

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (!assertProjectOwner(project, req.user)) {
            return res.status(403).json({ message: "You do not have access to update this workspace" });
        }

        const doc = {
            id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: name || `${type.toUpperCase()} Document ${project.authoredDocs.length + 1}`,
            type,
            content,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        project.authoredDocs.push(doc);
        await project.save();

        res.status(201).json({
            doc,
            workspace: toWorkspacePayload(project),
        });
    } catch (error) {
        console.log("Error in createWorkspaceDoc:", error);
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};

// 5. Fetch the workspace explorer inventory
export const getProjectWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (!assertProjectOwner(project, req.user)) {
            return res.status(403).json({ message: "You do not have access to this workspace" });
        }

        res.status(200).json(toWorkspacePayload(project));
    } catch (error) {
        console.log("Error in getProjectWorkspace:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// 6. Upload files into a workspace project
export const uploadProjectFiles = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id);

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (!assertProjectOwner(project, req.user)) {
            return res.status(403).json({ message: "You do not have access to update this workspace" });
        }

        const files = req.files || [];
        if (!files.length) {
            return res.status(400).json({ message: "At least one file is required" });
        }

        const paths = Array.isArray(req.body.paths)
            ? req.body.paths
            : req.body.paths
              ? [req.body.paths]
              : [];

        const uploadedFiles = await Promise.all(
            files.map(async (file, index) => {
                const result = await uploadBufferToCloudinary(file, project._id);
                const relativePath = getRelativePath(paths, index, file.originalname);

                return {
                    id: result.public_id,
                    name: file.originalname,
                    url: result.secure_url,
                    type: getUploadFileType(file),
                    size: file.size,
                    mimeType: file.mimetype,
                    resourceType: result.resource_type || "auto",
                    folderPath: getFolderPath(relativePath),
                    createdAt: new Date(),
                };
            })
        );

        project.uploadedFiles.push(...uploadedFiles);
        await project.save();

        res.status(201).json({
            uploadedFiles,
            workspace: toWorkspacePayload(project),
        });
    } catch (error) {
        console.log("Error in uploadProjectFiles:", error);
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};

// 5. Seal the current draft as an immutable milestone
export const createMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, evolutionContext, isMajor = false } = req.body;

        if (!title?.trim() || !evolutionContext?.trim()) {
            return res.status(400).json({ message: "Milestone title and evolution context are required" });
        }

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (!assertProjectOwner(project, req.user)) {
            return res.status(403).json({ message: "You do not have access to update this project" });
        }

        const milestone = await Milestone.create({
            projectId: project._id,
            versionName: await getNextVersionName(project._id),
            title: title.trim(),
            evolutionContext: evolutionContext.trim(),
            manuscriptSnapshot: toPlainClone(project.currentManuscript),
            librarySnapshot: toPlainClone(project.activePapers),
            isMajor: Boolean(isMajor),
        });

        res.status(201).json(milestone);
    } catch (error) {
        console.log("Error in createMilestone:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// 6. Fetch newest-first lineage history
export const getProjectMilestones = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.exists({ _id: id });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const milestones = await Milestone.find({ projectId: id }).sort({ createdAt: -1 });
        res.status(200).json(milestones);
    } catch (error) {
        console.log("Error in getProjectMilestones:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// 7. Compare two sealed milestones and return structured scientific diffs
export const compareProjectMilestones = async (req, res) => {
    try {
        const { id } = req.params;
        const fromId = req.query.from || req.query.fromMilestoneId;
        const toId = req.query.to || req.query.toMilestoneId;

        if (!fromId || !toId) {
            return res.status(400).json({
                message: "Both from and to milestone IDs are required",
            });
        }

        const project = await Project.exists({ _id: id });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const [fromMilestone, toMilestone] = await Promise.all([
            Milestone.findOne({ _id: fromId, projectId: id }),
            Milestone.findOne({ _id: toId, projectId: id }),
        ]);

        if (!fromMilestone || !toMilestone) {
            return res.status(404).json({ message: "One or both milestones were not found" });
        }

        const fromText = normalizeManuscriptToText(fromMilestone.manuscriptSnapshot);
        const toText = normalizeManuscriptToText(toMilestone.manuscriptSnapshot);
        const parts = diffLines(fromText, toText);

        const changes = [];
        const summary = {
            added: 0,
            removed: 0,
            modified: 0,
        };

        let lineNumber = 1;
        for (let index = 0; index < parts.length; index += 1) {
            const part = parts[index];
            const nextPart = parts[index + 1];

            if (part.removed && nextPart?.added) {
                const removedCount = countLines(part.value);
                const addedCount = countLines(nextPart.value);
                const modifiedCount = Math.min(removedCount, addedCount);

                summary.modified += modifiedCount;
                summary.removed += Math.max(removedCount - modifiedCount, 0);
                summary.added += Math.max(addedCount - modifiedCount, 0);

                changes.push({
                    type: "modified",
                    lineNumber,
                    removed: part.value,
                    added: nextPart.value,
                    removedLines: removedCount,
                    addedLines: addedCount,
                    modifiedLines: modifiedCount,
                });

                lineNumber += addedCount;
                index += 1;
                continue;
            }

            if (part.added) {
                const addedLines = countLines(part.value);
                summary.added += addedLines;
                changes.push({
                    type: "added",
                    lineNumber,
                    value: part.value,
                    lines: addedLines,
                });
                lineNumber += addedLines;
                continue;
            }

            if (part.removed) {
                const removedLines = countLines(part.value);
                summary.removed += removedLines;
                changes.push({
                    type: "removed",
                    lineNumber,
                    value: part.value,
                    lines: removedLines,
                });
                continue;
            }

            lineNumber += countLines(part.value);
        }

        res.status(200).json({
            projectId: id,
            from: {
                id: fromMilestone._id,
                versionName: fromMilestone.versionName,
                title: fromMilestone.title,
            },
            to: {
                id: toMilestone._id,
                versionName: toMilestone.versionName,
                title: toMilestone.title,
            },
            summary,
            changes,
        });
    } catch (error) {
        console.log("Error in compareProjectMilestones:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
