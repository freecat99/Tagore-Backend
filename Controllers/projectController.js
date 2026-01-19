import Project from "../Models/projectModel.js";

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
        const { title, abstract, category, fundingGoal, imageUrl, institution, tags, content } = req.body;
        const userId = req.user._id; // Comes from protectRoute middleware

        const newProject = new Project({
            title,
            abstract,
            content: content || "Full paper content pending...",
            author: userId,
            researcherName: req.user.fullName, // Auto-fill from logged in user
            institution: institution || "Independent",
            category,
            tags: tags || [],
            imageUrl,
            isFundable: fundingGoal > 0,
            fundingGoal: Number(fundingGoal) || 0,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days form now
        });

        await newProject.save();
        res.status(201).json(newProject);

    } catch (error) {
        console.log("Error in createProject:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};