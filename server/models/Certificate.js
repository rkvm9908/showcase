import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    issuer: { type: String, default: "", trim: true },
    category: { type: String, default: "General", trim: true },
    date: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
    imageId: { type: String, default: "" },
    file: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Certificate", certificateSchema);