import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true,
        },
        versionName: {
            type: String,
            required: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        evolutionContext: {
            type: String,
            required: true,
            trim: true,
        },
        manuscriptSnapshot: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        librarySnapshot: {
            type: [String],
            default: [],
        },
        isMajor: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

milestoneSchema.index({ projectId: 1, createdAt: -1 });
milestoneSchema.index({ projectId: 1, versionName: 1 }, { unique: true });

const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;
