import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
    description: { type: String, default: "", trim: true },
    tech: { type: String, default: "", trim: true },
    link: { type: String, default: "", trim: true },
    image: { type: String, default: "" },   // Cloudinary image URL
    imageId: { type: String, default: "" }, // Cloudinary public_id (image delete/replace panna)
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);