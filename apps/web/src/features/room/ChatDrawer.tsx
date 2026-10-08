'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRoom } from './RoomProvider';

/** Chat as a right-side drawer. Press Enter (when not typing) to open; Escape to
 * close. Plain message list; sends typing indicators. Controlled by the parent
 * so cinema mode can tell whether it is open. */
export function ChatDrawer({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const { messages, sendChat, sendTyping } = useRoom();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef(0);

  const onType = (value: string) => {
    setText(value);
    sendTyping(true);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => sendTyping(false), 1200);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (e.key === 'Enter' && !open && !typing) setOpen(true);
      else if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    sendChat(t);
    setText('');
    sendTyping(false);
  }

  return (
    <>
      <button
        type="button"
        data-testid="chat-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="pointer-events-auto fixed bottom-[88px] left-1/2 z-30 -translate-x-1/2 rounded-pill border border-white/15 bg-white/[0.04] px-base py-xs font-sans text-button text-on-dark transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        {open ? 'Close chat' : 'Chat (Enter)'}
      </button>

      <aside
        data-testid="chat-drawer"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-40 flex h-[100dvh] w-[min(380px,90vw)] flex-col border-l border-white/10 bg-surface-dark-elevated transition-transform duration-300 will-change-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-base">
          <h2 className="font-display text-display-sm text-on-dark">Chat</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="rounded-full px-sm py-[2px] text-on-dark-soft transition hover:text-on-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div
          ref={listRef}
          data-testid="chat-messages"
          className="flex min-h-0 flex-1 flex-col gap-sm overflow-y-auto overscroll-contain px-base"
        >
          {messages.length === 0 ? (
            <p className="font-sans text-body-sm text-on-dark-soft">No messages yet. Say hello.</p>
          ) : (
            messages.map((m, i) => (
              <p key={`${m.at}-${i}`} className="break-words font-sans text-body-sm text-on-dark">
                <span className="text-on-dark-soft">{m.name}: </span>
                {m.text}
              </p>
            ))
          )}
        </div>
        <form onSubmit={submit} className="flex gap-xs p-base">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => onType(e.target.value)}
            data-testid="chat-input"
            aria-label="Message"
            autoComplete="off"
            placeholder="Message…"
            className="min-w-0 flex-1 rounded-md border border-white/15 bg-black/30 px-sm py-xs font-sans text-body-sm text-on-dark placeholder:text-on-dark-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          />
          <button
            type="submit"
            className="rounded-pill bg-on-primary px-base py-xs font-sans text-button text-ink transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Send
          </button>
        </form>
      </aside>
    </>
  );
}
