import express from 'express'
import { getSingleArticle, search } from '../Controllers/articleController.js';

const articleRouter = express.Router();

articleRouter.post('/search', search)
articleRouter.post('/getSinglePaper', getSingleArticle)

export default articleRouter;