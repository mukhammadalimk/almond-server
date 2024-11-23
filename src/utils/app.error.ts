class AppError extends Error {
  public status_code: number;
  public status: string;
  public is_operational: boolean;
  public error_details: string | Record<string, any>;

  constructor(message: string | Record<string, any>, status_code: number) {
    // If message is an object, convert it to string for the Error base class
    super(typeof message === "string" ? message : JSON.stringify(message));

    this.status_code = status_code;
    this.status = `${status_code}`.startsWith("4") ? "failure" : "error";
    this.is_operational = true;
    this.error_details = message;

    // Maintains proper stack trace for where our error was thrown (only available on V8 engines)
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
