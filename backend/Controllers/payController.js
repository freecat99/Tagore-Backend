import { config } from "dotenv"; 
import crypto from 'crypto';
import { createRazorpayInstance } from "../Lib/razorpay.js";

config();

export const createOrder = async(req, res) => {
    const {orderId, amount} = req.body; //fetch amount from backend 

    const razorpayInstance = createRazorpayInstance();

    const options = {
        amount: amount*100,
        currency: 'INR',
        receipt: 'receipt_order_1'

    }

    try {
        
        razorpayInstance.orders.create(options, (err, order)=>{
            if(err){
                console.log(`Error in payController razorpay instance`, error);
                return res.status(500).json({message:'Internal server error!'})
            }
            return res.status(200).json(order);
        })
        

    } catch (error) {
        console.log(`Error in payController`, error);
        return res.status(500).json({message:'Internal server error!'})
    }

}

export const verifyPayment = async(req, res) => {
    const {orderId, paymentId, signature} = req.body;

    const secret = process.env.RAZOR_API_SECRET;    
    
    //hmac object for payment verification
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(orderId + '|' + paymentId);
    const geenratedSignature = hmac.digest('hex');

    if(geenratedSignature===signature){
        return res.status(200).json({message:"Payment verified!"});
    }
    return res.status(400).json({message:"Payment failed!"})


}