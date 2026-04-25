import { diffLines } from "diff";
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
        const { currentManuscript, manuscriptContent, content, activePapers, title } = req.body;

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
            lastAutoSavedAt: project.lastAutoSavedAt,
        });
    } catch (error) {
        console.log("Error in updateProjectDraft:", error);
        res.status(500).json({ message: "Internal Server Error" });
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
