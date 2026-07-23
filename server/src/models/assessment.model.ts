import {
    Schema,
    Types,
    model,
  } from "mongoose";
  
  export const ASSESSMENT_STATUSES = [
    "DRAFT",
    "PUBLISHED",
    "CLOSED",
  ] as const;
  
  export type AssessmentStatus =
    (typeof ASSESSMENT_STATUSES)[number];
  
  export interface AssessmentAlternative {
    _id?: Types.ObjectId;
    text: string;
    isCorrect: boolean;
  }
  
  export interface AssessmentQuestion {
    _id?: Types.ObjectId;
    statement: string;
    skillId: Types.ObjectId;
    alternatives: AssessmentAlternative[];
  }
  
  export interface Assessment {
    title: string;
    description?: string;
    classroomId: Types.ObjectId;
    teacherId: Types.ObjectId;
    status: AssessmentStatus;
    questions: AssessmentQuestion[];
    publishedAt?: Date;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  const alternativeSchema =
    new Schema<AssessmentAlternative>(
      {
        text: {
          type: String,
          required: true,
          trim: true,
          minlength: 1,
          maxlength: 300,
        },
  
        isCorrect: {
          type: Boolean,
          required: true,
          default: false,
        },
      },
      {
        _id: true,
      },
    );
  
  const questionSchema =
    new Schema<AssessmentQuestion>(
      {
        statement: {
          type: String,
          required: true,
          trim: true,
          minlength: 3,
          maxlength: 1000,
        },
  
        skillId: {
          type: Schema.Types.ObjectId,
          ref: "Skill",
          required: true,
        },
  
        alternatives: {
          type: [alternativeSchema],
          default: [],
        },
      },
      {
        _id: true,
      },
    );
  
  const assessmentSchema = new Schema<Assessment>(
    {
      title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 150,
      },
  
      description: {
        type: String,
        trim: true,
        maxlength: 500,
      },
  
      classroomId: {
        type: Schema.Types.ObjectId,
        ref: "Classroom",
        required: true,
        index: true,
      },
  
      teacherId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
  
      status: {
        type: String,
        enum: ASSESSMENT_STATUSES,
        default: "DRAFT",
        required: true,
      },
  
      questions: {
        type: [questionSchema],
        default: [],
      },
  
      publishedAt: {
        type: Date,
      },
  
      active: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
      collection: "assessments",
    },
  );
  
  assessmentSchema.index({
    teacherId: 1,
    createdAt: -1,
  });
  
  assessmentSchema.index({
    classroomId: 1,
    status: 1,
  });
  
  export const AssessmentModel = model<Assessment>(
    "Assessment",
    assessmentSchema,
  );