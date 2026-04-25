import express from "express";
import { getMyDashboard } from "../Controllers/dashboardController.js";
import { protectRoute } from "../Middlewares/authValidate.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/me", protectRoute, getMyDashboard);

export default dashboardRouter;
