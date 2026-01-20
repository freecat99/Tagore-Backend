import express from 'express';
import { getSingleArticle, search, getDiscoveryFeed } from '../Controllers/articleController.js';

const articleRouter = express.Router();

// New Discovery Route
articleRouter.get('/discovery-feed', getDiscoveryFeed);

// Existing Routes
articleRouter.post('/search', search);
articleRouter.post('/getSinglePaper', getSingleArticle);

export default articleRouter;