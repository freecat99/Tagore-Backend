import { DataAPIClient, vector } from '@datastax/astra-db-ts';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'; 
import { config } from dotenv;
import OpenAI from 'openai';
config();

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_APPLICATION_TOKEN
} = process.env;

// pages are the documents selected by the user in workspace tab

const client = new DataAPIClient(ASTRA_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, {keyspace: ASTRA_DB_NAMESPACE});

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
});

const createCollection = await db.createCollection(ASTRA_DB_COLLECTION, {
    vector: {
        dimension: 1536,
        metric: "dot_product" || "cosine" || "euclidean"
    }
})

const openai = new OpenAI();

const loadPage = async()=>{
    const collection = await db.collection(ASTRA_DB_COLLECTION);
    const chunks = await splitter.splitText(content);
    for await(const chunk of chunks){
        const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: chunk,
            encoding_format: "float"
        })
        const vector = embedding.data[0].embedding;

        const res = await collection.insertOne({
            $vector: vector,
            text: chunk
        })
        console.log(res);
    } 
}

createCollection().then(()=>loadPage());