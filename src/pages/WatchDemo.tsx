import { Sparkles, Play } from "lucide-react";
import { Eyebrow } from "@/components/atlas/Bits";

export default function WatchDemo() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-deep text-paper relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="container-atlas relative py-14 md:py-18">
          <Eyebrow dark>
            <Sparkles className="h-3 w-3" /> Watch Momo Autopilot
          </Eyebrow>
          <h1 className="mt-4 font-display text-4xl md:text-5xl text-paper leading-[1.05] max-w-3xl text-balance">
            From a Companies House number to a bound quote - in seconds.
          </h1>
          <p className="mt-4 text-paper/65 max-w-2xl">
            Watch the recording below to see Momo Autopilot in action.
          </p>
        </div>
      </section>

      {/* Recorded walkthrough */}
      <section className="bg-navy-deep pb-16">
        <div className="container-atlas">
          <div className="rounded-2xl overflow-hidden border border-paper/10 shadow-elev bg-black">
            <video
              src="/momo-demo.mp4"
              controls
              autoPlay
              muted
              playsInline
              preload="metadata"
              className="w-full aspect-video bg-black"
            >
              Your browser can't play this video.
            </video>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-paper/55">
            <Play className="h-3 w-3" /> Recorded walkthrough
          </div>
        </div>
      </section>
    </>
  );
}
