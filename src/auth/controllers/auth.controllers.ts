import { CookieOptions, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import catch_async from "../../utils/catch.async";
import { get_locale } from "../../utils/shared.functions";
import { Locale } from "../../types/shared.types";
import { signup_errors, verify_errors } from "../constants/auth.errors";
import validator from "validator";
import { UnverifiedUser, VerifiedUser } from "../../users/user.model";
import AppError from "../../utils/app.error";
import {
  create_unique_username,
  generate_unique_verification_code,
  remove_empty_properties,
} from "../../utils/auth";
import { send_email } from "../../utils/email";
import {
  send_verification_email_texts,
  signup_responses,
} from "../constants/auth.constants";
import Mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { IUser } from "../../types/IUser";
import { send_sms_to_phone_number } from "../../utils/phone_number";
import {
  validate_name_and_password,
  validate_signup_with_email_body,
  validate_signup_with_phone_number_body,
} from "../validators/auth.validotors";
dotenv.config();

const { JWT_COOKIE_EXPIRES_IN, REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET } =
  process.env;

// CREATE AND SEND TOKEN
export const create_send_token = async (
  user: IUser,
  req: Request,
  res: Response
) => {
  // Generate access and refresh tokens
  const access_token = jwt.sign({ id: user._id }, ACCESS_TOKEN_SECRET, {
    expiresIn: 60 * 60 * 24,
  });

  const refresh_token = jwt.sign({ id: user._id }, REFRESH_TOKEN_SECRET, {
    expiresIn: "60 days",
  });

  // Save refresh_token to the user
  await VerifiedUser.findByIdAndUpdate(user._id, {
    $push: {
      all_sessions: {
        refresh_token,
        logged_at: new Date(),
        last_seen: new Date(),
      },
    },
  });

  // Set jwt token to cookies
  const cookieOptions: CookieOptions = {
    expires: new Date(
      Date.now() + Number(JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    // httpOnly: true, // this ensures that cookie can not be modifed by the browser,
    // sameSite: "strict",
    secure: true,
    // secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };

  res.cookie("_almond_key_", refresh_token, cookieOptions);
  res.clearCookie("_almond_email_");
  res.clearCookie("_almond_country_code_");
  res.clearCookie("_almond_phone_number_");

  // Remove password and refresh_token from output
  user.password = undefined;
  user.all_sessions = undefined;

  return res.status(200).json({ status: "success", access_token, data: user });
};

// SIGN UP WITH EMAIL
export const signup_with_email = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const session = await Mongoose.startSession(); // Start a session
    session.startTransaction(); // Start a transaction

    // Get locale from cookies and validate it
    const locale = get_locale(req.cookies.user_locale);

    // Cookie options to set email to cookies in browser
    const cookieOptions: CookieOptions = {
      expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      // httpOnly: true, // this ensures that cookie can not be modifed by the browser,
      // sameSite: "strict",
      secure: true,
      // secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    };

    try {
      // Get necessary data from request
      const { email, first_name, password } = req.body;

      let errors = validate_signup_with_email_body(req.body, locale);

      // Return errors if there is any
      const has_error = Object.values(errors).some((value) => value !== "");
      if (has_error) {
        return next(new AppError(remove_empty_properties(errors), 400));
      }

      // Check if user with the email already exists
      const verified_user: IUser = await VerifiedUser.findOne({ email });
      if (verified_user) {
        return next(
          new AppError(signup_errors[locale].email_already_exists, 400)
        );
      }

      // Create a unique verification code
      const verification_code = await generate_unique_verification_code();

      // Check if the user has tried to sign up in the last 7 days
      const unverified_user: IUser = await UnverifiedUser.findOne({ email });

      let new_user: IUser;
      // If yes, generate new verification code and send it to user's phone number
      if (unverified_user) {
        unverified_user.verification_code = verification_code;
        unverified_user.verification_code_expires_at = new Date(
          Date.now() + 10 * 60 * 1000
        );

        await unverified_user.save({ validateBeforeSave: false });

        // Send verification code to user's email
        await send_email({
          from: "Almond <mailtrap@almond.uz>",
          to: unverified_user.email,
          subject: send_verification_email_texts[locale].for_sign_up.subject,
          text:
            send_verification_email_texts[locale].for_sign_up.text +
            unverified_user.verification_code,
        });

        res.cookie("_almond_email_", unverified_user.email, cookieOptions);
      } else {
        // Create user in the database
        new_user = await UnverifiedUser.create(
          [
            {
              email,
              first_name,
              password,
              account_status: "pending",
              lang: locale,
              verification_code,
              verification_code_expires_at: new Date(
                Date.now() + 10 * 60 * 1000
              ),
            },
          ],
          { session }
        )[0];

        // Send verification code to user's email
        await send_email({
          from: "Almond <mailtrap@almond.uz>",
          to: new_user.email,
          subject: send_verification_email_texts[locale].for_sign_up.subject,
          text:
            send_verification_email_texts[locale].for_sign_up.text +
            new_user.verification_code,
        });

        res.cookie("_almond_email_", new_user.email, cookieOptions);
      }

      await session.commitTransaction(); // Commit if everything succeeds
      session.endSession();

      return res.status(201).json({
        status: "success",
        message: signup_responses[locale].sent_to_email,
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

// SIGN UP WITH PHONE NUMBER
export const signup_with_phone_number = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const session = await Mongoose.startSession(); // Start a session
    session.startTransaction(); // Start a transaction

    // Get locale from cookies and validate it
    const locale = get_locale(req.cookies.user_locale);

    // Cookie options to set phone number to cookies in browser
    const cookieOptions: CookieOptions = {
      expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      // httpOnly: true, // this ensures that cookie can not be modifed by the browser,
      // sameSite: "strict",
      secure: true,
      // secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    };

    try {
      // Get necessary data from request
      const { first_name, password, phone_number_details } = req.body;

      let errors = validate_signup_with_phone_number_body(req.body, locale);

      // Return errors if there is any
      const has_error = Object.values(errors).some((value) => value !== "");
      if (has_error) {
        return next(new AppError(remove_empty_properties(errors), 400));
      }

      // Check if user with the coming phone number already exists
      const verified_user: IUser = await VerifiedUser.findOne({
        phone_number_details,
      });

      if (verified_user) {
        return next(
          new AppError(signup_errors[locale].phone_number_already_exists, 400)
        );
      }

      // Check if user with the coming phone number already exists
      const unverified_user: IUser = await UnverifiedUser.findOne({
        phone_number_details,
      });

      // Create a unique verification code
      const verification_code = await generate_unique_verification_code();

      let new_user: IUser;

      // If yes, generate new verification code and send it to user's phone number
      if (unverified_user) {
        unverified_user.verification_code = verification_code;
        unverified_user.verification_code_expires_at = new Date(
          Date.now() + 10 * 60 * 1000
        );

        await unverified_user.save({ validateBeforeSave: false });

        await send_sms_to_phone_number(
          "This is test from Eskiz",
          unverified_user.phone_number_details.phone_number
        );

        res.cookie(
          "_almond_phone_number_",
          unverified_user.phone_number_details.phone_number,
          cookieOptions
        );
        res.cookie(
          "_almond_country_code_",
          unverified_user.phone_number_details.country_code,
          cookieOptions
        );
      } else {
        // Create user in the database
        new_user = await UnverifiedUser.create(
          [
            {
              first_name,
              password,
              account_status: "pending",
              phone_number_details: {
                country_code: phone_number_details.country_code,
                phone_number: phone_number_details.phone_number,
              },
              lang: locale,
              verification_code,
              verification_code_expires_at: new Date(
                Date.now() + 10 * 60 * 1000
              ),
            },
          ],
          { session }
        )[0];

        await send_sms_to_phone_number(
          "This is test from Eskiz",
          new_user.phone_number_details.phone_number
        );

        res.cookie(
          "_almond_phone_number_",
          new_user.phone_number_details.phone_number,
          cookieOptions
        );
        res.cookie(
          "_almond_country_code_",
          new_user.phone_number_details.country_code,
          cookieOptions
        );
      }

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

export const verify = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const { verification_code } = req.body;

    // TODO: I will think about changing it.
    const email = req.cookies._almond_email_;
    const country_code = req.cookies._almond_country_code_;
    const phone_number = req.cookies._almond_phone_number_;

    // Get locale from cookies and validate it
    const locale = get_locale(req.cookies.user_locale);

    // Check if verification code exists in request
    if (verification_code === "") {
      return next(new AppError(verify_errors[locale].code_absent, 400));
    }

    // Check if verification code includes only numbers
    if (!/^\d+$/.test(verification_code)) {
      return next(new AppError(verify_errors[locale].code_not_numeric, 400));
    }

    let user: IUser;

    // Get user based on verification code and email/phone number
    if (email) {
      user = await UnverifiedUser.findOne({ verification_code, email }).select(
        "+verification_code_expires_at +password"
      );
    } else if (phone_number) {
      user = await UnverifiedUser.findOne({
        verification_code,
        phone_number_details: { country_code, phone_number },
      }).select("+verification_code_expires_at +password");
    }

    // Check if verification code is valid
    if (!user) {
      return next(new AppError(verify_errors[locale].code_invalid, 400));
    }

    // Check if verification code has expired
    if (user.verification_code_expires_at < new Date(Date.now())) {
      return next(new AppError(verify_errors[locale].code_expired, 400));
    }

    // Create a unique username based on user's name
    const username = await create_unique_username(user.first_name);

    // Delete the user from unverifiedusers collection and create new user in users collection
    user.verification_code = undefined;
    user.verification_code_expires_at = undefined;
    user.account_status = "active";
    user.username = username;
    if (phone_number) {
      user.is_verified_user = true;
      user.is_phone_number_verified = true;
    }
    await UnverifiedUser.findByIdAndDelete(user._id);
    user._id = undefined;
    user = JSON.parse(JSON.stringify(user));
    const new_user = await VerifiedUser.create(user);

    // If everything is okay, verify user and send token
    create_send_token(new_user, req, res);
  }
);
