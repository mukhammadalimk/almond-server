import app from "./app.js";
import dotenv from "dotenv";
import AppDataSource from "./data-source";

dotenv.config();

AppDataSource.initialize();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
