import express from 'express'
import { protectRoute } from '../Middlewares/authValidate';
import { createOrder, verifyPayment } from '../Controllers/payController';

const paymentRouter = express.Router();

paymentRouter.post('/create-order', protectRoute, createOrder);
paymentRouter.post('/verify-payment', protectRoute, verifyPayment);

export default paymentRouter;