import express from 'express';
import multer from 'multer';
import { protectRoute } from '../Middlewares/authValidate.js';
import {
    compareProjectMilestones,
    createMilestone,
    createProject,
    createWorkspaceDoc,
    getAllProjects,
    getProjectById,
    getProjectMilestones,
    getProjectWorkspace,
    updateProjectDraft,
    uploadProjectFiles,
} from '../Controllers/projectController.js';

const projectRouter = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024,
        files: 50,
    },
});

// Public Route (Anyone can see projects)
projectRouter.get('/', getAllProjects);
projectRouter.get('/:id/milestones', getProjectMilestones);
projectRouter.get('/:id/compare', compareProjectMilestones);
projectRouter.get('/:id/workspace', protectRoute, getProjectWorkspace);

// Protected Routes (Only project owners can mutate workspace state)
projectRouter.post('/', protectRoute, createProject);
projectRouter.patch('/:id/draft', protectRoute, updateProjectDraft);
projectRouter.post('/:id/upload', protectRoute, upload.any(), uploadProjectFiles);
projectRouter.post('/:id/docs', protectRoute, createWorkspaceDoc);
projectRouter.post('/:id/milestones', protectRoute, createMilestone);
projectRouter.get('/:id', getProjectById);

export default projectRouter;
