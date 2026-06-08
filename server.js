import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dns from "node:dns/promises"
dns.setServers(["1.1.1.1", "8.8.8.8"])

import authRouter from './Routes/authRouter.js';
import { connectDB } from './Lib/db.js';
import articleRouter from './Routes/articleRouter.js';
import paymentRouter from './Routes/paymentRouter.js';
import projectRouter from './Routes/projectRouter.js';
import llmRouter from './Routes/llmRouter.js';
import paperRouter from './Routes/paperRouter.js';
import dashboardRouter from './Routes/dashboardRouter.js';

dotenv.config();

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://tagorefront.vercel.app"
    ],
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
app.use('/api/paper', paperRouter);
app.use('/api/dashboard', dashboardRouter);

const PORT = process.env.PORT || 1600;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`server started @ ${PORT}`)
            console.log(`cors configured`)
        })
    } catch (error) {
        console.log("Server startup failed because MongoDB could not connect:", error.message);
        process.exit(1);
    }
}

startServer();
