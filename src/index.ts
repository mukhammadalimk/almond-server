import app from "./app.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const DB = process.env.DB.replace("<PASSWORD>", process.env.DB_PSW);
mongoose.connect(DB).then(() => console.log("DB connection successful."));
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
