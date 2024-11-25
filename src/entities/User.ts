import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from "typeorm";
import {
  IsInt,
  IsEmail,
  IsDate,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsNumberString,
  IsLowercase,
  IsString,
  IsEnum,
  IsBoolean,
} from "class-validator";

import * as bcrypt from "bcrypt";
import { Session } from "./Session";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // @PrimaryGeneratedColumn("increment", { type: "int", unsigned: true })
  // ordinal_number: number;

  @Column({ length: 25, type: "varchar" })
  first_name: string;

  @Column({ length: 25, nullable: true, default: "", type: "varchar" })
  family_name: string;

  @Column({ length: 2, nullable: true, type: "varchar" })
  @MinLength(2)
  @MaxLength(2)
  country_code: string;

  @Column({ length: 9, nullable: true, type: "varchar", unique: true })
  @MinLength(9)
  @MaxLength(9)
  @IsNumberString()
  phone_number: string;

  @Column({ length: 20, unique: true, type: "varchar" })
  @IsLowercase()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @Column({ length: 64, nullable: true, type: "varchar", unique: true })
  @IsEmail()
  @MaxLength(64)
  email: string;

  @Column({ nullable: true, type: "varchar" })
  @IsString()
  profile_image: string;

  @Column({ type: "enum", enum: ["male", "female"], nullable: true })
  sex: string;

  @Column({ type: "enum", enum: ["uz", "ru", "en"], default: "uz" })
  language: string;

  @Column({ type: "enum", enum: ["user", "admin"], default: "user" })
  role: string;

  @Column({
    type: "enum",
    enum: ["pending", "active", "pending_deletion"],
    default: "pending",
  })
  account_status: string;

  @Column({ type: "timestamp", nullable: true })
  @IsDate()
  account_deletion_request_date: Date;

  @Column({ type: "timestamp", nullable: true })
  @IsDate()
  account_deletion_date: Date;

  @Column({ type: "float", default: 0 })
  @Max(5)
  average_rating: number;

  @Column({ type: "int", default: 0 })
  @IsInt()
  @Min(0)
  ratings_quantity: number;

  // Many-to-Many self-referencing relationship for blocked users
  @ManyToMany(() => User)
  @JoinTable({
    name: "user_blocks", // Custom join table name
    joinColumn: {
      name: "user_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "blocked_user_id",
      referencedColumnName: "id",
    },
  })
  blocked_users: User[];

  // Many-to-Many self-referencing relationship for blocked users
  @ManyToMany(() => User)
  @JoinTable({
    name: "user_favorite_users", // Custom join table name
    joinColumn: {
      name: "user_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "favorite_user_id",
      referencedColumnName: "id",
    },
  })
  favorite_users: User[];

  @Column({ type: "boolean", default: false })
  @IsBoolean()
  is_account_suspended: boolean;

  @Column({ type: "boolean", default: false })
  @IsBoolean()
  is_verified_user: boolean;

  @Column({ type: "boolean", default: false })
  @IsBoolean()
  is_phone_number_verified: boolean;

  @Column({ type: "varchar", select: false })
  @IsString()
  password: string;

  @Column({ type: "timestamp", nullable: true })
  @IsDate()
  password_changed_at: Date;

  @Column({ type: "int", nullable: true, select: false })
  @IsInt()
  verification_code: number;

  @Column({ type: "timestamp", nullable: true, select: false })
  @IsDate()
  verification_code_expires_at: Date;

  @Column({ type: "text", nullable: true, select: false })
  @IsString()
  phone_number_change_token: string;

  @Column({ type: "timestamp", nullable: true, select: false })
  @IsDate()
  phone_number_change_token_expires_at: Date;

  @Column({ type: "text", nullable: true, select: false })
  @IsString()
  email_change_token: string;

  @Column({ type: "timestamp", nullable: true, select: false })
  @IsDate()
  email_change_token_expires_at: Date;

  @Column({ type: "text", nullable: true, select: false })
  @IsString()
  reset_password_token: string;

  @Column({ type: "timestamp", nullable: true, select: false })
  @IsDate()
  reset_password_token_expires_at: Date;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    if (this.password) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}
