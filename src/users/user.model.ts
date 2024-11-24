import Mongoose, { Schema } from "mongoose";
import { IUser } from "../types/IUser";
import { SuspensionReason } from "../data/suspension.reasons";
import bcrypt from "bcrypt";

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
      country_code: { type: String, trim: true, min: 2, max: 2 },
      phone_number: { type: String, trim: true, unique: true, min: 9, max: 9 },
    },

    username: {
      type: String,
      min: 4,
      max: 20,
      // It will be auto generated in our server based on their first name,
      // and can be changable in user dashboard after the user creates their account.
      // required: true,
      unique: true,
      lowercase: true,
      trim: true,
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
    ordinal_number: { type: Number, unique: true },

    profile_image: String,

    // region_id: {
    //   type: Number,
    //   enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    //   required: true,
    // },
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

    role: {
      type: String,
      enum: ["user", "admin"],
      required: true,
      default: "user",
    },
    account_status: {
      type: String,
      enum: ["pending", "active", "pending_deletion"],
      required: true,
    },
    account_deletion_request_date: Date,
    account_deletion_date: Date,

    // RATING
    average_rating: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val: number) {
          // Allow 0 only for default case
          return val === 0 || (val >= 1 && val <= 5);
        },
        message: "Average rating must be between 1 and 5, unless it's 0.",
      },
      set: (val: number) => Math.round(val * 10) / 10,
    },
    ratings_quantity: { type: Number, default: 0 },

    //
    blocked_users: [{ type: Schema.Types.ObjectId, ref: "VerifiedUser" }],

    // If the user adds another user to his favorite users list, het gets notified when one of the users in his favorite_users list posts an item for sale.
    favorite_users: [{ type: Schema.Types.ObjectId, ref: "VerifiedUser" }],

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
        logged_at: Date,
        address: String,
        refresh_token: String,
      },
    ],
  },
  { timestamps: true }
);

// Encrypting password
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const VerifiedUser = Mongoose.model<IUser>("User", UserSchema);
const UnverifiedUser = Mongoose.model<IUser>("UnverifiedUser", UserSchema);
export { VerifiedUser, UnverifiedUser };
