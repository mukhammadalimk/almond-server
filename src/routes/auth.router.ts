import express from "express";
import {
  signup_with_email,
  signup_with_phone_number,
} from "../controllers/auth.controllers";

const auth_router = express.Router();

auth_router.post("/signup/email", signup_with_email);
auth_router.post("/signup/phone", signup_with_phone_number);

export default auth_router;
