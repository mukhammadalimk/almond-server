import express from "express";
import {
  login,
  logout,
  protect_routes,
  send_verification_code_to_email,
  send_verification_code_to_phone_number,
  signup_with_email,
  signup_with_phone_number,
  verify,
} from "../controllers/auth.controllers";

const auth_router = express.Router();

auth_router.post("/signup/email", signup_with_email);
auth_router.post("/signup/phone", signup_with_phone_number);
auth_router.post("/verify", verify);
auth_router.get("/send-v-code/email", send_verification_code_to_email);
auth_router.get("/send-v-code/phone", send_verification_code_to_phone_number);

auth_router.post("/login", login);
auth_router.get("/logut", protect_routes, logout);

export default auth_router;
