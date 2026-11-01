import mongoose from "mongoose";

const workSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    kind: { type: String, enum: ["3d", "ui"], required: true },
    description: { type: String, default: "", trim: true },
    tools: { type: String, default: "", trim: true },
    link: { type: String, default: "", trim: true },
    images: [{ url: String, id: String, _id: false }], // first image = cover
  },
  { timestamps: true }
);

export default mongoose.model("Work", workSchema);