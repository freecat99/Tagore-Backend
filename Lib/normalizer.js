export const normalizeDOAJ = (paper) => {
    const bib = paper.bibjson || {};
    
    return {
        id: paper.id || Math.random().toString(36).substr(2, 9),
        title: bib.title || "Untitled Research",
        authors: bib.author?.map(a => a.name).join(", ") || "Unknown Researchers",
        institution: bib.institution || bib.publisher || "Academic Institution",
        category: bib.subject?.[0]?.term || "General Science",
        abstract: bib.abstract || "No abstract available for this publication.",
        year: bib.year || "n/a",
        source: "DOAJ",
        externalUrl: bib.link?.[0]?.url || "",
        tags: bib.keywords || [],
    };
};