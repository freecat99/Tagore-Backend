import mongoose from "mongoose";
import Milestone from "../Models/milestoneModel.js";
import Project from "../Models/projectModel.js";

const monthLabel = (date) =>
    date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
    });

const getTimeAgo = (date) => {
    if (!date) return "recently";

    const diffMs = Date.now() - new Date(date).getTime();
    const minutes = Math.max(Math.floor(diffMs / 60000), 0);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w ago`;

    const months = Math.floor(days / 30);
    return `${months}mo ago`;
};

const getLastThreeMonthBuckets = () => {
    const now = new Date();
    return Array.from({ length: 3 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (2 - index), 1);
        return {
            key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
            date: monthLabel(date),
            count: 0,
        };
    });
};

export const getMyDashboard = async (req, res) => {
    try {
        const user = req.user;
        const userId = new mongoose.Types.ObjectId(user._id);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);
        threeMonthsAgo.setDate(1);
        threeMonthsAgo.setHours(0, 0, 0, 0);

        const [workspaces, activityMilestones, telemetryRows] = await Promise.all([
            Project.aggregate([
                { $match: { author: userId } },
                { $sort: { updatedAt: -1 } },
                {
                    $lookup: {
                        from: "milestones",
                        let: { projectId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$projectId", "$$projectId"] },
                                },
                            },
                            { $sort: { createdAt: -1 } },
                            {
                                $project: {
                                    versionName: 1,
                                    title: 1,
                                    createdAt: 1,
                                },
                            },
                        ],
                        as: "milestones",
                    },
                },
                {
                    $addFields: {
                        activePaperCount: { $size: { $ifNull: ["$activePapers", []] } },
                        milestoneCount: { $size: "$milestones" },
                        latestMilestone: { $first: "$milestones" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        projectId: "$_id",
                        title: 1,
                        updatedAt: 1,
                        activePaperCount: 1,
                        milestoneCount: 1,
                        latestMilestone: {
                            versionName: "$latestMilestone.versionName",
                            title: "$latestMilestone.title",
                            createdAt: "$latestMilestone.createdAt",
                        },
                    },
                },
                { $limit: 8 },
            ]),
            Milestone.aggregate([
                {
                    $lookup: {
                        from: "projects",
                        localField: "projectId",
                        foreignField: "_id",
                        as: "project",
                    },
                },
                { $unwind: "$project" },
                { $match: { "project.author": userId } },
                { $sort: { createdAt: -1 } },
                { $limit: 5 },
                {
                    $project: {
                        _id: 0,
                        type: { $literal: "milestone" },
                        title: 1,
                        versionName: 1,
                        createdAt: 1,
                        projectName: "$project.title",
                    },
                },
            ]),
            Milestone.aggregate([
                {
                    $lookup: {
                        from: "projects",
                        localField: "projectId",
                        foreignField: "_id",
                        as: "project",
                    },
                },
                { $unwind: "$project" },
                {
                    $match: {
                        "project.author": userId,
                        createdAt: { $gte: threeMonthsAgo },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
            ]),
        ]);

        const telemetryMap = new Map(
            telemetryRows.map((row) => [
                `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
                row.count,
            ])
        );

        const chartData = getLastThreeMonthBuckets().map((bucket) => ({
            date: bucket.date,
            count: telemetryMap.get(bucket.key) || 0,
        }));

        res.status(200).json({
            profile: {
                id: user._id,
                name: user.fullName,
                role: user.role,
                email: user.email,
                avatar: user.profilePic,
                quote:
                    user.bio ||
                    user.headline ||
                    "Research is to see what everybody else has seen, and to think what nobody else has thought.",
                institution: user.institution,
                location: user.location,
            },
            workspaces: workspaces.map((workspace) => ({
                ...workspace,
                timeAgo: getTimeAgo(workspace.updatedAt),
            })),
            activityFeed: activityMilestones.map((milestone) => ({
                type: "milestone",
                title: milestone.title,
                versionName: milestone.versionName,
                projectName: milestone.projectName,
                timeAgo: getTimeAgo(milestone.createdAt),
                createdAt: milestone.createdAt,
            })),
            chartData,
            stats: {
                workspaceCount: workspaces.length,
                milestoneCount: activityMilestones.length,
                totalChartMilestones: chartData.reduce((total, item) => total + item.count, 0),
            },
        });
    } catch (error) {
        console.log("Error in getMyDashboard:", error);
        res.status(500).json({ message: "Unable to load dashboard" });
    }
};
