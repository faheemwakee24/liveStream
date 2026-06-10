import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Video, Lock, Share2, MessageSquare, MonitorUp, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateRoomId } from "@/lib/room-id";

const HeroScene = lazy(() => import("@/components/three/HeroScene"));
const AmbientBackground = lazy(() => import("@/components/three/AmbientBackground"));

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
    <div className="relative min-h-screen overflow-hidden radial-bg">
      <Suspense fallback={null}>
        <AmbientBackground />
      </Suspense>

      {/* Aurora glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-violet/30 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-[400px] w-[600px] rounded-full bg-cyan/20 blur-[120px]" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-lg shadow-violet/40">
            <Video className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">Loop</span>
        </motion.div>
        <nav className="hidden gap-8 text-sm text-muted-foreground sm:flex">
          <a href="#features" className="story-link hover:text-foreground">Features</a>
          <a href="#how" className="story-link hover:text-foreground">How it works</a>
        </nav>
        <Button onClick={createRoom} className="bg-gradient-brand text-primary-foreground shadow-lg shadow-violet/30 hover:opacity-90">
          Start a call
        </Button>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-12 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
              </span>
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
                className="group h-14 rounded-full bg-gradient-brand px-8 text-base font-semibold text-primary-foreground shadow-xl shadow-violet/40 transition-transform hover:scale-[1.02] hover:opacity-95"
              >
                Create a room
                <ArrowRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>

              <form onSubmit={joinRoom} className="flex h-14 items-center gap-1 rounded-full border border-border bg-surface/60 pl-5 pr-1 backdrop-blur transition-colors focus-within:border-violet">
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
          </motion.div>

          {/* 3D Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
            className="relative aspect-square w-full"
          >
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-brand opacity-25 blur-3xl" />
            <div className="glass relative h-full w-full overflow-hidden rounded-[2.5rem]">
              <Suspense
                fallback={
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-32 w-32 animate-pulse rounded-full bg-gradient-brand opacity-50 blur-2xl" />
                  </div>
                }
              >
                <HeroScene />
              </Suspense>
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-border bg-surface/70 px-4 py-2.5 backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-xs">Live · peer connected</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">00:12</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl font-semibold sm:text-4xl"
        >
          Everything a call needs.<br />
          <span className="text-muted-foreground">Nothing it doesn't.</span>
        </motion.h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="glass group relative overflow-hidden rounded-2xl p-6 transition-shadow hover:shadow-2xl hover:shadow-violet/20"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet/0 via-transparent to-cyan/0 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand shadow-lg shadow-violet/30">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Three steps. That's it.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative rounded-2xl border border-border bg-surface/40 p-6 backdrop-blur"
            >
              <span className="absolute -top-4 left-6 rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg shadow-violet/30">
                Step {i + 1}
              </span>
              <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mt-16 flex flex-col items-center gap-4 overflow-hidden rounded-3xl bg-gradient-brand p-10 text-center text-primary-foreground shadow-2xl shadow-violet/40"
        >
          <div className="pointer-events-none absolute -top-20 left-1/2 h-60 w-[140%] -translate-x-1/2 rounded-full bg-white/20 blur-3xl" />
          <h3 className="relative font-display text-3xl font-bold">Ready when you are.</h3>
          <p className="relative max-w-md opacity-90">Create your first room — it takes less than a second.</p>
          <Button
            onClick={createRoom}
            size="lg"
            className="relative h-12 rounded-full bg-background px-8 text-foreground hover:bg-background/90"
          >
            Start a call
          </Button>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-border py-8 text-center text-xs text-muted-foreground">
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
