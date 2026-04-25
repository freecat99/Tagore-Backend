import mongoose from 'mongoose';

const tiptapEmptyDocument = {
    type: 'doc',
    content: [
        {
            type: 'paragraph',
        },
    ],
};

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
