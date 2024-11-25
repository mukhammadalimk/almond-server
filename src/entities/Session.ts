import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { IsDate, IsIP, IsJWT, IsString } from "class-validator";
import { User } from "./User";

@Entity()
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id: string; // UUID type for primary key

  @Column({ type: "text" })
  @IsString()
  @IsJWT()
  refresh_token: string;

  @Column({ type: "timestamp" })
  @IsDate()
  logged_at: Date;

  @Column({ type: "timestamp" })
  @IsDate()
  last_seen: Date;

  @Column({ type: "varchar", default: "" })
  @IsString()
  address: string;

  @Column({ type: "varchar", default: "124.5.74.47" })
  @IsIP()
  ip_address: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: "CASCADE" }) // Foreign key relation
  @JoinColumn({ name: "user" }) // Foreign key column
  user: User;
}
