'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquareText, Sparkles } from 'lucide-react';
import { askHermesX } from '@/services/api/ask.api';
import { ApiClientError } from '@/services/api/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SentimentBadge } from '@/components/ui/SentimentBadge';
import { formatDate, channelLabel } from '@/lib/utils';
import type { AskHermesxResponseDto } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  question?: string;
  response?: AskHermesxResponseDto;
  error?: string;
}

const SUGGESTED_QUESTIONS = [
  'What are customers saying about the latest update?',
  'Summarize feedback from the last week',
  'What are the top feature requests?',
];

const CONFIDENCE_TONE = {
  HIGH: 'positive',
  MEDIUM: 'neutral',
  LOW: 'default',
} as const;

export default function AskHermesxPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submitQuestion = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMessageId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: userMessageId, role: 'user', question }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askHermesX(question);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', response }]);
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : 'Something went wrong. Please try again.';
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', error: message }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-text-primary">Ask HermesX</h1>
        <p className="mt-1 text-sm text-text-secondary">Get instant answers from your customer feedback.</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <MessageSquareText className="h-6 w-6" />
            </div>
            <p className="mb-6 text-sm text-text-secondary">Ask a question about your customer feedback to get started.</p>
            <div className="flex flex-col gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => submitQuestion(q)}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm text-text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            {message.role === 'user' ? (
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-white">
                {message.question}
              </div>
            ) : message.error ? (
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-negative/30 bg-negative/5 px-4 py-2.5 text-sm text-negative">
                {message.error}
              </div>
            ) : message.response ? (
              <div className="max-w-[85%] space-y-3 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <p className="text-sm text-text-primary">{message.response.answer}</p>
                </div>

                <Badge tone={CONFIDENCE_TONE[message.response.confidence]}>
                  {message.response.confidence} confidence
                </Badge>

                {message.response.sources.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <p className="text-xs font-medium text-text-muted">Evidence</p>
                    {message.response.sources.map((source) => {
                      const isCited = message.response!.citedFeedbackIds.includes(source.feedbackId);
                      return (
                        <div
                          key={source.feedbackId}
                          className={`rounded-lg border p-2.5 text-xs ${
                            isCited ? 'border-primary/40 bg-primary-soft' : 'border-border'
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2 text-text-muted">
                            <SentimentBadge sentiment={source.sentiment as never} />
                            <span>{channelLabel(source.channel)}</span>
                            <span>·</span>
                            <span>{formatDate(source.createdAt)}</span>
                          </div>
                          <p className="text-text-secondary">{source.content}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-muted" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-muted [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-muted [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitQuestion(input);
        }}
        className="flex items-center gap-2 border-t border-border pt-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your customer feedback..."
          className="h-11 flex-1 rounded-full border border-border bg-input px-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-ring"
        />
        <Button type="submit" variant="primary" size="md" disabled={!input.trim() || isLoading} className="rounded-full px-4">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
