import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Video, Lock, Share2, MessageSquare, MonitorUp, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateRoomId } from "@/lib/room-id";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Loop — Instant peer-to-peer video calls" },
      { name: "description", content: "Free, encrypted 1-on-1 video calls in your browser. No downloads, no accounts — just share a link." },
      { property: "og:title", content: "Loop — Instant peer-to-peer video calls" },
      { property: "og:description", content: "Spin up a private video room in one click. Built on WebRTC." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const createRoom = () => {
    const id = generateRoomId();
    navigate({ to: "/room/$roomId", params: { roomId: id } });
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toLowerCase().replace(/\s+/g, "");
    if (!trimmed) return;
    navigate({ to: "/room/$roomId", params: { roomId: trimmed } });
  };

  return (
    <div className="min-h-screen radial-bg">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand">
            <Video className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">Loop</span>
        </div>
        <nav className="hidden gap-8 text-sm text-muted-foreground sm:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
        </nav>
        <Button onClick={createRoom} className="bg-gradient-brand text-primary-foreground hover:opacity-90">
          Start a call
        </Button>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-cyan" />
              Powered by WebRTC · end-to-end peer connection
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Talk face to face.<br />
              <span className="text-gradient-brand">No friction.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Loop spins up a private, encrypted video room in your browser. No accounts, no downloads — just share a link and connect.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={createRoom}
                size="lg"
                className="h-14 rounded-full bg-gradient-brand px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-violet/30 hover:opacity-90"
              >
                Create a room
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>

              <form onSubmit={joinRoom} className="flex h-14 items-center gap-1 rounded-full border border-border bg-surface/60 pl-5 pr-1 backdrop-blur">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter room code"
                  className="w-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <Button type="submit" variant="ghost" className="h-12 rounded-full px-4 hover:bg-surface-2">
                  Join
                </Button>
              </form>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Free forever · Works on any modern browser
            </p>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-brand opacity-20 blur-3xl" />
            <div className="glass relative overflow-hidden rounded-3xl p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-violet/40 to-violet/10" />
                <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-cyan/40 to-cyan/10" />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-sm">Connected · 00:12</span>
                </div>
                <div className="flex gap-2">
                  <span className="h-8 w-8 rounded-full bg-surface" />
                  <span className="h-8 w-8 rounded-full bg-surface" />
                  <span className="h-8 w-8 rounded-full bg-destructive" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">
          Everything a call needs.<br />
          <span className="text-muted-foreground">Nothing it doesn't.</span>
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Three steps. That's it.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-border p-6">
              <span className="absolute -top-4 left-6 rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-primary-foreground">
                Step {i + 1}
              </span>
              <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 rounded-3xl bg-gradient-brand p-10 text-center text-primary-foreground">
          <h3 className="font-display text-3xl font-bold">Ready when you are.</h3>
          <p className="max-w-md opacity-90">Create your first room — it takes less than a second.</p>
          <Button
            onClick={createRoom}
            size="lg"
            className="h-12 rounded-full bg-background px-8 text-foreground hover:bg-background/90"
          >
            Start a call
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Built with WebRTC · {new Date().getFullYear()} Loop
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: Lock, title: "End-to-end encrypted", desc: "Media flows peer-to-peer over DTLS-SRTP. Nothing touches our servers." },
  { icon: Share2, title: "Shareable links", desc: "Every room is a URL. Send it anywhere — SMS, email, chat." },
  { icon: MessageSquare, title: "In-call chat", desc: "Drop links and notes without breaking the conversation." },
  { icon: MonitorUp, title: "Screen sharing", desc: "Share your whole screen, a window, or just a tab in one click." },
  { icon: Video, title: "HD video", desc: "Adaptive bitrate keeps your call sharp, even on flaky Wi-Fi." },
  { icon: Sparkles, title: "Zero install", desc: "Runs in any modern browser on desktop or mobile. No app required." },
];

const STEPS = [
  { title: "Create a room", desc: "Click the button and we'll generate a private room link for you." },
  { title: "Share the link", desc: "Send it to one person. The link is the invite." },
  { title: "Start talking", desc: "When they open it, your browsers connect peer-to-peer. That's it." },
];
