import { addDays, subDays } from "date-fns";

import type {
  AppSession,
  CaseItem,
  DashboardStat,
  NotificationItem,
} from "@/lib/types";

const today = new Date("2026-04-18T10:00:00.000Z");

export const demoUsers: Record<string, AppSession> = {
  "citizen-001": {
    uid: "citizen-001",
    email: "citizen@demo.mygov.my",
    name: "Aisyah Rahman",
    role: "citizen",
  },
  "admin-001": {
    uid: "admin-001",
    email: "admin@demo.mygov.my",
    name: "Farid Hakim",
    role: "admin",
  },
};

export const demoNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Document follow-up required",
    body: "Add a drainage photo to keep your complaint in the fast-track queue.",
    createdAt: subDays(today, 1).toISOString(),
    read: false,
    tone: "warning",
  },
  {
    id: "notif-2",
    title: "Renewal reminder",
    body: "Your road tax reminder is ready for one-tap renewal.",
    createdAt: subDays(today, 3).toISOString(),
    read: true,
    tone: "info",
  },
];

export const demoCases: CaseItem[] = [
  {
    id: "case-1001",
    reference: "MYGOV-2026-1001",
    title: "Section 17 street repair and lighting complaint",
    type: "public_complaint",
    status: "need_more_docs",
    location: "Jalan 17/22, Petaling Jaya, Selangor",
    createdAt: subDays(today, 2).toISOString(),
    updatedAt: subDays(today, 1).toISOString(),
    summary:
      "Pothole cluster and intermittent streetlamp outage reported near a school crossing. Additional angle requested for dispatch confidence.",
    citizenId: "citizen-001",
    citizenName: "Aisyah Rahman",
    assignedUnit: "PJ Municipal Coordination Desk",
    progress: 52,
    reminders: [
      "Upload one daylight photo showing road depth.",
      "Confirm whether the lamp issue affects one or both poles.",
    ],
    evidence: [
      {
        id: "ev-1",
        name: "street-pothole-1.jpg",
        kind: "photo",
        sizeLabel: "2.3 MB",
        uploadedAt: subDays(today, 2).toISOString(),
        status: "uploaded",
      },
      {
        id: "ev-2",
        name: "voice-note.m4a",
        kind: "voice_note",
        sizeLabel: "940 KB",
        uploadedAt: subDays(today, 2).toISOString(),
        status: "processing",
      },
    ],
    timeline: [
      {
        id: "tl-1",
        type: "status",
        title: "Case submitted",
        description:
          "Citizen intake normalized into a unified infrastructure complaint packet.",
        createdAt: subDays(today, 2).toISOString(),
        actor: "MyGOV Agent",
      },
      {
        id: "tl-2",
        type: "routing",
        title: "Routed for triage",
        description:
          "Routing suggestion sent to local works and lighting coordination desks.",
        createdAt: subDays(today, 2).toISOString(),
        actor: "MyGOV Agent",
      },
      {
        id: "tl-3",
        type: "note",
        title: "More evidence requested",
        description:
          "Admin requested one wider drainage photo to speed up onsite validation.",
        createdAt: subDays(today, 1).toISOString(),
        actor: "Farid Hakim",
      },
    ],
    intake: {
      citizenSummary:
        "You reported several potholes and a broken streetlamp near Section 17. One more photo will help route the repair crew faster.",
      adminSummary:
        "Infrastructure complaint with strong location confidence. Existing media is adequate for triage but not optimal for repair severity scoring.",
      category: "Infrastructure and public safety",
      urgency: "medium",
      missingDocuments: ["Wide-angle road photo"],
      structuredIntake: {
        locale: "en-MY",
        categories: ["roads", "street_lighting"],
        channels: ["voice", "photo"],
        geocodeConfidence: "0.94",
      },
    },
  },
  {
    id: "case-1002",
    reference: "MYGOV-2026-1002",
    title: "Flood relief household assistance",
    type: "flood_relief",
    status: "reviewing",
    location: "Taman Sri Muda, Shah Alam, Selangor",
    createdAt: subDays(today, 4).toISOString(),
    updatedAt: subDays(today, 1).toISOString(),
    summary:
      "Residential flood damage claim with MyKad, property photos, and bank account document attached for verification.",
    citizenId: "citizen-001",
    citizenName: "Aisyah Rahman",
    assignedUnit: "State Welfare and Relief Desk",
    progress: 68,
    reminders: ["Keep phone line available for a verification call."],
    evidence: [
      {
        id: "ev-3",
        name: "living-room-flood.jpg",
        kind: "photo",
        sizeLabel: "4.6 MB",
        uploadedAt: subDays(today, 4).toISOString(),
        status: "uploaded",
      },
      {
        id: "ev-4",
        name: "mykad.pdf",
        kind: "document",
        sizeLabel: "1.2 MB",
        uploadedAt: subDays(today, 4).toISOString(),
        status: "uploaded",
      },
    ],
    timeline: [
      {
        id: "tl-4",
        type: "status",
        title: "Submitted with verified identity",
        description:
          "Identity details matched existing citizen records and bank details were normalized.",
        createdAt: subDays(today, 4).toISOString(),
        actor: "MyGOV Agent",
      },
      {
        id: "tl-5",
        type: "status",
        title: "In review",
        description:
          "Household eligibility packet sent to welfare officer for final validation.",
        createdAt: subDays(today, 3).toISOString(),
        actor: "Farid Hakim",
      },
    ],
    intake: {
      citizenSummary:
        "Your flood relief request has passed identity checks and is now being reviewed for household assistance eligibility.",
      adminSummary:
        "High-confidence flood damage claim with complete core documentation. Suitable for expedited household assessment.",
      category: "Relief assistance",
      urgency: "high",
      missingDocuments: [],
      structuredIntake: {
        locale: "ms-MY",
        categories: ["flood_relief", "damage_assessment"],
        channels: ["voice", "photo", "document"],
        geocodeConfidence: "0.98",
      },
    },
  },
  {
    id: "case-1003",
    reference: "MYGOV-2026-1003",
    title: "Road tax reminder and renewal assistance",
    type: "reminder_renewal",
    status: "submitted",
    location: "Petaling Jaya, Selangor",
    createdAt: subDays(today, 1).toISOString(),
    updatedAt: subDays(today, 1).toISOString(),
    summary:
      "Citizen started a proactive renewal intake from a system reminder but has not uploaded the latest insurance proof yet.",
    citizenId: "citizen-001",
    citizenName: "Aisyah Rahman",
    assignedUnit: "Transport Renewal Service",
    progress: 24,
    reminders: ["Upload current insurance cover note."],
    evidence: [],
    timeline: [
      {
        id: "tl-6",
        type: "status",
        title: "Reminder created",
        description:
          "Guardian reminder generated from upcoming renewal date.",
        createdAt: subDays(today, 1).toISOString(),
        actor: "MyGOV Agent",
      },
    ],
    intake: {
      citizenSummary:
        "Your renewal draft is saved. Add insurance proof when ready to continue.",
      adminSummary:
        "Low-risk reminder workflow. Awaiting required insurance proof before further processing.",
      category: "Renewal and reminders",
      urgency: "low",
      missingDocuments: ["Insurance cover note"],
      structuredIntake: {
        locale: "en-MY",
        categories: ["vehicle_renewal"],
        channels: ["system_reminder"],
        geocodeConfidence: "1.00",
      },
    },
  },
];

export function getCitizenCases(citizenId: string) {
  return demoCases.filter((item) => item.citizenId === citizenId);
}

export function getCitizenCase(caseId: string, citizenId: string) {
  return demoCases.find(
    (item) => item.id === caseId && item.citizenId === citizenId
  );
}

export function getCaseById(caseId: string) {
  return demoCases.find((item) => item.id === caseId);
}

export function getCitizenStats(citizenId: string): DashboardStat[] {
  const cases = getCitizenCases(citizenId);

  return [
    {
      label: "Open cases",
      value: String(cases.filter((item) => item.status !== "resolved").length),
      change: "+2 this week",
    },
    {
      label: "Awaiting action",
      value: String(
        cases.filter((item) => item.status === "need_more_docs").length
      ),
      change: "1 follow-up needed",
    },
    {
      label: "Resolved in 30 days",
      value: "11",
      change: "89% within SLA",
    },
  ];
}

export function getAdminStats(): DashboardStat[] {
  return [
    { label: "Queue today", value: "28", change: "-6 vs yesterday" },
    { label: "Priority cases", value: "4", change: "2 high urgency" },
    { label: "Avg. review time", value: "11m", change: "-18% this week" },
  ];
}

export function getAdminQueue() {
  return demoCases.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getUpcomingReminders() {
  return [
    {
      id: "reminder-1",
      title: "Insurance proof upload",
      dueLabel: "Due today",
      description:
        "Finish your road tax renewal intake to avoid interruption.",
    },
    {
      id: "reminder-2",
      title: "Flood relief verification call",
      dueLabel: `By ${addDays(today, 1).toISOString().slice(0, 10)}`,
      description:
        "A welfare officer may call to confirm household occupancy.",
    },
  ];
}
