import React from "react";
import Link from "next/link";
import { InformationIcon, VercelIcon } from "./icons";

const ProjectOverview = () => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
      <div className="flex justify-center gap-4 mb-4 text-gray-900">
        <VercelIcon size={16} />
        <span>+</span>
        <InformationIcon />
      </div>
      <p className="text-center">
        The{" "}
        <Link href="https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat" className="text-blue-600 hover:text-blue-500">
          useChat
        </Link>{" "}
        hook along with the{" "}
        <Link href="https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-text" className="text-blue-600 hover:text-blue-500">
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
