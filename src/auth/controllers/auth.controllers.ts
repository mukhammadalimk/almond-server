import { CookieOptions, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import catch_async from "../../utils/catch.async";
import { get_locale } from "../../utils/shared.functions";
import {
  login_errors,
  protect_routes_errors,
  restrict_to_errors,
  signup_errors,
  token_errors,
  verify_errors,
} from "../constants/auth.errors";
import AppError from "../../utils/app.error";
import {
  create_unique_username,
  generate_unique_verification_code,
  remove_empty_properties,
} from "../utils/auth";
import { send_email } from "../../utils/email";
import {
  send_verification_email_texts,
  signup_responses,
} from "../constants/auth.constants";
import jwt, { JwtPayload } from "jsonwebtoken";
import { send_sms_to_phone_number } from "../../utils/phone_number";
import {
  password_changed_after_token,
  validate_password,
  validate_signup_with_email_body,
  validate_signup_with_phone_number_body,
} from "../validators/auth.validotors";
import AppDataSource from "../../data-source";
import { User } from "../../entities/User";
import { add_session_to_user } from "./session.controllers";
import axios from "axios";
import { Session } from "../../entities/Session";
dotenv.config();

const { JWT_COOKIE_EXPIRES_IN, REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET } =
  process.env;

// CREATE AND SEND TOKEN
export const create_send_token = async (
  user: User,
  req: Request,
  res: Response
) => {
  // Generate access and refresh tokens
  const access_token = jwt.sign({ id: user.id }, ACCESS_TOKEN_SECRET, {
    expiresIn: 60 * 60 * 24,
  });

  const refresh_token = jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET, {
    expiresIn: "60 days",
  });

  // TODO: it will be modified
  // Get location of the user
  const response = await axios.get(`http://ip-api.com/json/124.5.74.47`);
  const { city, regionName, country } = response.data;

  const session_data = {
    user: user.id,
    ip_address: "124.5.74.47",
    address: `${city} ${regionName} ${country}`,
    refresh_token,
  };

  // Save refresh_token to the user
  await add_session_to_user(session_data);

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

  user.password = undefined;
  user.password_changed_at = undefined;

  return res.status(200).json({ status: "success", access_token, data: user });
};

// SIGN UP WITH EMAIL
export const signup_with_email = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const locale = get_locale(req.cookies.user_locale);

    const { email, first_name, password } = req.body;

    let errors = validate_signup_with_email_body(req.body, locale);

    const has_error = Object.values(errors).some((value) => value !== "");
    if (has_error) {
      return next(new AppError(remove_empty_properties(errors), 400));
    }

    // Cookie options to set email to cookies in browser
    const cookie_options: CookieOptions = {
      expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      // httpOnly: true, // this ensures that cookie can not be modifed by the browser,
      // sameSite: "strict",
      secure: true,
      // secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    };

    const user_repo = AppDataSource.getRepository(User);

    // Return an error if user with the email already exists
    const existing_user = await user_repo.findOne({
      where: { email },
    });

    if (existing_user?.account_status === "active") {
      return next(
        new AppError(signup_errors[locale].email_already_exists, 400)
      );
    }

    const verification_code = await generate_unique_verification_code();

    if (existing_user?.account_status === "pending") {
      existing_user.verification_code = verification_code;
      existing_user.verification_code_expires_at = new Date(
        Date.now() + 10 * 60 * 1000
      );

      await user_repo.save(existing_user);

      await send_email({
        from: "Almond <mailtrap@almond.uz>",
        to: existing_user.email,
        subject: send_verification_email_texts[locale].for_sign_up.subject,
        text:
          send_verification_email_texts[locale].for_sign_up.text +
          existing_user.verification_code,
      });

      res.cookie("_almond_email_", existing_user.email, cookie_options);

      return res.status(201).json({
        status: "success",
        message: signup_responses[locale].sent_to_email,
      });
    }

    const username = await create_unique_username(first_name);

    const user = user_repo.create({
      email,
      first_name,
      password,
      username,
      verification_code,
      verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    await user_repo.save(user);

    await send_email({
      from: "Almond <mailtrap@almond.uz>",
      to: user.email,
      subject: send_verification_email_texts[locale].for_sign_up.subject,
      text:
        send_verification_email_texts[locale].for_sign_up.text +
        user.verification_code,
    });

    res.cookie("_almond_email_", user.email, cookie_options);

    return res.status(201).json({
      status: "success",
      message: signup_responses[locale].sent_to_email,
    });
  }
);

// SIGN UP WITH PHONE NUMBER
export const signup_with_phone_number = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get locale from cookies and validate it
    const locale = get_locale(req.cookies.user_locale);

    let errors = validate_signup_with_phone_number_body(req.body, locale);

    // Return errors if there is any
    const has_error = Object.values(errors).some((value) => value !== "");
    if (has_error) {
      return next(new AppError(remove_empty_properties(errors), 400));
    }

    // Get necessary data from request
    const { first_name, password, country_code, phone_number } = req.body;

    // Cookie options to set phone number to cookies in browser
    const cookie_options: CookieOptions = {
      expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      // httpOnly: true, // this ensures that cookie can not be modifed by the browser,
      // sameSite: "strict",
      secure: true,
      // secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    };

    const user_repo = AppDataSource.getRepository(User);

    // Return an error if user with the email already exists
    const existing_user = await user_repo.findOne({
      where: { country_code, phone_number },
    });

    if (existing_user?.account_status === "active") {
      return next(
        new AppError(signup_errors[locale].phone_number_already_exists, 400)
      );
    }

    const verification_code = await generate_unique_verification_code();

    if (existing_user?.account_status === "pending") {
      existing_user.verification_code = verification_code;
      existing_user.verification_code_expires_at = new Date(
        Date.now() + 10 * 60 * 1000
      );

      await user_repo.save(existing_user);

      await send_sms_to_phone_number(
        "This is test from Eskiz",
        existing_user.phone_number
      );

      res.cookie(
        "_almond_phone_number_",
        existing_user.phone_number,
        cookie_options
      );
      res.cookie(
        "_almond_country_code_",
        existing_user.country_code,
        cookie_options
      );

      return res.status(201).json({
        status: "success",
        message: signup_responses[locale].sent_to_phone_number,
      });
    }

    const username = await create_unique_username(first_name);

    const user = user_repo.create({
      country_code,
      phone_number,
      first_name,
      password,
      username,
      verification_code,
      verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    await user_repo.save(user);

    await send_sms_to_phone_number(
      "This is test from Eskiz",
      user.phone_number
    );

    res.cookie("_almond_phone_number_", user.phone_number, cookie_options);
    res.cookie("_almond_country_code_", user.country_code, cookie_options);

    return res.status(201).json({
      status: "success",
      message: signup_responses[locale].sent_to_phone_number,
    });
  }
);

// VERIFY SIGN UP
export const verify = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const { verification_code } = req.body;

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

    const user_repo = AppDataSource.getRepository(User);

    // Get user based on verification code and email/phone number
    const user: User = await user_repo
      .createQueryBuilder("user")
      .addSelect("user.verification_code")
      .addSelect("user.verification_code_expires_at")
      .where({ verification_code })
      .getOne();

    // Return an error is the user changes or deletes the email, country_code or phone_number
    if (email && user?.email !== email) {
      return next(new AppError(verify_errors[locale].cookies_modified, 400));
    } else if (
      phone_number &&
      (user?.country_code !== country_code ||
        user?.phone_number !== phone_number)
    ) {
      return next(new AppError(verify_errors[locale].cookies_modified, 400));
    }

    // Check if verification code is valid
    if (!user) {
      return next(new AppError(verify_errors[locale].code_invalid, 400));
    }

    // Check if verification code has expired
    if (user.verification_code_expires_at < new Date(Date.now())) {
      return next(new AppError(verify_errors[locale].code_expired, 400));
    }

    // Delete the user from unverifiedusers collection and create new user in users collection
    user.verification_code = null;
    user.verification_code_expires_at = null;
    user.account_status = "active";
    if (phone_number) {
      user.is_verified_user = true;
      user.is_phone_number_verified = true;
    }

    const updated_user = await user_repo.save(user);

    // If everything is okay, verify user and send token
    create_send_token(updated_user, req, res);
  }
);

// LOGIN WITH EMAIL OR PHONE NUMBER
export const login = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, phone_number, country_code, password } = req.body;

    // Get locale from cookies and validate it
    const locale = get_locale(req.cookies.user_locale);

    // Validate input: ensure email or phone number is provided
    if (!email && !(phone_number && country_code)) {
      return next(new AppError(login_errors[locale].missing_credentials, 400));
    }

    const user_repo = AppDataSource.getRepository(User);

    // Fetch the user based on login method
    let user_credentials: {
      email?: string;
      phone_number?: string;
      country_code?: string;
    } = {};

    if (email) {
      user_credentials = { email };
    } else if (phone_number && country_code) {
      user_credentials = { phone_number, country_code };
    }

    const user = await user_repo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where(user_credentials)
      .getOne();

    // Return an error if user is not found or password is incorrect
    if (!user || !(await validate_password(password, user.password))) {
      const error = email
        ? login_errors[locale].incorrect_credentials_email
        : login_errors[locale].incorrect_credentials_phone_number;
      return next(new AppError(error, 401));
    }

    // If everything is okay, send token and log user in
    create_send_token(user, req, res);
  }
);

// PROTECT ROUTES
export const protect_routes = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get access_token from headers
    let access_token: string;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      access_token = req.headers.authorization.split(" ")[1];
    }

    // Get refresh_token from cookies
    const refresh_token: string = req.cookies._almond_key_;

    // Get locale from cookies and validate it
    const locale = get_locale(req.cookies.user_locale);

    // Return 401 (Unauthorized) and clear jwt from cookies if access_token does not exist in headers or refresh_token does not exist in cookies
    if (!access_token || !refresh_token) {
      res.clearCookie("_almond_key_");
      return next(new AppError(token_errors.invalid_token, 401));
    }

    // Verify access_token
    try {
      jwt.verify(access_token, ACCESS_TOKEN_SECRET);
    } catch (error) {
      // Send 403 (Forbidden) if access_token has expired, and client needs to send request to "/new-access-token"
      if (error.name === "TokenExpiredError") return res.sendStatus(403);

      // Send 401 (Unauthorized) if access_token is invalid
      if (error.name === "JsonWebTokenError") {
        res.clearCookie("_almond_key_");
        return next(new AppError(token_errors.invalid_token, 401));
      }
    }

    let decoded: JwtPayload | string;
    const session_repo = AppDataSource.getRepository(Session);

    // Verify refresh_token
    try {
      decoded = jwt.verify(refresh_token, REFRESH_TOKEN_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        // Find the user and remove the refresh token from the user
        await session_repo.delete({ refresh_token: "your-refresh-token" });

        // Revoke the refresh token and send an error
        res.clearCookie("_almond_key_");
        return next(new AppError(token_errors.expired_token, 403));
      } else if (error.name === "JsonWebTokenError") {
        // Revoke the refresh token and send an error
        res.clearCookie("_almond_key_");
        return next(new AppError(token_errors.invalid_token, 401));
      }
      return next(new AppError(error.name, 500));
    }

    // Check if user still exists
    // Find the session by refresh_token and include the associated user
    const { user } = await session_repo.findOne({
      where: { refresh_token },
      relations: ["user"], // Include the user relationship
    });

    if (!user) {
      res.clearCookie("_almond_key_");
      return next(new AppError(token_errors.invalid_token, 401));
    }

    // Check if user changed password after refresh_token was issued
    if (
      user.password_changed_at &&
      password_changed_after_token(
        user.password_changed_at,
        (decoded as JwtPayload).iat
      )
    ) {
      const error = protect_routes_errors[locale].user_changed_password;
      return next(new AppError({ is_token_error: true, message: error }, 401));
    }

    // If everything is okay, allow access
    req.user = user;
    next();
  }
);

// LOGOUT
export const logout = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get refresh_token from the cookies
    const refresh_token = req.cookies._almond_key_;

    // Get session repository
    const session_repo = AppDataSource.getRepository(Session);

    // Delete the session
    await session_repo.delete({ refresh_token });

    // Revoke the refresh token from cookies and send 200 (OK)
    res.clearCookie("_almond_key_");
    return res.sendStatus(200);
  }
);

// RESTRICT ROUTES
export const restrict_to = (roles: ["user", "admin"]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      // Get locale from cookies and validate it
      const locale = get_locale(req.cookies.user_locale);

      // Send error
      return next(new AppError(restrict_to_errors[locale].not_allowed, 403));
    }
    next();
  };
};
