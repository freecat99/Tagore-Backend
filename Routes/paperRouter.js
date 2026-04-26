import express from 'express'
import { getUserPaper, newPaper } from '../Controllers/paperController.js';

const paperRouter = express.Router();

paperRouter.post('/newpaper',newPaper);
paperRouter.get('/getprojects',getUserPaper);


export default paperRouter;