import express from 'express'
import { checkAuth, login, logout, register, updateProfile } from '../Controllers/authController.js';
import { loginValidate, protectRoute, registerValidate } from '../Middlewares/authValidate.js';

const authRouter = express.Router();

authRouter.post('/logout', logout); 
authRouter.post('/login', loginValidate,login);
authRouter.post('/register', registerValidate, register);

authRouter.put('/update-profile', protectRoute, updateProfile);
authRouter.get('/check-auth', protectRoute, checkAuth);


export default authRouter;