import React from "react";
import Link from "next/link";
import { InformationIcon, VercelIcon } from "./icons";

const ProjectOverview = () => {
  return (
    <div className="rounded-lg border p-6 text-sm text-neutral-500 bg-orange-200 dark:text-neutral-400 dark:border-neutral-700 dark:bg-orange-800">
      <div className="flex justify-center gap-4 mb-4 text-neutral-900 dark:text-neutral-50">
        <VercelIcon size={16} />
        <span>+</span>
        <InformationIcon />
      </div>
      <p className="text-center">
        The{" "}
        <Link href="https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat" className="text-blue-500">
          useChat
        </Link>{" "}
        hook along with the{" "}
        <Link href="https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-text" className="text-blue-500">
          streamText
        </Link>{" "}
        function allows you to build applications with retrieval augmented
        generation (RAG) capabilities. Data is stored as vector embeddings
        using DrizzleORM and PostgreSQL.
      </p>
    </div>
  );
};

export default ProjectOverview;
