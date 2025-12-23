import joi from 'joi'
import jwt from 'jsonwebtoken'
import User from '../Models/userModel.js';

export const registerValidate = (req, res, next) => {
    const schema = joi.object({
        fullName:joi.string().min(5).max(30).required().messages({
            'string.base': `Name should be a type of 'text'`,
            'string.empty': `Name cannot be an empty field`,
            'string.min': `Name atleast {#limit} characters`,
            'any.required': `Name is a required field`
        }),
        role:joi.string().required().messages({
            'string.base': `Role should be a type of 'text'`,
            'string.empty': `Role cannot be an empty field`,
            'any.required': `Role is a required field`
        }),
        email:joi.string().email().required().messages({
            'string.base': `Email should be a type of 'mail'`,
            'string.empty': `Email cannot be an empty field`,
            'string.min': `Email should have a minimum length of {#limit}`,
            'any.required': `Email is a required field`
        }),
        password:joi.string().min(8).required().messages({
            'string.base': `Password should be a type of 'text'`,
            'string.empty': `Password cannot be an empty field`,
            'string.min': `Password atleast {#limit} characters`,
            'any.required': `Password is a required field`
        }),
    }) 
    const {fullName, role, email, password} = req.body;

    try {
        const isValid = schema.validate({fullName, role, email, password});
        if(isValid.error){
            return res.json(isValid.error.details[0].message)
        }
        next();
    } catch (error) {
        console.log(`Error in registerValidate middleware`)
        res.json({error});
    }

}

export const loginValidate = (req, res, next) => {
    const schema = joi.object({
        email:joi.string().email().required().messages({
            'string.base': `Email should be a type of 'mail'`,
            'string.empty': `Email cannot be an empty field`,
            'string.min': `Email should have a minimum length of {#limit}`,
            'any.required': `Email is a required field`
        }),
        password:joi.string().min(8).required().messages({
            'string.base': `Password should be a type of 'text'`,
            'string.empty': `Password cannot be an empty field`,
            'string.min': `Password atleast {#limit} characters`,
            'any.required': `Password is a required field`
        }),
    }) 
    const {email, password} = req.body;

    try {
        const isValid = schema.validate({email, password});
        if(isValid.error){
            console.log(isValid.error)
            return res.status(400).json({message:isValid.error.details[0].message, success:false})
        }
        next();
    } catch (error) {
        console.log(`Error in loginValidate middleware`, error)
        res.json({error});
    }

}

export const protectRoute = async(req, res, next) => {
    try {

        const token = req.cookies.jwt;
        if(!token){
            return res.status(401).json({message:"Unauthorized access!"})
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if(!decoded){
            return res.status(403).json({message:"Unauthorized access!"})
        }
        const user = await User.findById(decoded.userId);
        req.user = user;
        next();

    } catch (error) {
        console.log(`Error in protectRoute middleware, ${error}`);
        res.json({error});
    }
}