import { NextFunction, Request, Response } from "express";
import catch_async from "../../utils/catch.async";
import AppDataSource from "../../data-source";
import { Category } from "../../entities/Category";
import slugify from "slugify";
import AppError from "../../utils/app.error";
import { get_locale } from "../../utils/shared.functions";

// CREATE CATEGORY
export const create_category = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const { translations, parent_category_id, slug } = req.body;

    // Return an error if translations does not come as an array
    if (!translations || !Array.isArray(translations)) {
      return next(
        new AppError(
          "Translations are required and must be an array of objects.",
          400
        )
      );
    }

    // Return an error if english translation does not exist
    const english_translation = translations.find((t) => t.lang === "en");
    if (!english_translation || !english_translation.name) {
      return next(new AppError("English translation is required.", 400));
    }

    // Get category repository
    const category_repo = AppDataSource.getRepository(Category);

    // Prepare category data
    const category_data = {
      translations,
      slug: slugify(slug || english_translation.name, { lower: true }),
      full_slug: slugify(slug || english_translation.name, { lower: true }),
    };

    // Add parent category
    if (parent_category_id) {
      // Check if the parent category exists
      const parent_category = await category_repo.findOne({
        where: { id: parent_category_id },
      });

      if (!parent_category) {
        return next(new AppError("Parent category not found.", 404));
      }

      // Update full_slug for child category
      category_data.full_slug = `${parent_category.full_slug}/${category_data.slug}`;
      category_data["parent_category"] = parent_category;
    }

    // Create and save the category
    const new_category = category_repo.create(category_data);
    await category_repo.save(new_category);

    return res.status(201).json({ status: "success", data: new_category });
  }
);
