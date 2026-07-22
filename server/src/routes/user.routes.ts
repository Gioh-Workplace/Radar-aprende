import { Router } from "express";

import {
  createStudentController,
  listStudentsController,
} from "../controllers/user.controller";
import { ensureAuthenticated } from "../middlewares/auth.middleware";
import { ensureRole } from "../middlewares/role.middleware";

export const userRouter = Router();

userRouter.use(
  ensureAuthenticated,
  ensureRole("TEACHER"),
);

userRouter.get(
  "/students",
  listStudentsController,
);

userRouter.post(
  "/students",
  createStudentController,
);