import { Router } from "express";

import {
  loginController,
  meController,
  registerTeacherController,
} from "../controllers/auth.controller";
import { ensureAuthenticated } from "../middlewares/auth.middleware";

export const authRouter = Router();

authRouter.post("/register", registerTeacherController);
authRouter.post("/login", loginController);
authRouter.get("/me", ensureAuthenticated, meController);