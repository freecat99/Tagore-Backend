import { client } from "../Lib/llm.js";


export const queryChatbot = async(req, res)=>{
    const apiResponse = await client.chat.completions.create({
        model: 'arcee-ai/trinity-large-preview:free',
        messages: [{
            role: 'user',
            content: req.body.query,            
        },],
        reasoning: {enabled:false}
    })

    res.status(200).json({apiResponse});
};