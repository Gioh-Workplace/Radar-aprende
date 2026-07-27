import {
    ApiError,
    apiRequest,
  } from "../lib/api";
  import type {
    StudentAssessmentDetails,
    StudentAssessmentResponse,
    StudentAssessmentsResponse,
    StudentAssessmentSummary,
    StudentSubmission,
    StudentSubmissionResponse,
    SubmitStudentAssessmentInput,
    SubmitStudentAssessmentResponse,
  } from "../types/student";
  
  export async function getStudentAssessments():
  Promise<StudentAssessmentSummary[]> {
    const response =
      await apiRequest<StudentAssessmentsResponse>(
        "/student/assessments",
      );
  
    return response.assessments;
  }
  
  export async function getStudentAssessment(
    assessmentId: string,
  ): Promise<StudentAssessmentDetails> {
    const response =
      await apiRequest<StudentAssessmentResponse>(
        `/student/assessments/${assessmentId}`,
      );
  
    return response.assessment;
  }
  
  export async function getStudentSubmission(
    assessmentId: string,
  ): Promise<StudentSubmission> {
    const response =
      await apiRequest<StudentSubmissionResponse>(
        `/student/assessments/${assessmentId}/submission`,
      );
  
    return response.submission;
  }
  
  export async function getStudentSubmissionOrNull(
    assessmentId: string,
  ): Promise<StudentSubmission | null> {
    try {
      return await getStudentSubmission(
        assessmentId,
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 404
      ) {
        return null;
      }
  
      throw error;
    }
  }
  
  export async function submitStudentAssessment(
    assessmentId: string,
    input: SubmitStudentAssessmentInput,
  ): Promise<StudentSubmission> {
    const response =
      await apiRequest<SubmitStudentAssessmentResponse>(
        `/student/assessments/${assessmentId}/submissions`,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      );
  
    return response.submission;
  }