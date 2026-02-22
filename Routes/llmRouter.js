import express from 'express';
import { protectRoute } from '../Middlewares/authValidate.js';
import {queryChatbot, sendPage} from '../Controllers/llmController.js';

const llmRouter = express.Router();

llmRouter.post('/send-page', protectRoute, sendPage)

llmRouter.post('/query-chatbot', protectRoute, queryChatbot)

export default llmRouter;