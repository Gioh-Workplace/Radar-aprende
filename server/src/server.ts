import "dotenv/config";

import { app } from "./app";

const port = Number(process.env.PORT) || 3333;

app.listen(port, () => {
  console.log(`RadarAprende API running on http://localhost:${port}`);
});