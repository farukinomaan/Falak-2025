import Link from "next/link";
import Hero from "@/components/Hero";
import Head from "next/head";
import Artist from "@/components/Artist";
import Timeline from "@/components/Timeline";
import Trailer from "@/components/Trailer";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Head>
        {/* Home-only preload for first hero video */}
        <Head>
  <link
    rel="preload"
    as="video"
    href="/videos/newafter.mp4"
    type="video/mp4"
    crossOrigin="anonymous"
  />
</Head>

      </Head>
      <div className="home-page">
        <Hero />
        <Artist />
        <Timeline />
        <Trailer />
        <Footer />
        {/* <div className="max-w-4xl mx-auto p-8 space-y-6 text-white">
          <h1 className="text-4xl font-bold">Falak Cultural Fest</h1>
          <p className="text-white">Welcome! Explore events and get your passes.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link className="border rounded p-4" href="/passes">
              Passes
            </Link>
            <Link className="border rounded p-4" href="/cultural_events">
              Cultural Events
            </Link>
            <Link className="border rounded p-4" href="/sports_events">
              Sports Events
            </Link>
            <Link className="border rounded p-4" href="/tickets">
              Tickets
            </Link>
          </div>
        </div> */}
      </div>
    </>
  );
}
