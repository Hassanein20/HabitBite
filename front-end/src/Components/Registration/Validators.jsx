import { z } from "zod";

export const emailSchema = z
  .string()
  .email({ message: "Invalid email address" });
export const passwordSchema = z
  .string()
  .min(8, { message: "Must be at least 8 characters" })
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[0-9]/, "Must contain number")
  .regex(/[^A-Za-z0-9]/, "Must contain special character");
