import { Schema, model } from "mongoose";

const skillSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "skills",
  },
);

skillSchema.index({
  teacherId: 1,
  subject: 1,
  name: 1,
});

export const SkillModel = model("Skill", skillSchema);