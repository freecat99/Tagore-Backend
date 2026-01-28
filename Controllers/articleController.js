import { normalizeDOAJ } from '../Lib/normalizer.js';

const mainURL = 'https://doaj.org/api/';

// 1. New Discovery Feed (For the "Pamphlet" UI)
export const getDiscoveryFeed = async (req, res) => {
    try {
        const gridResponse = await fetch(`${mainURL}search/articles/*?pageSize=24`);
        const gridData = await gridResponse.json();
        
        const featuredResponse = await fetch(`${mainURL}search/articles/query:"computer%20science"%20OR%20"artificial%20intelligence"`);
        const featuredData = await featuredResponse.json();
        console.log("HERE \n",featuredData)

        res.status(200).json({
            featured: featuredData.results.map(normalizeDOAJ),
            grid: gridData.results.map(normalizeDOAJ)
        });
    } catch (error) {
        console.error("Discovery API Error:", error);
        res.status(500).json({ message: "Unable to sync with research databases." });
    }
};

// 2. Search Logic (Keep this for the Workspace search)
export const search = async(req, res) => {
    try {
        const {parameter} = req.body;
        const url = mainURL + 'search/articles/';
        const request = url + encodeURIComponent(parameter);
        
        const response = await fetch(request);
        const result = await response.json();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({message:"Internal server error"});
    }
};

// 3. Single Article Fetch (Keep this for the Workspace viewer)
export const getSingleArticle = async(req, res) => {
    try {
        const {articleId} = req.body;
        const url = mainURL + 'articles/';
        const request = url + encodeURIComponent(articleId);

        const response = await fetch(request);
        const result = await response.json();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({message:"Internal server error"});
    }
};