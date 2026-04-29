import Paper from "../Models/paperModel.js"; 

export const newPaper = async (req, res) => {
    try {
        const { user, title, researcher, institution, abstract, keywords, documentUrl } = req.body;

        if (!title || !researcher || !documentUrl) {
            return res.status(400).json({ message: "Title, researcher and document are required." });
        }

        const paper = new Paper({
            user,
            title,
            researcher,
            institution,
            abstract,
            keywords: keywords.split(",").map((k) => k.trim()), 
            documentUrl,
        });

        await paper.save();

        res.status(201).json({ message: "Paper submitted successfully", paper });

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

import Project from "../Models/projectModel.js";


export const getUserPaper = async (req, res) => {
    try {
        const { userId } = req.query;
        const papers = await Paper.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json({ projects: papers }); // keeping key as "projects" so frontend works
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};
