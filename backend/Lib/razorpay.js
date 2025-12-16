import {config} from 'dotenv'
import razorpay from 'razorpay'

config();

export const createRazorpayInstance = () => {
    return new razorpay({
        key_id: process.env.RAZOR_API_KEY,
        key_secret: process.env.RAZOR_API_SECRET
    })
}