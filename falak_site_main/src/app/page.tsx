import Hero from "@/components/Hero";
import Head from "next/head";
import Artist from "@/components/Artist";
import Timeline from "@/components/Timeline";
import Trailer from "@/components/Trailer";
import Footer from "@/components/Footer";
import { Orbitron } from "next/font/google";
import About from "@/components/About";
import Sponsor from "@/components/Sponsor";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export default function Home() {
  return (
    <div className={orbitron.className}>
      <Head>
        <link
          rel="preload"
          as="video"
          href="/videos/nbg.mp4"
          type="video/mp4"
          crossOrigin="anonymous"
        />
      </Head>

      {/* Background Layers */}
      {/* Base background color */}
      <div
        className="fixed top-0 left-0 w-full h-full z-[-3]"
        style={{ backgroundColor: "#32212C" }}
      />

      {/* SVG background */}
      <div
        className="fixed top-0 left-0 w-full h-full z-[-2] bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/bg.svg')" }}
      />

      {/* Black overlay */}
      <div className="fixed top-0 left-0 w-full h-full bg-black/30 z-[-1]" />

      {/* Grain Overlay (optional) */}
      {/* <div className="grain-overlay"></div> */}

      

      {/* Page content */}
      <div className="relative z-10">
        <Hero />
        <About />
        <Artist />
        <Timeline />
        <Trailer />
        <Sponsor />
        <Footer />
      </div>
    </div>
  );
}
