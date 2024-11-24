import { NextFunction, Request, Response } from "express";
import AppError from "../utils/app.error.js";

const devErrors = (err: AppError, res: Response) => {
  res.status(err.status_code).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const prodErrors = (err: AppError, res: Response) => {
  // Operational errors
  if (err.is_operational) {
    return res.status(err.status_code).json({
      status: err.status,
      error:
        typeof err.error_details === "string"
          ? { message: err.error_details }
          : err.error_details,
    });
  }

  // Pragramming or other unknown error
  // 1) Log error
  console.error("ERROR:", err);

  // 2) Send generic mesage
  return res.status(500).json({
    status: "error",
    error: { message: `Something went wrong.` },
  });
};

// Global error handling middleware
export default (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.status_code = err.status_code || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    devErrors(err, res);
  } else if (process.env.NODE_ENV === "production") {
    prodErrors(err, res);
  }
};
