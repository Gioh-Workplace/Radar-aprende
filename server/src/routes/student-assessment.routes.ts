import { Router } from "express";

import {
  getStudentAssessmentController,
  getSubmissionController,
  listStudentAssessmentsController,
  submitAssessmentController,
} from "../controllers/student-assessment.controller";
import { ensureAuthenticated } from "../middlewares/auth.middleware";
import { ensureRole } from "../middlewares/role.middleware";

export const studentAssessmentRouter =
  Router();

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

studentAssessmentRouter.post(
  "/:assessmentId/submissions",
  submitAssessmentController,
);

studentAssessmentRouter.get(
  "/:assessmentId/submission",
  getSubmissionController,
);