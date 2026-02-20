import express from 'express';
import { protectRoute } from '../Middlewares/authValidate.js';
import {queryChatbot} from '../Controllers/llmController.js';

const llmRouter = express.Router();

llmRouter.post('/query-chatbot', protectRoute, queryChatbot)

export default llmRouter;