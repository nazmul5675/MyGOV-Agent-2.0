import { z } from "zod";

export const caseTypeSchema = z.enum([
  "flood_relief",
  "public_complaint",
  "reminder_renewal",
]);

export const evidenceKindSchema = z.enum(["photo", "document", "voice_note"]);

export const createCaseSchema = z.object({
  title: z.string().min(8, "Add a clear case title."),
  caseType: caseTypeSchema,
  location: z.string().min(6, "Add a location."),
  description: z.string().min(24, "Add a fuller description for faster routing."),
});

export const evidenceMetadataSchema = z.object({
  files: z.array(
    z.object({
      id: z.string().min(2),
      name: z.string().min(1),
      kind: evidenceKindSchema,
      size: z.number().nonnegative(),
      downloadUrl: z.string().url().optional(),
      storagePath: z.string().min(1).optional(),
      contentType: z.string().optional(),
    })
  ),
});

export const createCaseRequestSchema = createCaseSchema.extend({
  caseId: z.string().min(8, "A valid case id is required."),
  files: evidenceMetadataSchema.shape.files.default([]),
});

export const adminActionSchema = z.object({
  action: z.enum([
    "approve",
    "reject",
    "request_more_documents",
    "route",
    "mark_in_progress",
    "resolve",
    "internal_note",
  ]),
  note: z.string().trim().max(2000).optional(),
}).superRefine((value, context) => {
  const requiresNote = [
    "reject",
    "request_more_documents",
    "route",
    "internal_note",
  ] as const;

  if (
    requiresNote.includes(
      value.action as (typeof requiresNote)[number]
    ) &&
    (!value.note || value.note.trim().length < 12)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Add a short operational note so the timeline stays useful.",
      path: ["note"],
    });
  }
});
