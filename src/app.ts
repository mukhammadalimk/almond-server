import express, { Express, NextFunction, Request, Response } from "express";
import AppError from "./utils/app.error.js";
import cookieParser from "cookie-parser";
import auth_router from "./routes/auth.router.js";
import global_error_handler from "./controllers/error.controllers.js";

const app: Express = express();

// Body parser
app.use(express.json());

// Middleware for cookies
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", auth_router);

// Handling Unhandled Routes
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this sever.`, 404));
});

// Global error handling middleware
app.use(global_error_handler);

export default app;
