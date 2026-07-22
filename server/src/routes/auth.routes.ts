import { Router } from "express";

import { registerTeacherController } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/register", registerTeacherController);