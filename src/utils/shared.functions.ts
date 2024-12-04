import { Locale } from "../types/shared.types";

export const is_valid_locale = (locale: any): locale is Locale => {
  return ["uz", "ru", "en"].includes(locale);
};

// Extract locale from cookies
export const get_locale = (user_locale: string | undefined): Locale => {
  return is_valid_locale(user_locale) ? user_locale : "uz";
};

export function clean_object(obj: Record<string, any>): Record<string, any> {
  // Create a new object to hold non-empty properties
  const result: Record<string, any> = {};

  // Iterate over the object’s keys
  for (const [key, value] of Object.entries(obj)) {
    // Check if the value is neither null, undefined, nor an empty string
    if (value !== undefined && value !== null && value !== "") {
      // Recursively clean nested objects
      result[key] =
        typeof value === "object" && !Array.isArray(value)
          ? clean_object(value)
          : value;
    }
  }

  return result;
}
