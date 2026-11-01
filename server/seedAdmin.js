import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js";

dotenv.config();

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.log("Usage: node seedAdmin.js <email> <password (min 8 characters)>");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URL);

if (await Admin.countDocuments()) {
  console.log("Admin already exists. Use Forgot password to change it.");
} else {
  await Admin.create({ email, passwordHash: await bcrypt.hash(password, 10) });
  console.log("Admin created:", email);
}

await mongoose.disconnect();