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
import { Send, MessageCircle } from 'lucide-react';
import { chat } from '@/lib/api';
import type { ChatModelAdapter } from '@assistant-ui/react';
import type { SupportedLanguage } from '@/lib/types';

type ChatInterfaceProps = {
  userId: string;
  preferredLanguage: SupportedLanguage;
  visitId?: string;
};

const SUGGESTED_QUESTIONS = [
  'What medications were prescribed?',
  'What follow-ups do I need?',
  'Summarize my last visit',
  'What warning signs should I watch for?',
];

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
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto p-4 space-y-1">
            <ThreadPrimitive.Empty>
              <EmptyState />
            </ThreadPrimitive.Empty>

            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                AssistantMessage,
              }}
            />
          </ThreadPrimitive.Viewport>

          {/* Composer */}
          <div className="border-t p-3">
            <ComposerPrimitive.Root className="flex items-end gap-2">
              <ComposerPrimitive.Input
                placeholder="Ask about your visit history..."
                className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-[120px] resize-none"
              />
              <ComposerPrimitive.Send className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                <Send className="h-4 w-4" />
              </ComposerPrimitive.Send>
            </ComposerPrimitive.Root>
          </div>
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <MessageCircle className="h-6 w-6 text-primary" />
      </div>
      <p className="text-sm font-medium mb-1">Visit Assistant</p>
      <p className="text-xs text-muted-foreground mb-6">
        Ask me anything about your past visits
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <ComposerPrimitive.Root key={q}>
            <ComposerPrimitive.Send
              className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              data-value={q}
            >
              {q}
            </ComposerPrimitive.Send>
          </ComposerPrimitive.Root>
        ))}
      </div>
    </div>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end mb-3">
      <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 bg-primary text-primary-foreground text-sm leading-relaxed">
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
      <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2.5 bg-muted text-sm leading-relaxed">
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
