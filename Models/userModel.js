import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
    {
        email:{
            type:String,
            required:true,
            unique:true
        },
        password:{
            type:String,
            required:true,
        },
        role:{
            type:String,
            required:true,
        },
        fullName:{
            type:String,
            required:true,
            unique:true
        },
        profilePic:{
            type:String,
            default:"",
        },
        headline:{
            type:String,
            default:""
        },
        bio:{
            type:String,
            default:""
        },
        institution:{
            type:String,
            default:""
        },
        location:{
            type:String,
            default:""
        },
        website:{
            type:String,
            default:""
        },
        socials:{
            type:Map,
            of:String,
            default:""
        }
    },
    {timestamps:true}
);

const User = mongoose.model("User", userSchema);

export default User;