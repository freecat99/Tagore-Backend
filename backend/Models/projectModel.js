import { required } from 'joi';
import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema(
    {
        title:{
            type:String,
            required:true,
            unique:true
        },
        abstract:{
            type:String,
            required:true,
        },        
        author:{
            type:String,
            required:true,
        },
        description:{
            type:String,
            required:true,
            unique:true
        },
        lookingToFund:{
            type:String,
            required:true,
            default:'no'
        },
        amountRaised:{
            type:Number
        },
        amountTotal:{
            type:Number,
        }
    },
    {timestamps:true}
);

const Project = mongoose.model("Project", projectSchema);

export default Project;