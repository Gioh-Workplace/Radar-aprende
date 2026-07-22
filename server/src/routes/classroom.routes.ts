import { Router } from "express";

import {
    addStudentController,
    createClassroomController,
    getClassroomController,
    listClassroomsController,
    removeStudentController,
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
classroomRouter.post(
    "/:classroomId/students",
    addStudentController,
  );
  
  classroomRouter.delete(
    "/:classroomId/students/:studentId",
    removeStudentController,
  );