import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { IsString } from "class-validator";

@Entity()
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string; // UUID type for primary key

  @Column({ type: "int", generated: "increment", unique: true })
  @Index()
  legacy_id: number; // Auto-increment integer column for legacy ID

  @Column({ type: "varchar", unique: true })
  @Index()
  slug: string;

  @Column({ type: "varchar", unique: true })
  @IsString()
  @Index()
  full_slug: string;

  @Column("jsonb")
  translations: Array<{ lang: string; name: string }>;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "parent_category_id" })
  parent_category: Category;

  @OneToMany(() => Category, (category) => category.parent_category)
  children: Category[];
}
