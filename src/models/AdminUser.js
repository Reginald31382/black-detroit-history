import mongoose from "mongoose";

const SecurityQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    answerHash: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const AdminUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "admin",
      enum: ["admin"],
    },

    securityQuestions: {
      type: [SecurityQuestionSchema],
      default: [],
    },

    recoveryAttempts: {
      type: Number,
      default: 0,
    },

    recoveryLockedUntil: {
      type: Date,
      default: null,
    },

    resetTokenHash: {
      type: String,
      default: null,
    },

    resetTokenExpires: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.AdminUser ||
  mongoose.model("AdminUser", AdminUserSchema);
