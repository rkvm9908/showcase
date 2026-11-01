import { Router } from "express";
import mongoose from "mongoose";
import Work from "../models/Work.js";
import auth from "../middleware/auth.js";
import upload, { uploadImage, deleteImage } from "../middleware/upload.js";

const router = Router();
const MAX = 8;
const KINDS = ["3d", "ui"];
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const txt = (b, k) => String(b[k] ?? "").trim();
const notImages = (files) => files.some((f) => !f.mimetype.startsWith("image/"));
const badLink = (l) => l && !/^https?:\/\//i.test(l);
const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(404).json({ message: "Not found" });

async function uploadAll(files) {
  const out = [];
  for (const f of files) {
    const img = await uploadImage(f.buffer, "portfolio/works");
    out.push({ url: img.url, id: img.id });
  }
  return out;
}

// Public
router.get("/", wrap(async (req, res) => {
  res.json(await Work.find().sort({ createdAt: -1 }));
}));

// Admin: add
router.post("/", auth, upload.array("images", MAX), wrap(async (req, res) => {
  const files = req.files || [];
  const data = { title: txt(req.body, "title"), kind: txt(req.body, "kind"),
    description: txt(req.body, "description"), tools: txt(req.body, "tools"), link: txt(req.body, "link") };
  if (!data.title) return res.status(400).json({ message: "Title is required" });
  if (!KINDS.includes(data.kind)) return res.status(400).json({ message: "Choose 3D Model or UI Design" });
  if (badLink(data.link)) return res.status(400).json({ message: "Link must start with http:// or https://" });
  if (notImages(files)) return res.status(400).json({ message: "Only image files are allowed" });

  data.images = await uploadAll(files);
  res.status(201).json(await Work.create(data));
}));

// Admin: edit (keep = remaining image ids in order, new files append aagum)
router.put("/:id", auth, validId, upload.array("images", MAX), wrap(async (req, res) => {
  const item = await Work.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });

  const files = req.files || [];
  let keep;
  try { keep = JSON.parse(req.body.keep || "[]"); } catch { keep = null; }
  if (!Array.isArray(keep)) return res.status(400).json({ message: "Invalid image list" });

  const kept = keep.map((id) => item.images.find((i) => i.id === id)).filter(Boolean);
  if (kept.length + files.length > MAX)
    return res.status(400).json({ message: `Maximum ${MAX} images allowed` });
  if (notImages(files)) return res.status(400).json({ message: "Only image files are allowed" });

  const title = txt(req.body, "title"), kind = txt(req.body, "kind"), link = txt(req.body, "link");
  if (!title) return res.status(400).json({ message: "Title is required" });
  if (!KINDS.includes(kind)) return res.status(400).json({ message: "Choose 3D Model or UI Design" });
  if (badLink(link)) return res.status(400).json({ message: "Link must start with http:// or https://" });

  const added = await uploadAll(files);
  const removed = item.images.filter((i) => !kept.some((k) => k.id === i.id));
  await Promise.all(removed.map((i) => deleteImage(i.id)));

  Object.assign(item, { title, kind, link,
    description: txt(req.body, "description"), tools: txt(req.body, "tools"),
    images: [...kept, ...added] });
  await item.save();
  res.json(item);
}));

// Admin: delete
router.delete("/:id", auth, validId, wrap(async (req, res) => {
  const item = await Work.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });
  await Promise.all(item.images.map((i) => deleteImage(i.id)));
  await item.deleteOne();
  res.json({ message: "Deleted" });
}));

export default router;