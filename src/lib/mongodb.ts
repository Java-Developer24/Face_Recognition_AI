import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "❌ Please define the MONGODB_URI environment variable inside .env.local"
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  console.log("⚡ connectDB() called");

  if (cached.conn) {
    console.log("♻️ Using existing MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("🔄 Creating new MongoDB connection...");
    const opts = { bufferCommands: false };

    cached.promise = mongoose
      .connect(MONGODB_URI as string, opts)
      .then((mongoose) => {
        console.log("✅ Successfully connected to MongoDB");
        console.log(
          "📊 Database name:",
          mongoose.connection.db?.databaseName || "Unknown"
        );
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ Failed to connect to MongoDB:", err.message);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error("🔥 MongoDB connection error (outer catch):", e);
    cached.promise = null; // reset so it can retry next time
    throw e;
  }

  return cached.conn;
}

export default connectDB;

declare global {
  // eslint-disable-next-line no-var
  var mongoose: any;
}
