import mongoose from "mongoose";
import {
  afterAll,
  afterEach,
  beforeAll,
  inject,
} from "vitest";

beforeAll(async () => {
  const mongoUri = inject("MONGO_URI");

  process.env.MONGODB_URI = mongoUri;

  await mongoose.connect(
    mongoUri,
    {
      dbName: "radaraprende-test",
    },
  );
});

afterEach(async () => {
  const collections = Object.values(
    mongoose.connection.collections,
  );

  await Promise.all(
    collections.map((collection) =>
      collection.deleteMany({}),
    ),
  );
});

afterAll(async () => {
  await mongoose.disconnect();
});