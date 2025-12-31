import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt, { compareSync } from 'bcrypt'
import User from '../Models/userModel.js';
import { tokenGen } from '../Lib/utils.js';
import cloudinary from '../Lib/cloudinary.js';

export const register = async(req, res) => {
    
    const {fullName, email, password, role} = req.body;

    try {
        
        const oldUser = await User.findOne({email});
        if (oldUser){
            return res.status(403).json({message:"Email already registered!"})
        }
        const salt = await bcrypt.genSalt(8);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({
            fullName: fullName,
            email: email,
            password: hashedPassword,
            role: role
        })

        if(newUser){
            tokenGen(newUser._id, res); //mongodb id is _id
            const savedUser = await newUser.save();
            res.status(201).json({message:"User registered!", savedUser});
        }

    } catch (error) {
        console.log(`Error in register controller, ${error}`);
        res.status(500).json({message:"Internal server error!"})
    }
}

export const login = async(req, res) => {

    const {email, password} = req.body;

    try {
        
        const oldUser = await User.findOne({email});
        if(!oldUser){
            return res.status(401).json({message:"Email not registered!"});
        }
        const passwordMatched = bcrypt.compare(password, oldUser.password);

        if(!passwordMatched){
            return res.status(401).json({message:"Wrong password!"});
        }
        
        tokenGen(oldUser.id, res);
        res.status(200).json({message:"Logged in!",
            oldUser
        })

    } catch (error) {
        console.log(`Error in login controller, ${error}`);
        res.status(500).json({message:"Internal server error!"})
        
    }
}

export const logout = (req, res) => {
    try {
        res.cookie('jwt', '', {maxAge:0});
        res.status(200).json({message:"Logged out!"});
    } catch (error) {
        console.log(`Error in logout controller, ${error}`);
        res.status(500).json({message:"Internal server error!"})
    }
}

export const updateProfile = async(req, res) => {
    
    try {

        let {profilePic, headline, bio, institution, location, website, socials} = req.body;
        let profilePicUrl = "";
        const userId = req.user.id;
        
        if(!profilePic && !headline &&!bio && !institution && !location && !website && !socials){
            return res.status(200).json({message:"Nothing changed!", user:req.user});
        }
        
        if(profilePic){
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            profilePicUrl = uploadResponse.secure_url;
        }
        const updatedUser = await User.findByIdAndUpdate(userId, {
            headline: headline,
            bio: bio,
            institution: institution,
            location: location,
            website: website,
            socials: socials,
            profilePic:profilePicUrl
        }, {new:true});
        

        res.status(200).json({message:"Changes saved!", updatedUser});

    } catch (error) {
        console.log("Error in updateProfile controller", error);
        res.status(500).json({message:"Internal server error!"});
    }

}

export const checkAuth = (req, res) => {
    try {

        return res.status(200).json(req.user);

    } catch (error) {
        console.log("Error in checkAuth controller", error);
        res.status(500).json({message:"Internal server error!"});
    }
}