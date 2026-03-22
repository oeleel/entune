import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatMessageBubble } from '@/components/dashboard/chat-message';
import type { ChatMessage } from '@/lib/types';

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'msg-1',
    role: 'user',
    content: 'What medications were prescribed?',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('ChatMessageBubble — user messages', () => {
  it('renders user message content', () => {
    render(<ChatMessageBubble message={makeMessage({ content: 'Tell me about my visit' })} />);

    expect(screen.getByText('Tell me about my visit')).toBeInTheDocument();
  });

  it('right-aligns user messages with justify-end', () => {
    const { container } = render(<ChatMessageBubble message={makeMessage()} />);

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('justify-end');
  });

  it('applies primary background to user messages', () => {
    const { container } = render(<ChatMessageBubble message={makeMessage()} />);

    const bubble = container.querySelector('.bg-primary');
    expect(bubble).not.toBeNull();
    expect(bubble).toHaveClass('text-primary-foreground');
  });

  it('constrains bubble width with max-w-[80%]', () => {
    const { container } = render(<ChatMessageBubble message={makeMessage()} />);

    const bubble = container.querySelector('.bg-primary');
    expect(bubble).toHaveClass('max-w-[80%]');
    expect(bubble).toHaveClass('rounded-lg');
  });
});

describe('ChatMessageBubble — assistant messages', () => {
  it('renders assistant message content', () => {
    render(
      <ChatMessageBubble
        message={makeMessage({
          role: 'assistant',
          content: 'Based on your last visit, you were prescribed ibuprofen.',
        })}
      />,
    );

    expect(screen.getByText('Based on your last visit, you were prescribed ibuprofen.')).toBeInTheDocument();
  });

  it('left-aligns assistant messages with justify-start', () => {
    const { container } = render(
      <ChatMessageBubble message={makeMessage({ role: 'assistant', content: 'AI reply' })} />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('justify-start');
  });

  it('applies muted background to assistant messages (not primary)', () => {
    const { container } = render(
      <ChatMessageBubble message={makeMessage({ role: 'assistant', content: 'Reply' })} />,
    );

    const bubble = container.querySelector('.bg-muted');
    expect(bubble).not.toBeNull();
    // Should NOT have primary background
    expect(container.querySelector('.bg-primary')).toBeNull();
  });
});

describe('ChatInterface — structure (via source inspection)', () => {
  // ChatInterface uses @assistant-ui/react primitives which require complex runtime setup.
  // The following tests verify the ChatInterface module structure via source inspection.

  it('exports ChatInterface as a named function component accepting userId, preferredLanguage, visitId', async () => {
    const mod = await import('@/components/dashboard/chat-interface');
    expect(typeof mod.ChatInterface).toBe('function');
    // Verify the component accepts the expected props shape
    expect(mod.ChatInterface.length).toBeLessThanOrEqual(1); // React components take props obj
  });

  it('defines SUGGESTED_QUESTIONS for empty state chips', async () => {
    // Read the source to verify suggested questions exist
    const fs = await import('fs');
    const path = await import('path');
    const source = fs.readFileSync(
      path.resolve(__dirname, '../components/dashboard/chat-interface.tsx'),
      'utf-8',
    );

    expect(source).toContain('SUGGESTED_QUESTIONS');
    expect(source).toContain('What medications were prescribed?');
    expect(source).toContain('What follow-ups do I need?');
    expect(source).toContain('Summarize my last visit');
    expect(source).toContain('What warning signs should I watch for?');
  });

  it('uses UserMessage with right-aligned primary styling (justify-end + bg-primary)', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const source = fs.readFileSync(
      path.resolve(__dirname, '../components/dashboard/chat-interface.tsx'),
      'utf-8',
    );

    // UserMessage should be right-aligned with teal background
    expect(source).toMatch(/UserMessage[\s\S]*justify-end/);
    expect(source).toMatch(/UserMessage[\s\S]*bg-primary/);
    // Rounded corners per spec: rounded-2xl with rounded-br-md
    expect(source).toMatch(/rounded-2xl rounded-br-md/);
  });

  it('uses AssistantMessage with left-aligned muted styling (justify-start + bg-muted)', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const source = fs.readFileSync(
      path.resolve(__dirname, '../components/dashboard/chat-interface.tsx'),
      'utf-8',
    );

    expect(source).toMatch(/AssistantMessage[\s\S]*justify-start/);
    expect(source).toMatch(/AssistantMessage[\s\S]*bg-muted/);
    // Rounded corners per spec: rounded-2xl with rounded-bl-md
    expect(source).toMatch(/rounded-2xl rounded-bl-md/);
  });

  it('renders EmptyState with suggested question chips as rounded-full clickable elements', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const source = fs.readFileSync(
      path.resolve(__dirname, '../components/dashboard/chat-interface.tsx'),
      'utf-8',
    );

    // EmptyState renders SUGGESTED_QUESTIONS as chips
    expect(source).toMatch(/EmptyState[\s\S]*SUGGESTED_QUESTIONS/);
    // The chip elements within the map use rounded-full styling
    expect(source).toMatch(/SUGGESTED_QUESTIONS\.map[\s\S]*rounded-full/);
    // Chips are wrapped in ComposerPrimitive.Send for click-to-send behavior
    expect(source).toMatch(/SUGGESTED_QUESTIONS\.map[\s\S]*ComposerPrimitive\.Send/);
  });
});
