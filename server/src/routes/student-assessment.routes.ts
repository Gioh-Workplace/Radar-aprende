import { Router } from "express";

import {
  getStudentAssessmentController,
  listStudentAssessmentsController,
} from "../controllers/student-assessment.controller";
import { ensureAuthenticated } from "../middlewares/auth.middleware";
import { ensureRole } from "../middlewares/role.middleware";

export const studentAssessmentRouter = Router();

studentAssessmentRouter.use(
  ensureAuthenticated,
  ensureRole("STUDENT"),
);

studentAssessmentRouter.get(
  "/",
  listStudentAssessmentsController,
);

studentAssessmentRouter.get(
  "/:assessmentId",
  getStudentAssessmentController,
);