import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import type { ChatMessage } from "@/lib/webrtc/usePeerConnection";

interface Props {
  open: boolean;
  messages: ChatMessage[];
  onClose: () => void;
  onSend: (text: string) => void;
}

export function ChatPanel({ open, messages, onClose, onSend }: Props) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  return (
    <aside className="glass flex w-full max-w-sm flex-col rounded-2xl">
      <header className="flex items-center justify-between border-b border-border p-4">
        <h3 className="text-sm font-semibold">In-call chat</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Messages sent here stay between you and the other person.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.from === "me" ? "bg-gradient-brand text-primary-foreground" : "bg-surface-2 text-foreground"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full bg-surface-2 px-4 py-2 text-sm outline-none ring-ring focus:ring-2"
        />
        <button
          type="submit"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}
