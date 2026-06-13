import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envName = process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";

let envPath = path.resolve(process.cwd(), envName);

if (!fs.existsSync(envPath)) {
  // Try parent directory
  envPath = path.resolve(process.cwd(), "..", envName);
}

if (!fs.existsSync(envPath)) {
  // Fallback to standard .env
  envPath = path.resolve(process.cwd(), ".env");
}

dotenv.config({ path: envPath });

if (process.env.NEXT_PUBLIC_OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY) {
  process.env.OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
}

