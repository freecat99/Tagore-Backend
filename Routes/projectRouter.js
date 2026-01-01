import express from 'express';
import { protectRoute } from '../Middlewares/authValidate.js';
import { createProject, getAllProjects, getProjectById } from '../Controllers/projectController.js';

const projectRouter = express.Router();

// Public Route (Anyone can see projects)
projectRouter.get('/', getAllProjects);
projectRouter.get('/:id', getProjectById);

// Protected Route (Only logged in users can publish)
projectRouter.post('/', protectRoute, createProject);

export default projectRouter;