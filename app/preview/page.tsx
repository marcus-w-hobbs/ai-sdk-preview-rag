"use client";

import { Input } from "@/components/ui/input";
import { Message } from "ai";
import { useChat } from "ai/react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown, { Options } from "react-markdown";
import React from "react";
import ProjectOverview from "@/components/project-overview";
import { LoadingIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      onError: (error) => {
        console.error('Chat Error:', error)
        toast.error("An error occurred. Please try again later!");
      },
    });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (messages.length > 0) setIsExpanded(true);
  }, [messages]);

  const awaitingResponse = useMemo(() => {
    return isLoading && messages.slice(-1)[0]?.role === "user";
  }, [isLoading, messages]);

  const userQuery: Message | undefined = messages
    .filter((m) => m.role === "user")
    .slice(-1)[0];

  const lastAssistantMessage: Message | undefined = messages
    .filter((m) => m.role !== "user")
    .slice(-1)[0];

  return (
    <div className="space-y-6">
      <ProjectOverview />
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
        <form onSubmit={handleSubmit}>
          <input
            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Ask me anything..."
            value={input}
            onChange={handleInputChange}
            minLength={3}
            required
          />
        </form>
        {(awaitingResponse || lastAssistantMessage) && (
          <div className="mt-4">
            <div className="text-sm text-gray-500 mb-2">
              {userQuery?.content}
            </div>
            {awaitingResponse ? (
              <Loading />
            ) : (
              <AssistantMessage message={lastAssistantMessage} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const AssistantMessage = ({ message }: { message: Message | undefined }) => {
  if (message === undefined) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="whitespace-pre-wrap font-mono text-sm text-gray-900 overflow-hidden"
        id="markdown"
      >
        <MemoizedReactMarkdown
          className="prose prose-sm max-w-none dark:prose-invert"
        >
          {message.content}
        </MemoizedReactMarkdown>
      </motion.div>
    </AnimatePresence>
  );
};

const Loading = () => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: "spring" }}
        className="overflow-hidden flex justify-start items-center"
      >
        <div className="flex flex-row gap-2 items-center">
          <div className="animate-spin text-gray-400">
            <LoadingIcon />
          </div>
          <div className="text-gray-500 text-sm">
            Thinking...
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const MemoizedReactMarkdown: React.FC<Options> = React.memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className,
); 