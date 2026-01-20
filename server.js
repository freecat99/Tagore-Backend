import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import authRouter from './Routes/authRouter.js';
import { connectDB } from './Lib/db.js';
import articleRouter from './Routes/articleRouter.js';
import paymentRouter from './Routes/paymentRouter.js';
import projectRouter from './Routes/projectRouter.js'; 

dotenv.config();

const app = express();

app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true 
}));

app.use(express.json({ limit: "10mb" }));   
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/api/auth', authRouter);
app.use('/api/article', articleRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/projects', projectRouter);

const PORT = process.env.PORT || 1600;

app.listen(PORT, ()=>{
    connectDB();
    console.log(`server started @ ${PORT}`)
})