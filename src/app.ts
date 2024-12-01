import express, { Express, NextFunction, Request, Response } from "express";
import AppError from "./utils/app.error.js";
import cookieParser from "cookie-parser";
import global_error_handler from "./error/error.controllers.js";
import auth_router from "./auth/router/auth.router.js";
import category_router from "./categories/router/category.router.js";

const app: Express = express();

// Body parser
app.use(express.json());

// Middleware for cookies
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", auth_router);
app.use("/api/v1/categories", category_router);

// Handling Unhandled Routes
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this sever.`, 404));
});

// Global error handling middleware
app.use(global_error_handler);

export default app;
