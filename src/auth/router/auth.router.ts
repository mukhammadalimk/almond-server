import express from "express";
import {
  login,
  signup_with_email,
  signup_with_phone_number,
  verify,
} from "../controllers/auth.controllers";

const auth_router = express.Router();

auth_router.post("/signup/email", signup_with_email);
auth_router.post("/signup/phone", signup_with_phone_number);
auth_router.post("/verify", verify);
auth_router.post("/login", login);

export default auth_router;
