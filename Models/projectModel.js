import mongoose from 'mongoose';

const tiptapEmptyDocument = {
    type: 'doc',
    content: [
        {
            type: 'paragraph',
        },
    ],
};

const uploadedFileSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            default: 0,
        },
        mimeType: {
            type: String,
            default: '',
        },
        resourceType: {
            type: String,
            default: 'auto',
        },
        folderPath: {
            type: String,
            default: '',
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const authoredDocSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['text', 'latex', 'docx', 'sheet'],
            default: 'text',
        },
        content: {
            type: mongoose.Schema.Types.Mixed,
            default: '',
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const paperLibrarySchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            default: 'Untitled Paper',
        },
        authors: {
            type: String,
            default: '',
        },
        venue: {
            type: String,
            default: '',
        },
        year: {
            type: String,
            default: '',
        },
        abstract: {
            type: String,
            default: '',
        },
        rawUrl: {
            type: String,
            default: '',
        },
        pdfUrl: {
            type: String,
            default: '',
        },
    },
    { _id: false }
);

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        abstract: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            default: '',
        },
        content: {
            type: String,
            default: 'Full paper content pending...',
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        researcherName: {
            type: String,
            default: '',
        },
        institution: {
            type: String,
            default: 'Independent',
        },
        category: {
            type: String,
            default: '',
        },
        tags: {
            type: [String],
            default: [],
        },
        imageUrl: {
            type: String,
            default: '',
        },
        lookingToFund: {
            type: String,
            default: 'no',
        },
        isFundable: {
            type: Boolean,
            default: false,
        },
        fundingGoal: {
            type: Number,
            default: 0,
        },
        amountRaised: {
            type: Number,
            default: 0,
        },
        amountTotal: {
            type: Number,
            default: 0,
        },
        deadline: {
            type: Date,
        },

        // Tagore Lineage: volatile workspace state auto-saved from the IDE.
        currentManuscript: {
            type: mongoose.Schema.Types.Mixed,
            default: () => JSON.parse(JSON.stringify(tiptapEmptyDocument)),
        },
        activePapers: {
            type: [String],
            default: [],
        },
        paperLibrary: {
            type: [paperLibrarySchema],
            default: [],
        },
        uploadedFiles: {
            type: [uploadedFileSchema],
            default: [],
        },
        authoredDocs: {
            type: [authoredDocSchema],
            default: [],
        },
        lastAutoSavedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

projectSchema.index({ createdAt: -1 });
projectSchema.index({ author: 1, updatedAt: -1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
