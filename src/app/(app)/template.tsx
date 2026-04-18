import { PageMotion } from "@/components/common/page-motion";

export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageMotion>{children}</PageMotion>;
}
