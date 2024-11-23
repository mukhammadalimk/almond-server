import { Locale } from "../types/shared.types";

export const is_valid_locale = (locale: any): locale is Locale => {
  return ["uz", "ru", "en"].includes(locale);
};
