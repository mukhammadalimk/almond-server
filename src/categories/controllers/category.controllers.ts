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

// GET CATEGORY
export const get_category = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const { category_id } = req.params;

    // Get locale from cookies and validate it
    const locale = get_locale(req.cookies.user_locale);

    // Get categiry repository
    const category_repo = AppDataSource.getRepository(Category);

    // Find category from databasse
    const category = await category_repo.findOne({
      where: { id: category_id },
    });

    if (!category) {
      return next(new AppError("Category not found.", 404));
    }

    // Extract the name based on locale
    const translation = category.translations.find((t) => t.lang === locale);
    const name = translation
      ? translation.name
      : category.translations.find((t) => t.lang === locale).name;

    // Customize the response
    const customized_category = {
      id: category.id,
      legacy_id: category.legacy_id,
      slug: category.slug,
      full_slug: category.full_slug,
      name,
    };

    return res
      .status(200)
      .json({ status: "success", data: customized_category });
  }
);

// GEY CATEGORY WITH FULL HIERARCHY
export const get_category_with_hierarchy = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const { category_id } = req.params;

    // Get locale from cookies and validate it
    const locale = get_locale(req.cookies.user_locale);

    const category_repo = AppDataSource.getRepository(Category);

    // Fetch the current category with parent relationships
    const category = await category_repo.findOne({
      where: { id: category_id },
      relations: ["parent_category"],
    });

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    const hierarchy = [];
    let currentCategory = category;

    // Traverse up the hierarchy to build the full path
    while (currentCategory) {
      hierarchy.unshift({
        slug: currentCategory.slug,
        name: currentCategory.translations.find((t) => t.lang === locale)?.name,
        id: currentCategory.id,
        full_slug: currentCategory.full_slug,
        legacy_id: currentCategory.legacy_id,
      });

      if (currentCategory.parent_category === null) {
        break;
      }

      currentCategory = await category_repo.findOne({
        where: { id: currentCategory.parent_category?.id },
        relations: ["parent_category"],
      });
    }

    return res.status(200).json({ status: "success", data: hierarchy });
  }
);
