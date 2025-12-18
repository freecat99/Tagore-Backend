import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'

import authRouter from './Routes/authRouter.js';
import { connectDB } from './Lib/db.js';

dotenv.config();

const app = express();

app.use(cors({
    origin: "http://localhost:5173", // Frontend URL
    credentials: true // allows the cookie to pass
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);


const PORT = process.env.PORT || 1600;

app.listen(PORT, ()=>{
    connectDB();
    console.log(`server started @ ${PORT}`)
})