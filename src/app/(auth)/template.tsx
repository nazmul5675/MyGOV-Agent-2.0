import { PageMotion } from "@/components/common/page-motion";

export default function AuthTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageMotion>{children}</PageMotion>;
}
