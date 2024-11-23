import { ObjectId } from "mongoose";
import { SuspensionReason } from "../data/suspension.reasons";

type RegionID = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

interface LoginSession {
  last_seen: Date;
  ip_address: string;
  created_at: Date;
  address: string;
  refresh_token: string;
}

export interface IUser extends Document {
  _id: ObjectId;
  first_name: string;
  family_name?: string;
  phone_number_details: {
    country_code?: string;
    phone_number?: string;
  };
  username: string;
  email?: string;
  ordinal_number: number;
  profile_image?: string;
  region_id: RegionID;
  sex: "male" | "female";
  lang: "uz" | "ru" | "en";

  role: "user" | "admin";
  status: "pending" | "active" | "inactive";

  average_rating: number;
  ratings_quantity: number;

  blocked_users: Array<ObjectId> | [];

  favorite_users: Array<ObjectId> | [];

  favorite_items: Array<ObjectId> | [];
  favorite_properties: Array<ObjectId> | [];
  favorite_cars: Array<ObjectId> | [];
  favorite_jobs: Array<ObjectId> | [];

  is_account_suspended: boolean;
  suspension_reason: SuspensionReason[] | [];

  is_verified_user: boolean;
  is_phone_number_verified: boolean;
  is_email_verified: boolean;

  // PASSWORD
  password: string;
  password_changed_at?: Date;

  verification_code?: number;
  verification_code_expires_at?: Date;

  phone_number_change_token?: String;
  phone_number_change_token_expires_at?: Date;

  email_change_token?: String;
  email_change_token_expires_at?: Date;

  reset_password_token?: String;
  reset_password_token_expires_at?: Date;

  all_sessions: Array<LoginSession> | [];

  createdAt: NativeDate;
  updatedAt: NativeDate;
  __v: number;

  isModified: (path: string) => boolean;
}
