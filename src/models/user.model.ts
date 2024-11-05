import Mongoose, { Schema } from "mongoose";
import { IUser } from "../types/IUser";
import { SuspensionReason } from "../data/suspension.reasons";

const UserSchema = new Mongoose.Schema(
  {
    first_name: {
      type: String,
      trim: true,
      min: 2,
      max: 25,
      required: true,
    },
    family_name: {
      type: String,
      trim: true,
      min: 2,
      max: 25,
      default: "",
    },
    phone_number_details: {
      country_code: { type: String, trim: true },
      phone_number: { type: String, trim: true, unique: true },
    },
    email: {
      type: String,
      min: 7,
      max: 64,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // It is the order of the user based on when they joined the website.
    ordinal_number: { type: Number, unique: true, required: true },

    photo: String,
    photo_blurred: String,

    region_id: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      required: true,
    },
    sex: {
      type: String,
      enum: ["male", "female"],
    },
    lang: {
      type: String,
      required: true,
      enum: ["uz", "ru", "en"],
      default: "uz",
    },

    // RATING
    average_rating: {
      type: Number,
      min: 1,
      max: 5,
      set: (val: number) => Math.round(val * 10) / 10,
      default: 0,
    },
    ratings_quantity: { type: Number, default: 0 },

    //
    blocked_users: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // If the user adds another user to his favorite users list, het gets notified when one of the users in his favorite_users list posts an item for sale.
    favorite_users: [{ type: Schema.Types.ObjectId, ref: "User" }],

    favorite_items: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    favorite_properties: [{ type: Schema.Types.ObjectId, ref: "Property" }],
    favorite_cars: [{ type: Schema.Types.ObjectId, ref: "Car" }],
    favorite_jobs: [{ type: Schema.Types.ObjectId, ref: "Job" }],

    // ------------ SECURITY SECTION ------------
    is_account_suspended: { type: Boolean, default: false, required: true },
    suspension_reasons: [
      { type: String, enum: Object.values(SuspensionReason) },
    ],

    is_verified_user: { type: Boolean, default: false, required: true },
    is_phone_number_verified: { type: Boolean, default: false, required: true },
    is_email_verified: { type: Boolean, default: false, required: true },

    // PASSWORD
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 64,
      trim: true,
      select: false,
    },
    password_changed_at: Date,

    // Verification for sign up with phone number and verifying phone number if the user has signed up with the email previously.
    verification_code: { type: Number, select: false },
    verification_code_expires_at: { type: Date, select: false },

    // PHONE NUMBER CHANGE TOKEN
    phone_number_change_token: { type: String, select: false },
    phone_number_change_token_expires_at: { type: Date, select: false },

    // EMAIL CHANGE TOKEN
    email_change_token: { type: String, select: false },
    email_change_token_expires_at: { type: Date, select: false },

    // RESET PASSWORD TOKEN
    reset_password_token: { type: String, select: false },
    reset_password_token_expires_at: { type: Date, select: false },

    //
    all_sessions: [
      {
        last_seen: Date,
        ip_address: String,
        created_at: Date,
        address: String,
        refresh_token: String,
      },
    ],
  },
  { timestamps: true }
);

const User = Mongoose.model<IUser>("User", UserSchema);
export default User;
