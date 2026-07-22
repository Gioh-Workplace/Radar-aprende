import { Router } from "express";

import {
  createClassroomController,
  getClassroomController,
  listClassroomsController,
} from "../controllers/classroom.controller";
import { ensureAuthenticated } from "../middlewares/auth.middleware";
import { ensureRole } from "../middlewares/role.middleware";

export const classroomRouter = Router();

classroomRouter.use(
  ensureAuthenticated,
  ensureRole("TEACHER"),
);

classroomRouter.post(
  "/",
  createClassroomController,
);

classroomRouter.get(
  "/",
  listClassroomsController,
);

classroomRouter.get(
  "/:classroomId",
  getClassroomController,
);