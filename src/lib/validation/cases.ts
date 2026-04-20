import { z } from "zod";

export const caseTypeSchema = z.enum([
  "flood_relief",
  "public_complaint",
  "reminder_renewal",
]);

export const evidenceKindSchema = z.enum(["photo", "document", "voice_note"]);
export const fileReviewStatusSchema = z.enum([
  "uploaded",
  "under_review",
  "accepted",
  "needs_replacement",
  "rejected",
]);

export const createCaseSchema = z.object({
  title: z.string().min(8, "Add a clear case title."),
  caseType: caseTypeSchema,
  location: z.string().min(3, "Add a location name."),
  description: z.string().min(24, "Add a fuller description for faster routing."),
  formattedAddress: z.string().trim().optional(),
  placeId: z.string().trim().optional(),
  lat: z.number().finite().optional(),
  lng: z.number().finite().optional(),
  timezoneId: z.string().trim().optional(),
  nearbyLandmark: z.string().trim().optional(),
});

export const evidenceMetadataSchema = z.object({
  files: z.array(
    z.object({
      id: z.string().min(2),
      gridFsFileId: z.string().min(2).optional(),
      name: z.string().min(1),
      kind: evidenceKindSchema,
      size: z.number().nonnegative(),
      downloadUrl: z.string().min(1).optional(),
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

export const assistantMessageSchema = z.object({
  body: z.string().trim().min(4, "Ask a more specific question so the assistant can help."),
  caseId: z.string().trim().optional(),
});

export const fileReviewSchema = z.object({
  fileId: z.string().min(2, "A valid file is required."),
  status: fileReviewStatusSchema,
  note: z.string().trim().max(2000).optional(),
}).superRefine((value, context) => {
  if (
    ["needs_replacement", "rejected"].includes(value.status) &&
    (!value.note || value.note.trim().length < 12)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Add a short review note so the citizen understands the file issue.",
      path: ["note"],
    });
  }
});
