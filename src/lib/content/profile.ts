import {
  BadgeCheck,
  FileCheck2,
  MapPin,
  Phone,
  type LucideIcon,
} from "lucide-react";

export function getProfileCards(input: {
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  addressText?: string | null;
  documents: string[];
}): Array<{
  icon: LucideIcon;
  title: string;
  body: string;
  tone: string;
}> {
  return [
    {
      icon: BadgeCheck,
      title: "Identity details",
      body: input.dateOfBirth
        ? "Date of birth is saved, so your account is ready for age-sensitive guidance when needed."
        : "Add your date of birth when you can. It helps staff confirm the right service path without asking again later.",
      tone: input.dateOfBirth ? "bg-emerald-50/75" : "bg-amber-50/80",
    },
    {
      icon: Phone,
      title: "Contact info",
      body: input.phoneNumber
        ? "Phone number is on file for reminders or follow-up if your case needs clarification."
        : "A phone number is optional, but it can help if your case needs a quick follow-up.",
      tone: input.phoneNumber ? "bg-emerald-50/75" : "bg-muted/80",
    },
    {
      icon: MapPin,
      title: "Address note",
      body: input.addressText
        ? "Your saved location note gives your next case a clearer starting point."
        : "A location or address note can wait, but it helps staff route your next case faster.",
      tone: input.addressText ? "bg-emerald-50/75" : "bg-muted/80",
    },
    {
      icon: FileCheck2,
      title: "Supporting documents",
      body: input.documents.length
        ? `On file: ${input.documents.join(", ")}.`
        : "No supporting documents are stored on your profile yet. That is fine unless a future case asks for them.",
      tone: input.documents.length ? "bg-emerald-50/75" : "bg-muted/80",
    },
  ];
}
