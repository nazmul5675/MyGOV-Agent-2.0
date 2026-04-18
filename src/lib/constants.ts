import type { CaseStatus, CaseType } from "@/lib/types";

export const APP_NAME = "MyGOV Agent 2.0";

export const protectedPrefixes = ["/dashboard", "/cases", "/admin"];

export const statusLabelMap: Record<CaseStatus, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  need_more_docs: "Need More Docs",
  routed: "Routed",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

export const caseTypeLabelMap: Record<CaseType, string> = {
  flood_relief: "Flood Relief",
  public_complaint: "Public Complaint",
  reminder_renewal: "Reminder / Renewal",
};

export const sessionCookieName =
  process.env.SESSION_COOKIE_NAME || "mygov_session";

export const demoCookieName =
  process.env.DEMO_SESSION_COOKIE_NAME || "mygov_demo_session";
