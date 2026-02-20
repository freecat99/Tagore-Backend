import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import authRouter from './Routes/authRouter.js';
import { connectDB } from './Lib/db.js';
import articleRouter from './Routes/articleRouter.js';
import paymentRouter from './Routes/paymentRouter.js';
import projectRouter from './Routes/projectRouter.js'; 
import llmRouter from './Routes/llmRouter.js';

dotenv.config();

const app = express();

let frontendOrigin = "http://localhost:5173"


app.use(cors({
    origin: frontendOrigin, 
    credentials: true 
}));

app.use(express.json({ limit: "10mb" }));   
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/api/auth', authRouter);
app.use('/api/article', articleRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/projects', projectRouter);
app.use('/api/llm', llmRouter);

const PORT = process.env.PORT || 1600;

app.listen(PORT, ()=>{
    connectDB();
    console.log(`server started @ ${PORT}`)
    console.log(`cors connected @ ${frontendOrigin}`)
})