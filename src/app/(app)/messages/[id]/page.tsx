'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Message {
  id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function ChatPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<{ name: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!userId || !conversationId) return;
    const res = await fetch(`/api/messages/${conversationId}`);
    if (!res.ok) {
      router.push('/messages');
      return;
    }
    const data = await res.json();
    setMessages(data.messages || []);
    setOther(data.other);
    setLoading(false);
    setTimeout(scrollToBottom, 100);
  }, [userId, conversationId, router, scrollToBottom]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Polling (replaces the old Realtime subscription): the data lives on a database the browser
  // no longer talks to directly. Paused while the tab is hidden. GET also marks messages as read.
  useEffect(() => {
    if (!conversationId || !userId) return;
    const timer = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/messages/${conversationId}`);
        if (!res.ok) return;
        const data = await res.json();
        const fresh: Message[] = data.messages || [];
        setMessages(prev => {
          const known = new Set(prev.map(m => m.id));
          const added = fresh.filter(m => !known.has(m.id));
          if (added.length === 0) return prev;
          // Keep optimistic temp messages; swap in server order for everything else.
          const temps = prev.filter(m => m.id.startsWith('temp-'));
          setTimeout(scrollToBottom, 50);
          return [...fresh, ...temps];
        });
      } catch {
        // transient network error — next tick retries
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [conversationId, userId, scrollToBottom]);

  // Send message
  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput('');

    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: userId!,
      content: text,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(scrollToBottom, 50);

    const res = await fetch(`/api/messages/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    });

    if (res.ok) {
      const real = await res.json();
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...real, read_at: null } : m));
    } else {
      // Remove optimistic on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(text);
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const dateKey = new Date(msg.created_at).toDateString();
    if (dateKey !== currentDate) {
      currentDate = dateKey;
      groupedMessages.push({ date: msg.created_at, msgs: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].msgs.push(msg);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-surface" />
          <div className="h-4 w-32 animate-pulse rounded bg-surface" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-12 w-48 animate-pulse rounded-2xl bg-surface ${i % 2 === 0 ? 'ml-auto' : ''}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-64px)] md:h-[calc(100dvh)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 shrink-0">
        <button
          onClick={() => router.push('/messages')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface transition md:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-xs font-bold text-white">
          {other ? getInitials(other.name) : '?'}
        </div>
        <div>
          <p className="text-sm font-bold text-text">{other?.name || 'Chargement...'}</p>
          <p className="text-[11px] text-muted">En ligne</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-surface/30">
        {groupedMessages.map((group, gi) => (
          <div key={gi}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-semibold text-muted">
                {formatDateSeparator(group.date)}
              </span>
            </div>
            {group.msgs.map((msg) => {
              const isMe = msg.sender_id === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      isMe
                        ? 'bg-brand-500 text-white rounded-br-md'
                        : 'bg-white border border-border text-text rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-muted'}`}>
                      {formatTime(msg.created_at)}
                      {isMe && msg.read_at && ' ✓✓'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
