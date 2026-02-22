import { client } from "../Lib/llm.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { extractImportantWords } from "../Lib/tfidf.js";
import Chatpage from "../Models/chatpageModel.js";

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100
});

export const sendPage = async(req, res) =>{
    const { allText, userId } = req.body;
    try {

        const chunks = await splitter.splitText(allText);
        const importantWords = extractImportantWords(chunks, 40);

        await Chatpage.findOneAndUpdate({userId}, {$addToSet: {words: {$each: importantWords}}}, { upsert:true, new: true });

        res.status(200).json({message:"Text processed", keywords: importantWords});
        
    } catch (error) {
        console.log(`Error in llm controller, ${error}`);
        res.status(500).json({message:"Internal server error!"})

    } 
}

export const queryChatbot = async(req, res)=>{
    try{
        const apiResponse = await client.responses.create({
            model: 'arcee-ai/trinity-mini',
            /* tools: [{
                type: "web_search",
            }], */
            input: [{
                role: 'user',
                content: req.body.query,            
            },],
            instructions:'Your name is Tiger. You are a chatbot of a website called Tagore. Provide truthful, factual answers only.',
            reasoning: {effort:'low'}
        }) 
    
        res.status(200).json({apiResponse});
    }catch(err){
        console.error(err);
        res.status(500).json({error: "Chatbot Issue, retry after a while"});
    }
};