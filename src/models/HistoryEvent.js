import mongoose from "mongoose";

const SourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    notes: String,
  },
  { _id: false },
);

const ImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    credit: String,
    rights: String,
  },
  { _id: false },
);

const HistoryEventSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    day: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },

    year: {
      type: Number,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    significance: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Civil Rights",
        "Music",
        "Business",
        "Education",
        "Politics",
        "Sports",
        "Arts & Culture",
        "Labor",
        "Community",
        "Military",
        "Media",
        "Other",
      ],
    },

    people: {
      type: [String],
      default: [],
    },

    organizations: {
      type: [String],
      default: [],
    },

    location: {
      address: String,
      neighborhood: String,
    },

    sources: {
      type: [SourceSchema],
      default: [],
    },

    images: {
      type: [ImageSchema],
      default: [],
    },

    verification: {
      status: {
        type: String,
        enum: ["draft", "needs_review", "approved", "rejected"],
        default: "draft",
      },

      notes: String,
    },

    /*
     * ARCHIVE LIFECYCLE
     *
     * active
     *   Event is available for review/posting.
     *
     * instagram
     *   Event has been approved for Instagram.
     *
     * used
     *   Event has already been used/published.
     *
     * Nothing is deleted when an event becomes used.
     */
    archive: {
      status: {
        type: String,
        enum: ["active", "instagram", "used"],
        default: "active",
        index: true,
      },

      approvedForInstagramAt: Date,

      usedAt: Date,

      usedPostId: String,

      notes: String,
    },

    instagram: {
      status: {
        type: String,
        enum: ["not_ready", "queued", "scheduled", "published", "failed"],
        default: "not_ready",
      },

      caption: {
        type: String,
        default: "",
      },

      scheduledFor: Date,

      publishedAt: Date,

      postId: String,
    },
  },
  {
    timestamps: true,
  },
);

HistoryEventSchema.index({ month: 1, day: 1 });

HistoryEventSchema.index({ year: 1 });

HistoryEventSchema.index({
  "verification.status": 1,
});

HistoryEventSchema.index({
  "archive.status": 1,
});

HistoryEventSchema.index({
  "instagram.status": 1,
});

HistoryEventSchema.index({
  month: 1,
  day: 1,
  "verification.status": 1,
  "archive.status": 1,
});

HistoryEventSchema.index({
  month: 1,
  day: 1,
  year: 1,
  title: 1,
});

const HistoryEvent =
  mongoose.models.HistoryEvent ||
  mongoose.model("HistoryEvent", HistoryEventSchema);

export default HistoryEvent;
