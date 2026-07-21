import mongoose from "mongoose";

export async function connectToDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined.");
  }

  await mongoose.connect(mongoUri);

  console.log("MongoDB connected successfully.");
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();

  console.log("MongoDB connection closed.");
}