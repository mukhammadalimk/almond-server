import validator from "validator";
import { Locale } from "../../types/shared.types";
import { signup_errors } from "../constants/auth.errors";
import {
  SignupWithEmailRequestBody,
  SignupWithPhoneNumberRequestBody,
} from "../types/auth.types";
import bcrypt from "bcrypt";

// Validate first_name and password
export const validate_name_and_password = (
  first_name: string,
  password: string,
  locale: Locale
): Record<string, string> => {
  let errors: Record<string, string> = {};

  if (first_name.length < 2 || first_name.length > 25) {
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

// Validate req.body in signup_with_email
export const validate_signup_with_email_body = (
  body: SignupWithEmailRequestBody,
  locale: Locale
): Record<string, string> => {
  const { email, first_name, password } = body;

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

  return errors;
};

// Validate req.body in signup_with_phone_number
export const validate_signup_with_phone_number_body = (
  body: SignupWithPhoneNumberRequestBody,
  locale: Locale
): Record<string, string> => {
  // TODO: validate country_code
  const { country_code, phone_number, first_name, password } = body;

  // Validate name and password
  let errors = validate_name_and_password(first_name, password, locale);

  // Check the validation of the phone number
  if (phone_number?.length !== 9) {
    errors.phone_number = signup_errors[locale].invalid_phone_number;
  }

  return errors;
};

export const validate_password = async (
  candidate_password: string,
  current_password: string
): Promise<boolean> => {
  return bcrypt.compare(candidate_password, current_password);
};

export const password_changed_after_token = (
  password_changed_at: Date,
  token_issued_time: number
) => {
  const password_changed_time = parseInt(
    String(password_changed_at.getTime() / 1000),
    10
  );

  return token_issued_time < password_changed_time;
};
