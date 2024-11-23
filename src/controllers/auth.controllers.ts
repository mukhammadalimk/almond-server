import { NextFunction, Request, Response } from "express";
import catch_async from "../utils/catch.async";
import { is_valid_locale } from "../utils/shared.functions";
import { Locale } from "../types/shared.types";
import { signup_errors } from "../constants/auth.errors";
import validator from "validator";
import User from "../models/user.model";
import AppError from "../utils/app.error";
import {
  create_unique_username,
  generate_unique_verification_code,
  remove_empty_properties,
} from "../utils/auth";
import { send_email } from "../utils/email";
import {
  send_verification_email_texts,
  signup_responses,
} from "../constants/auth.constants";
import axios from "axios";
import Mongoose from "mongoose";

// Extract locale from cookies
const get_locale = (user_locale: string | undefined): Locale => {
  return is_valid_locale(user_locale) ? user_locale : "uz";
};

// Validate first_name and password
const validate_name_and_password = (
  first_name: string,
  password: string,
  locale: Locale
): Record<string, string> => {
  let errors: Record<string, string> = {};

  if (first_name.length < 4 || first_name.length > 64) {
    errors.first_name = signup_errors[locale].invalid_first_name;
  }

  if (password.length < 8) {
    errors.password = signup_errors[locale].short_password;
  }

  if (password.length > 64) {
    errors.password = signup_errors[locale].long_password;
  }

  return errors;
};

// SIGN UP WITH EMAIL
export const signup_with_email = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const session = await Mongoose.startSession(); // Start a session
    session.startTransaction(); // Start a transaction

    const user_locale = req.cookies.user_locale;
    const locale = get_locale(user_locale);

    try {
      // Get necessary data from request
      const { email, first_name, password } = req.body;

      let errors = validate_name_and_password(first_name, password, locale);

      if (!email) {
        errors.email = signup_errors[locale].email_empty;
      }

      if (
        email &&
        (!validator.isEmail(email) || email.length < 7 || email.length > 64)
      ) {
        errors.email = signup_errors[locale].invalid_email;
      }

      // Return errors if there is any
      const has_error = Object.values(errors).some((value) => value !== "");
      if (has_error) {
        return next(new AppError(remove_empty_properties(errors), 400));
      }

      const user = await User.findOne({ email });
      if (user.status === "active") {
        return next(
          new AppError(signup_errors[locale].email_already_exists, 400)
        );
      }

      // Create a unique verification code
      const verification_code = await generate_unique_verification_code();

      if (user.status === "pending") {
        user.verification_code = verification_code;
        user.verification_code_expires_at = new Date(
          Date.now() + 10 * 60 * 1000
        );

        await user.save({ validateBeforeSave: false });

        return res.status(201).json({
          status: "success",
          message: signup_responses[locale].sent_to_email,
        });
      }

      // Create a unique username based on user's name
      const username = await create_unique_username(first_name);

      // Create user in the database
      const new_user = await User.create(
        [
          {
            email,
            first_name,
            password,
            username,
            lang: locale,
            verification_code,
            verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
          },
        ],
        { session }
      );

      // Send verification code to user's email
      await send_email({
        from: "Almond <mailtrap@almond.uz>",
        to: new_user[0].email,
        subject: send_verification_email_texts[locale].for_sign_up.subject,
        text:
          send_verification_email_texts[locale].for_sign_up.text +
          new_user[0].verification_code,
      });

      await session.commitTransaction(); // Commit if everything succeeds
      session.endSession();

      return res.status(201).json({
        status: "success",
        message: signup_responses[locale].sent_to_email,
      });
    } catch (error) {
      await session.abortTransaction(); // Rollback on failure
      session.endSession();

      return next(
        new AppError(signup_errors[locale].sending_verification_code, 500)
      );
    }
  }
);

// SIGN UP WITH PHONE NUMBER
export const signup_with_phone_number = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const session = await Mongoose.startSession(); // Start a session
    session.startTransaction(); // Start a transaction

    const user_locale = req.cookies.user_locale;
    const locale = get_locale(user_locale);

    try {
      // Get necessary data from request
      const { first_name, password, phone_number_details } = req.body;

      let errors = validate_name_and_password(first_name, password, locale);

      // Check the validation of the phone number
      if (
        phone_number_details?.phone_number &&
        phone_number_details?.phone_number.length !== 9
      ) {
        errors.phone_number = signup_errors[locale].invalid_phone_number;
      }

      // Return errors if there is any
      const has_error = Object.values(errors).some((value) => value !== "");
      if (has_error) {
        return next(new AppError(remove_empty_properties(errors), 400));
      }

      // Check if user with the coming phone number already exists
      const user = await User.findOne({
        phone_number_details: {
          country_code: phone_number_details.country_code,
          phone_number: phone_number_details.phone_number,
        },
      });

      // Create a unique verification code
      const verification_code = await generate_unique_verification_code();

      if (user.status === "active") {
        return next(
          new AppError(signup_errors[locale].phone_number_already_exists, 400)
        );
      }

      if (user.status === "pending") {
        user.verification_code = verification_code;
        user.verification_code_expires_at = new Date(
          Date.now() + 10 * 60 * 1000
        );

        await user.save({ validateBeforeSave: false });

        return res.status(201).json({
          status: "success",
          message: signup_responses[locale].sent_to_phone_number,
        });
      }

      // Create a unique username based on user's name
      const username = await create_unique_username(first_name);

      // Create user in the database
      const new_user = await User.create(
        [
          {
            first_name,
            password,
            username,
            phone_number_details: {
              country_code: phone_number_details.country_code,
              phone_number: phone_number_details.phone_number,
            },
            lang: locale,
            verification_code,
            verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
          },
        ],
        { session }
      );

      const token_config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://notify.eskiz.uz/api/auth/login",
        data: {
          email: process.env.ESKIZ_EMAIL,
          password: process.env.ESKIZ_PASSWORD,
        },
      };
      const token_response = await axios(token_config);
      const { token } = token_response.data.data;

      const message_config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://notify.eskiz.uz/api/message/sms/send",
        headers: { Authorization: `Bearer ${token}` },
        data: {
          mobile_phone: `+998` + new_user[0].phone_number_details.phone_number,
          message: `This is test from Eskiz`,
          from: "4546",
        },
      };

      await axios(message_config);

      // Commit if everything succeeds
      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        status: "success",
        message: signup_responses[locale].sent_to_phone_number,
      });
    } catch (error) {
      console.log("error:", error);
      await session.abortTransaction(); // Rollback on failure
      session.endSession();

      return next(
        new AppError(signup_errors[locale].sending_verification_code, 500)
      );
    }
  }
);
