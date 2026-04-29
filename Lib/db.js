import { config } from 'dotenv';
import mongoose from 'mongoose'
config()

export const connectDB = async() =>{
    try {
        
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`mongoDB connected @ ${conn.connection.host}`)

    } catch (error) {
        console.log(`Database Error: ${error}`)
        throw error;
    }
}
