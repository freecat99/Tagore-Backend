import express from 'express'
import { search } from '../Controllers/articleController.js';

const articleRouter = express.Router();

articleRouter.post('/search', search)

export default articleRouter;