"use client";

import { useState, useRef, MouseEvent, ReactNode } from "react";
import { TiLocationArrow } from "react-icons/ti";
import { passes } from "@/lib/mock_data/passes";
import BuyNowButton from "@/components/BuyNowButton";


// -----------------------------
// BentoTilt Component
// -----------------------------
interface BentoTiltProps {
  children: ReactNode;
  className?: string;
}

export const BentoTilt: React.FC<BentoTiltProps> = ({ children, className = "" }) => {
  const [transformStyle, setTransformStyle] = useState<string>("");
  const itemRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!itemRef.current) return;

    const { left, top, width, height } = itemRef.current.getBoundingClientRect();
    const relativeX = (event.clientX - left) / width;
    const relativeY = (event.clientY - top) / height;

    const tiltX = (relativeY - 0.5) * 5;
    const tiltY = (relativeX - 0.5) * -5;

    setTransformStyle(
      `perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(.95, .95, .95)`
    );
  };

  const handleMouseLeave = () => {
    setTransformStyle("");
  };

  return (
    <div
      ref={itemRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: transformStyle }}
    >
      {children}
    </div>
  );
};

// -----------------------------
// BentoCard Component
// -----------------------------
interface BentoCardProps {
  src: string;
  title: ReactNode;
  description?: string;
  price: string;
  perks?: string[];
}

export const BentoCard: React.FC<BentoCardProps> = ({ src, title, description, price, perks }) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [hoverOpacity, setHoverOpacity] = useState(0);
  const hoverButtonRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!hoverButtonRef.current) return;

    const rect = hoverButtonRef.current.getBoundingClientRect();

    setCursorPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setHoverOpacity(1);
  const handleMouseLeave = () => setHoverOpacity(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <div
      className="relative size-full"
      onMouseEnter={() => videoRef.current?.play()}
      onMouseLeave={() => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
    >
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        className="absolute left-0 top-0 size-full object-cover object-center"
      />
      <div className="relative z-10 flex size-full flex-col justify-between p-5 text-blue-50">
        <div>
          <h1 className="bento-title special-font">{title}</h1>
          {description && (
            <p className="mt-3 max-w-64 text-xs md:text-base">{description}</p>
          )}
          <p className="mt-2 font-bold">{price}</p>
          {perks && perks.length > 0 && (
    <ul className="list-disc ml-5 text-sm mt-2">
      {perks.map((perk) => (
        <li key={perk}>{perk}</li>
      ))}
    </ul>
  )}
        <BuyNowButton />      
        </div>
      </div>
    </div>
  );
};

// -----------------------------
// Features Section
// -----------------------------
const Features: React.FC = () => {
  return (
    <section className="bg-black pb-10">
      <div className="container mx-auto px-3 md:px-0">
      <div className="px-5 pt-32 pb-16">
          <p className="special-font hero-heading text-lg text-blue-50 text-center">
            Get your tickets now!!
          </p>
          <p className="max-w-md font-circular-web text-lg text-blue-50 opacity-50">
          </p>
        </div>
        <>
        <div>
        <div className="grid h-[80vh] w-full grid-cols-2 grid-rows-2 gap-7 ">
  {passes.map((p, index) => (
    <BentoTilt
      key={p.id}
      className={
        index === 0
          ? "bento-tilt_1 row-span-1 md:col-span-1 md:row-span-2"
          : index === 1
          ? "bento-tilt_1 row-span-1 ms-32 md:col-span-1 md:ms-0"
          : "bento-tilt_1 me-14 md:col-span-1 md:me-0"
      }
    >
      <BentoCard
        src={p.videoSrc}
        title={p.title}
        description={p.description}
        price={`₹${p.price}`}
        perks={p.perks}
      />
    </BentoTilt>
  ))}
</div>

</div>

</>
      </div>
    </section>
  );
};

export default Features;
