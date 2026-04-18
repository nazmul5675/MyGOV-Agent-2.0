import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const sessionExchangeSchema = z.object({
  idToken: z.string().min(10),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Enter your full name.")
      .max(120, "Full name is too long."),
    email: z.email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/\d/, "Include at least one number."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export const forgotPasswordSchema = z.object({
  email: z.email("Enter the email address linked to your account."),
});

export const registerProfileSchema = z.object({
  idToken: z.string().min(10),
  fullName: z
    .string()
    .trim()
    .min(3, "Enter your full name.")
    .max(120, "Full name is too long."),
});
