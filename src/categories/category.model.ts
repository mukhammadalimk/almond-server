import Mongoose from "mongoose";
import { ICategory } from "../types/ICategory";

const CategorySchema = new Mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, unique: true },
    slug: { type: String, trim: true, required: true, unique: true },
    full_slug: { type: String, trim: true, required: true, unique: true },
    ordinal_number: { type: Number, required: true, unique: true },
  },
  { timestamps: true }
);

const Category = Mongoose.model<ICategory>("Category", CategorySchema);
export default Category;
