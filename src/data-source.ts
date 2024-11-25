import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
dotenv.config();

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DB,
  synchronize: true, // Automatically sync database schema (use with caution)
  logging: false, // Enable for debugging queries
  entities: [__dirname + "/entities/*.ts"], // Your entities/models
});

AppDataSource.initialize()
  .then(() => console.log("PostgreSQL connection successful."))
  .catch((err) => console.error("PostgreSQL connection error:", err.message));

export default AppDataSource;
