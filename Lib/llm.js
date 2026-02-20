import OpenAI from 'openai';
import { config } from 'dotenv';
config();

export const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.LLM_API_KEY
});
