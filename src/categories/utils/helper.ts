import { Category } from "../../entities/Category";
import { CustomizedCategoryResponse } from "../types";

export function customize_translations(
  categories: Category[],
  locale: string
): CustomizedCategoryResponse[] {
  return categories.map((category) => {
    // Find the translation matching the locale
    const translation = category.translations.find(
      (t: { lang: string; name: string }) => t.lang === locale
    );

    // Recursively process the children if they exist
    const children = category.children
      ? customize_translations(category.children, locale)
      : [];

    // Return the updated category
    return {
      id: category.id,
      legacy_id: category.legacy_id,
      slug: category.slug,
      full_slug: category.full_slug,
      name: translation.name, // Add the localized name
      children, // Include the processed children
    };
  });
}
