import { Schema, model } from "mongoose";

export const USER_ROLES = ["TEACHER", "STUDENT"] as const;

export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    registration: {
      type: String,
      trim: true,
      uppercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

userSchema.index(
  { email: 1 },
  {
    unique: true,
    sparse: true,
  },
);

userSchema.index(
  { registration: 1 },
  {
    unique: true,
    sparse: true,
  },
);

export const UserModel = model("User", userSchema);