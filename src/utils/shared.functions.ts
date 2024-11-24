import { Locale } from "../types/shared.types";

export const is_valid_locale = (locale: any): locale is Locale => {
  return ["uz", "ru", "en"].includes(locale);
};

// Extract locale from cookies
export const get_locale = (user_locale: string | undefined): Locale => {
  return is_valid_locale(user_locale) ? user_locale : "uz";
};
