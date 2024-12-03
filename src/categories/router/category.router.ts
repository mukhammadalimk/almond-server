import express from "express";
import {
  protect_routes,
  restrict_to,
} from "../../auth/controllers/auth.controllers";
import {
  create_category,
  get_all_categories,
  get_category,
  get_category_with_hierarchy,
} from "../controllers/category.controllers";

const category_router = express.Router();

category_router.get("/:category_id", get_category);
category_router.get("/:category_id/hierarchy", get_category_with_hierarchy);

category_router
  .route("/")
  .post(protect_routes, restrict_to("admin"), create_category)
  .get(get_all_categories);

export default category_router;
