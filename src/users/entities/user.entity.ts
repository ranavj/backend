import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users') // PostgreSQL mein table ka naam 'users' hoga
export class User {
  @PrimaryGeneratedColumn('uuid') // ID automatically generate hogi (e.g., a0eebc99-9c0b...)
  id: string;

  @Column({ unique: true }) // Username duplicate nahi ho sakta
  username: string;

  @Column({ unique: true }) // Email bhi unique hona chahiye
  email: string;

  @Column() // Password (Hashed form mein store hoga)
  password: string;

  @Column({ default: 'user' }) // Roles: user/admin
  role: string;

  @Column({ nullable: true }) // Profile pic URL (Cloudinary se aayega)
  avatarUrl: string;

  @CreateDateColumn() // Jab user bana, wo date auto-save hogi
  createdAt: Date;

  @UpdateDateColumn() // Jab profile update hui, wo date auto-update hogi
  updatedAt: Date;
}