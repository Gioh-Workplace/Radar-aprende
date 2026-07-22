import { Router } from "express";

import { createStudentController } from "../controllers/user.controller";
import { ensureAuthenticated } from "../middlewares/auth.middleware";
import { ensureRole } from "../middlewares/role.middleware";

export const userRouter = Router();

userRouter.use(ensureAuthenticated);

userRouter.post(
  "/students",
  ensureRole("TEACHER"),
  createStudentController,
);