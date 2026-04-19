import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI?.trim();

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured in environment variables");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "campus-recruitment-management-system",
        bufferCommands: false,
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
