import bcrypt from 'bcrypt'
import User from '../Models/userModel.js';
import { tokenGen } from '../Lib/utils.js';
import cloudinary from '../Lib/cloudinary.js';

export const register = async(req, res) => {
    
    const {fullName, email, password, role} = req.body;

    try {
        const safeFullName = fullName?.trim();
        const safeEmail = email?.trim().toLowerCase();
        const safeRole = role?.trim() || "Researcher";

        const oldUser = await User.findOne({ email: safeEmail });
        if (oldUser){
            return res.status(403).json({message:"Email already registered!"})
        }

        const oldName = await User.findOne({ fullName: safeFullName });
        if (oldName) {
            return res.status(409).json({ message: "This name is already taken. Please use a slightly different display name." });
        }

        const salt = await bcrypt.genSalt(8);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({
            fullName: safeFullName,
            email: safeEmail,
            password: hashedPassword,
            role: safeRole
        })

        if(newUser){
            const savedUser = await newUser.save();
            tokenGen(savedUser._id, res); //mongodb id is _id
            const userPayload = savedUser.toObject();
            delete userPayload.password;
            res.status(201).json({message:"User registered!", savedUser: userPayload});
        }

    } catch (error) {
        console.log(`Error in register controller, ${error}`);
        if (error?.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0] || "field";
            return res.status(409).json({
                message: duplicateField === "fullName"
                    ? "This name is already taken. Please use a slightly different display name."
                    : "Email already registered!",
            });
        }
        res.status(500).json({message:"Internal server error!"})
    }
}

export const login = async(req, res) => {

    const {email, password} = req.body;

    try {
        
        const oldUser = await User.findOne({ email }).select("+password");
        if(!oldUser){
            return res.status(401).json({message:"Email not registered!"});
        }

        const passwordMatched = await bcrypt.compare(password, oldUser.password);

        if(!passwordMatched){
            return res.status(401).json({message:"Wrong password!"});
        }
        
        tokenGen(oldUser._id, res);
        const userPayload = oldUser.toObject();
        delete userPayload.password;

        res.status(200).json({message:"Logged in!",
            oldUser: userPayload
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

export const updateProfile = async (req, res) => {
  try {
    let { profilePic, headline, bio, institution, location, website, socials } =
      req.body;

    const userId = req.user.id;

    const updateData = {};

    if (headline !== undefined) updateData.headline = headline;
    if (bio !== undefined) updateData.bio = bio;
    if (institution !== undefined) updateData.institution = institution;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (socials !== undefined) updateData.socials = socials;

    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({ message: "Nothing changed!", user: req.user });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    res.status(200).json({ message: "Changes saved!", updatedUser });
  } catch (error) {
    console.log("Error in updateProfile controller", error);
    res.status(500).json({ message: "Internal server error!" });
  }
};


export const checkAuth = (req, res) => {
    try {

        return res.status(200).json(req.user);

    } catch (error) {
        console.log("Error in checkAuth controller", error);
        res.status(500).json({message:"Internal server error!"});
    }
}
