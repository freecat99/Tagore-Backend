import mongoose from "mongoose";

const paperSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        researcher: {
            type: String,
            required: true,
            trim: true,
        },
        institution: {
            type: String,
            trim: true,
            default: "",
        },
        abstract: {
            type: String,
            default: "",
        },
        keywords: {
            type: [String],     
            default: [],
        },
        documentUrl: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }   
);

const Paper = mongoose.model("Paper", paperSchema);
export default Paper;