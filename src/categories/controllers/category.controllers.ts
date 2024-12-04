import { NextFunction, Request, Response } from "express";
import catch_async from "../../utils/catch.async";
import AppDataSource from "../../data-source";
import { Category } from "../../entities/Category";
import slugify from "slugify";
import AppError from "../../utils/app.error";
import { clean_object, get_locale } from "../../utils/shared.functions";
import { customize_translations } from "../utils/helper";
import {
  CustomizedCategoryResponse,
  UpdateOrCreateCategoryRequestBody,
} from "../types";

// CREATE CATEGORY
export const create_category = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      translations,
      parent_category_id,
      slug,
    }: UpdateOrCreateCategoryRequestBody = req.body;

    // Return an error if translations does not come as an array
    if (!translations || !Array.isArray(translations)) {
      const error = `Translations are required and must be an array of objects.`;
      return next(new AppError(error, 400));
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

    // Get category repository
    const category_repo = AppDataSource.getRepository(Category);

    // Find category from the database
    const category = await category_repo.findOneBy({ id: category_id });
    if (!category) {
      return next(new AppError("Category not found.", 404));
    }

    // Extract the name based on locale
    const translation = category.translations.find((t) => t.lang === locale);
    if (!translation) {
      return next(
        new AppError(`Translation not found for locale: ${locale}`, 400)
      );
    }

    const customized_category: CustomizedCategoryResponse = {
      id: category.id,
      legacy_id: category.legacy_id,
      slug: category.slug,
      full_slug: category.full_slug,
      name: translation.name,
    };

    return res
      .status(200)
      .json({ status: "success", data: customized_category });
  }
);

// DELETE CATEGORY - // ! this deletes all listings related to itself so be careful to use it. Better use it until production
export const delete_category = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const { category_id } = req.params;

    // Get category repository
    const category_repo = AppDataSource.getRepository(Category);

    // Check if the category exists
    const category = await category_repo.findOneBy({ id: category_id });
    if (!category) {
      return next(new AppError("Category not found.", 404));
    }

    // Perform the deletion
    try {
      await category_repo.remove(category); // This will handle cascading deletes if configured in the entity.
    } catch (error) {
      return next(
        new AppError("Error deleting category. Please try again later.", 500)
      );
    }

    return res.sendStatus(204); // No content
  }
);

// UPDATE CATEGORY EXCEPT PARENT CATEGORY - // ! Be careful when updating slug of a category who has children because children's full_slugs depend on their parents' slug
export const update_category = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    // Utility to clean request body
    const cleaned_body = clean_object(req.body);

    // Ensure the body is not empty after cleaning
    if (Object.keys(cleaned_body).length === 0) {
      return next(new AppError("No valid fields to update.", 400));
    }

    // Prevent updating the parent category using this route
    if ("parent_category_id" in cleaned_body) {
      const error = "Parent category updates are not allowed in this endpoint.";
      return next(new AppError(error, 400));
    }

    // Update the category
    const result = await AppDataSource.createQueryBuilder()
      .update(Category)
      .set(cleaned_body)
      .where("id = :id", { id: req.params.category_id })
      .returning("*") // Return the updated category
      .execute();

    // Ensure the category was updated
    if (result.affected === 0) {
      return next(new AppError("Category not found or no changes made.", 404));
    }

    return res.status(200).json({ status: "success", data: result.raw[0] });
  }
);

// UPDATE CATEGORY PARENT
export const update_category_parent = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    const { parent_category_id }: { parent_category_id: string | null } =
      req.body;
    const { category_id } = req.params;

    const category_repo = AppDataSource.getRepository(Category);

    // Find the category being updated
    const category = await category_repo.findOneBy({ id: category_id });
    if (!category) {
      return next(new AppError("Category not found.", 404));
    }

    let updating_data: { parent_category: Category | null; full_slug?: string };

    // If `parent_category_id` is null, remove the parent category
    if (parent_category_id === null) {
      updating_data = { parent_category: null, full_slug: category.slug };
    } else {
      // Otherwise, find the new parent category
      const parent_category = await category_repo.findOneBy({
        id: parent_category_id,
      });

      if (!parent_category) {
        return next(new AppError("New parent category not found.", 400));
      }

      // Prevent assigning a category as its own parent
      if (parent_category_id === category_id) {
        return next(new AppError("A category cannot be its own parent.", 400));
      }

      updating_data = {
        parent_category,
        full_slug: `${parent_category.full_slug}/${category.slug}`,
      };
    }

    // Update the category
    const updated_category = await category_repo.save({
      ...category,
      ...updating_data,
    });

    // Respond with the updated category
    return res.status(200).json({ status: "success", data: updated_category });
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

    const hierarchy: CustomizedCategoryResponse[] = [];
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

// GET ALL CATEGORIES IN JUST ONE ARRAY
export const get_all_categories = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get locale from cookies and validate it
    const locale = get_locale(req.cookies.user_locale);

    // Get category repository
    const category_repo = AppDataSource.getRepository(Category);

    // Find categories from databasse
    const categories = await category_repo.find();

    let customized_categories: CustomizedCategoryResponse[] = [];
    for (let i = 0; i < categories.length; i++) {
      const translation = categories[i].translations.find(
        (t) => t.lang === locale
      );

      customized_categories.push({
        id: categories[i].id,
        legacy_id: categories[i].legacy_id,
        slug: categories[i].slug,
        full_slug: categories[i].full_slug,
        name: translation.name,
      });
    }

    return res
      .status(200)
      .json({ status: "success", data: customized_categories });
  }
);

// This controller returns categories tree and we will use it to show the categories in frontend (Parent->children->children->children)
export const get_categories_with_children = catch_async(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get locale from cookies and validate it
    const locale = get_locale(req.cookies.user_locale);

    // Get category repository
    const category_repo = AppDataSource.getRepository(Category);

    // Fetch all top-level (parentless) categories
    const root_categories = await category_repo
      .createQueryBuilder("category")
      .leftJoinAndSelect("category.children", "children")
      .where("category.parent_category_id IS NULL")
      .getMany();

    // Recursively fetch children for each root category
    async function fetch_children(category: Category): Promise<void> {
      if (category.children.length) {
        for (const child of category.children) {
          const nested_child = await category_repo.findOne({
            where: { id: child.id },
            relations: ["children"],
          });
          child.children = nested_child?.children || [];
          await fetch_children(child);
        }
      }
    }

    for (const root_category of root_categories) {
      await fetch_children(root_category);
    }

    // Recursively customize each category
    const customized_categories: CustomizedCategoryResponse[] =
      customize_translations(root_categories, locale);

    return res
      .status(200)
      .json({ status: "success", data: customized_categories });
  }
);
