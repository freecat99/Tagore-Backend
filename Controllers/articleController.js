export const search= async(req, res)=>{
    try {
        const {parameter} = req.body;

        const url = 'https://doaj.org/api/search/articles/';
        const request = url + encodeURIComponent(parameter);
        
        const response = await fetch(request);
        const result = await response.json();

        res.status(200).json(result);

    } catch (error) {
        console.log("Error in articleController", error);
        res.status(500).json({message:"Internal server error"})
    }
};
