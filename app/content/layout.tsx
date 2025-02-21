import type { Metadata } from "next";
import BaseLayout from "../components/layout/BaseLayout";

export const metadata: Metadata = {
  title: 'Content Management',
  description: 'Upload and manage content for RAG',
};

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BaseLayout>
      {children}
    </BaseLayout>
  );
}
