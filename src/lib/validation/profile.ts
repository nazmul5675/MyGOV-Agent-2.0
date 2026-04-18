import { z } from "zod";

export const profileBasicsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Enter your full name.")
    .max(120, "Full name is too long."),
  dateOfBirth: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;
      return date <= new Date();
    }, "Enter a valid date of birth.")
    .refine((value) => {
      if (!value) return true;
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthOffset = today.getMonth() - birthDate.getMonth();
      if (monthOffset < 0 || (monthOffset === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1;
      }
      return age >= 13;
    }, "Profile age must be at least 13 years."),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^[+\d\s()-]{8,20}$/.test(value), "Enter a valid phone number."),
  addressText: z
    .string()
    .trim()
    .max(200, "Location note is too long.")
    .optional(),
});
