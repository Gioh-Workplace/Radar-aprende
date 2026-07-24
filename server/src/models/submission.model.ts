import {
    Schema,
    Types,
    model,
  } from "mongoose";
  
  export interface SubmissionAnswer {
    _id?: Types.ObjectId;
    questionId: Types.ObjectId;
    selectedAlternativeId: Types.ObjectId;
    skillId: Types.ObjectId;
    isCorrect: boolean;
  }
  
  export interface Submission {
    assessmentId: Types.ObjectId;
    classroomId: Types.ObjectId;
    studentId: Types.ObjectId;
    answers: SubmissionAnswer[];
    correctAnswers: number;
    totalQuestions: number;
    score: number;
    submittedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }
  
  const submissionAnswerSchema =
    new Schema<SubmissionAnswer>(
      {
        questionId: {
          type: Schema.Types.ObjectId,
          required: true,
        },
  
        selectedAlternativeId: {
          type: Schema.Types.ObjectId,
          required: true,
        },
  
        skillId: {
          type: Schema.Types.ObjectId,
          ref: "Skill",
          required: true,
        },
  
        isCorrect: {
          type: Boolean,
          required: true,
        },
      },
      {
        _id: true,
      },
    );
  
  const submissionSchema = new Schema<Submission>(
    {
      assessmentId: {
        type: Schema.Types.ObjectId,
        ref: "Assessment",
        required: true,
        index: true,
      },
  
      classroomId: {
        type: Schema.Types.ObjectId,
        ref: "Classroom",
        required: true,
        index: true,
      },
  
      studentId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
  
      answers: {
        type: [submissionAnswerSchema],
        required: true,
      },
  
      correctAnswers: {
        type: Number,
        required: true,
        min: 0,
      },
  
      totalQuestions: {
        type: Number,
        required: true,
        min: 1,
      },
  
      score: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
  
      submittedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
    },
    {
      timestamps: true,
      collection: "submissions",
    },
  );
  
  submissionSchema.index(
    {
      assessmentId: 1,
      studentId: 1,
    },
    {
      unique: true,
    },
  );
  
  submissionSchema.index({
    classroomId: 1,
    submittedAt: -1,
  });
  
  export const SubmissionModel = model<Submission>(
    "Submission",
    submissionSchema,
  );