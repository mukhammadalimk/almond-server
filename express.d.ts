import { IUser } from "./src/types/IUser.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
