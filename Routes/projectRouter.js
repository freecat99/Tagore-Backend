import express from 'express';
import { protectRoute } from '../Middlewares/authValidate.js';
import {
    compareProjectMilestones,
    createMilestone,
    createProject,
    getAllProjects,
    getProjectById,
    getProjectMilestones,
    updateProjectDraft,
} from '../Controllers/projectController.js';

const projectRouter = express.Router();

// Public Route (Anyone can see projects)
projectRouter.get('/', getAllProjects);
projectRouter.get('/:id/milestones', getProjectMilestones);
projectRouter.get('/:id/compare', compareProjectMilestones);
projectRouter.get('/:id', getProjectById);

// Protected Routes (Only project owners can mutate workspace state)
projectRouter.post('/', protectRoute, createProject);
projectRouter.patch('/:id/draft', protectRoute, updateProjectDraft);
projectRouter.post('/:id/milestones', protectRoute, createMilestone);

export default projectRouter;
