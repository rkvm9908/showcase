import { Router } from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import upload, { uploadImage, deleteImage } from "../middleware/upload.js";

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

export default function makeCrud(Model, folder, fields) {
    const router = Router();

    // Allowed fields mattum eduthukkum (req.body-la vera edhavadhu vandha ignore pannum)
    const pick = (body) =>
        Object.fromEntries(
            fields.filter((f) => body[f] !== undefined).map((f) => [f, String(body[f]).trim()])
        );
    const badLink = (d) => d.link && !/^https?:\/\//i.test(d.link);
    const validId = (req, res, next) =>
        mongoose.isValidObjectId(req.params.id)
            ? next()
            : res.status(404).json({ message: "Not found" });

    // Public: ellarum paarkalam
    router.get("/", wrap(async (req, res) => {
        res.json(await Model.find().sort({ createdAt: -1 }));
    }));

    // Admin: add
    router.post("/", auth, upload.single("image"), wrap(async (req, res) => {
        const data = pick(req.body);
        if (!data.title) return res.status(400).json({ message: "Title is required" });
        if (badLink(data))
            return res.status(400).json({ message: "Link must start with http:// or https://" });

        if (req.file) {
            const img = await uploadImage(req.file.buffer, `portfolio/${folder}`);
            data.image = img.url;
            data.imageId = img.id;
            data.file = img.file;
        }
        res.status(201).json(await Model.create(data));
    }));

    // Admin: edit
    router.put("/:id", auth, validId, upload.single("image"), wrap(async (req, res) => {
        const item = await Model.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Not found" });

        const data = pick(req.body);
        if ("title" in data && !data.title)
            return res.status(400).json({ message: "Title is required" });
        if (badLink(data))
            return res.status(400).json({ message: "Link must start with http:// or https://" });

        if (req.file) {
            await deleteImage(item.imageId); // pazhaya image delete
            const img = await uploadImage(req.file.buffer, `portfolio/${folder}`);
            data.image = img.url;
            data.imageId = img.id;
            data.file = img.file;
        } else if (req.body.removeImage === "true") {
            await deleteImage(item.imageId);
            data.image = "";
            data.imageId = "";
            data.file = "";
        }

        Object.assign(item, data);
        await item.save();
        res.json(item);
    }));

    // Admin: delete
    router.delete("/:id", auth, validId, wrap(async (req, res) => {
        const item = await Model.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "Not found" });
        await deleteImage(item.imageId);
        await item.deleteOne();
        res.json({ message: "Deleted successfully!" });
    }));

    return router;
}