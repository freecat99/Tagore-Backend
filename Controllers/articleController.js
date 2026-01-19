const mainURL = 'https://doaj.org/api/';

export const search= async(req, res)=>{
    try {
        const {parameter} = req.body;

        const url = mainURL + 'search/articles/';
        const request = url + encodeURIComponent(parameter);
        
        const response = await fetch(request);
        const result = await response.json();

        res.status(200).json(result);

    } catch (error) {
        console.log("Error in articleController", error);
        res.status(500).json({message:"Internal server error"})
    }
};

export const getSingleArticle = async(req, res)=>{
    try {
        
        const {articleId} = req.body;
        const url = mainURL + 'articles/';
        const request = url + encodeURIComponent(articleId);

        const response = await fetch(request);
        const result = await response.json();

        res.status(200).json(result);

    } catch (error) {
        console.log("Error in articleController", error);
        res.status(500).json({message:"Internal server error"})
    }
}
