import mongoose from 'mongoose'

const chatpageSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            index:true
        },
        words:{
            type:[String],
            default: []
        },
    },
    {timestamps:true}
);

const Chatpage = mongoose.model("Chatpage", chatpageSchema);

export default Chatpage;