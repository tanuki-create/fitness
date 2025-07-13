"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SendHorizonal, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export function AiChat({ messages, onSendMessage, isLoading }: AiChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setInput('');
    await onSendMessage(input);
  };

  return (
    <Card className="flex flex-col h-[70vh]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot /> AIフィットネスコーチ
        </CardTitle>
        <CardDescription>
          あなたの全データを元にAIが応答します。何でも聞いてみてください。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="bg-primary rounded-full p-2 text-primary-foreground">
                  <Bot size={20} />
                </div>
              )}
              <div
                className={cn(
                  'max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-3 text-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
               {message.role === 'user' && (
                <div className="bg-muted rounded-full p-2 text-foreground">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
           {isLoading && (
            <div className="flex items-center gap-3 justify-start">
               <div className="bg-primary rounded-full p-2 text-primary-foreground">
                  <Bot size={20} />
                </div>
              <div className="bg-muted rounded-xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="AIコーチにメッセージを送信..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <SendHorizonal size={16} />
          </Button>
        </form>
      </div>
    </Card>
  );
} 