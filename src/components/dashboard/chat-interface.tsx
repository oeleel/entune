'use client';

import {
  useLocalRuntime,
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from '@assistant-ui/react';
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import '@assistant-ui/react-markdown/styles/dot.css';
import { chat } from '@/lib/api';
import type { ChatModelAdapter } from '@assistant-ui/react';
import type { SupportedLanguage } from '@/lib/types';

type ChatInterfaceProps = {
  userId: string;
  preferredLanguage: SupportedLanguage;
  visitId?: string;
};

export function ChatInterface({ userId, preferredLanguage, visitId }: ChatInterfaceProps) {
  const adapter: ChatModelAdapter = {
    async run({ messages }) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      const text =
        lastUserMsg?.content
          ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join(' ') ?? '';

      const response = await chat({
        message: text,
        userId,
        preferredLanguage,
        visitId,
      });

      return {
        content: [{ type: 'text' as const, text: response.reply }],
      };
    },
  };

  const runtime = useLocalRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col h-full">
        <ThreadPrimitive.Root className="flex flex-col flex-1 min-h-0">
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto p-4">
            <ThreadPrimitive.Empty>
              <p className="text-center text-muted-foreground text-sm pt-4">
                Ask me anything about your past visits...
              </p>
            </ThreadPrimitive.Empty>

            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                AssistantMessage,
              }}
            />
          </ThreadPrimitive.Viewport>

          <div className="border-t p-3">
            <ComposerPrimitive.Root className="flex gap-2">
              <ComposerPrimitive.Input
                placeholder="Ask about your visit history..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <ComposerPrimitive.Send className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Send
              </ComposerPrimitive.Send>
            </ComposerPrimitive.Root>
          </div>
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end mb-3">
      <div className="max-w-[80%] rounded-lg px-3 py-2 bg-primary text-primary-foreground text-sm">
        <MessagePrimitive.Content
          components={{
            Text: ({ text }) => <span>{text}</span>,
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-start mb-3">
      <div className="max-w-[80%] rounded-lg px-3 py-2 bg-muted text-sm">
        <MessagePrimitive.Content
          components={{
            Text: MarkdownText,
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

function MarkdownText() {
  return <MarkdownTextPrimitive className="aui-md" />;
}
