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
    <>
      <div className="fixed top-0 left-0 w-screen h-16 test-banner flex items-center justify-center">
        TEST BANNER
      </div>
      <div className="min-h-screen bg-red-500 dark:bg-red-800 px-4 py-16">
        <div className="max-w-[500px] mx-auto space-y-4 bg-green-500">
          <ProjectOverview />
          <div className="rounded-lg bg-blue-500 dark:bg-blue-800 p-4">
            <form onSubmit={handleSubmit} className="bg-yellow-200">
              <input
                className="w-full h-10 rounded-md border border-input bg-purple-200 px-3 py-2 text-sm text-neutral-700 dark:bg-purple-800 dark:text-neutral-300 dark:placeholder:text-neutral-400"
                placeholder="Ask me anything..."
                value={input}
                onChange={handleInputChange}
                minLength={3}
                required
              />
            </form>
            {(awaitingResponse || lastAssistantMessage) && (
              <div className="mt-4">
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
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
      </div>
    </>
  );
}

const AssistantMessage = ({ message }: { message: Message | undefined }) => {
  if (message === undefined) return "HELLO";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="whitespace-pre-wrap font-mono anti text-sm text-neutral-800 dark:text-neutral-200 overflow-hidden"
        id="markdown"
      >
        <MemoizedReactMarkdown
          className={"max-h-72 overflow-y-scroll no-scrollbar-gutter"}
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
          <div className="animate-spin dark:text-neutral-400 text-neutral-500">
            <LoadingIcon />
          </div>
          <div className="text-neutral-500 dark:text-neutral-400 text-sm">
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