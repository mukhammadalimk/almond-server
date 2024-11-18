import { ObjectId } from "mongoose";

export interface ICategory extends Document {
  _id: ObjectId;
  name: string;
  slug: string;
  full_slug: string;
  ordinal_number: number;
  createdAt: NativeDate;
  updatedAt: NativeDate;
  __v: number;
}
