import natural from "natural";

const TfIdf = natural.TfIdf;

export const extractImportantWords = (chunks, topN = 30) => {

    const tfidf = new TfIdf();

    // add each chunk as a document
    chunks.forEach(chunk => tfidf.addDocument(chunk));

    const scores = {};

    // calculate importance
    tfidf.documents.forEach((doc, i) => {

        tfidf.listTerms(i).forEach(term => {

            const word = term.term;

            if (!scores[word]) {
                scores[word] = 0;
            }

            scores[word] += term.tfidf;
        });

    });

    // sort by importance
    const sorted = Object.entries(scores)
        .sort((a,b)=>b[1]-a[1])
        .slice(0, topN)
        .map(([word]) => word);

    return sorted;
};