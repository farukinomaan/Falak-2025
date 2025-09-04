"use client";

import { useRef, ReactNode } from "react";
import BuyNowButton from "@/components/BuyNowButton";
import AddToCartButton from "@/components/cart/AddToCartButton";
import CassettePass from "@/components/CassettePass";

// -----------------------------
// BentoTilt Component
// -----------------------------
interface BentoTiltProps {
  children: ReactNode;
  className?: string;
}

export const BentoTilt: React.FC<BentoTiltProps> = ({ children, className = "" }) => {
  const itemRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={itemRef} className={className}>
      {children}
    </div>
  );
};

// -----------------------------
// BentoCard Component
// -----------------------------
interface BentoCardProps {
  src?: string;
  title: ReactNode;
  description?: string;
  price: string;
  perks?: string[];
  passId?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({ src, title, description, price, perks, passId }) => {
  return (
    <div className="relative size-full bg-[#32212C] rounded-lg">
      <div className="flex size-full flex-col justify-between p-5 text-blue-50">
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
          {passId ? (
            <AddToCartButton passId={passId} />
          ) : (
            <BuyNowButton />
          )}
        </div>
      </div>
    </div>
  );
};

// -----------------------------
// Features Section
// -----------------------------
type FeaturePass = { id: string; pass_name: string; description?: string | null; cost?: number | string | null };
interface FeaturesProps { passes?: FeaturePass[] }
type Tile = { id: string; title: string; description?: string; price: string; videoSrc: string; passId?: string };

const Features: React.FC<FeaturesProps> = ({ passes = [] }) => {
  // Normalize data: enforce exactly 3 tiles to match 2x2 grid with first spanning 2 rows
  const normalized: Tile[] = (passes || []).map((p) => ({
    id: p.id,
    title: p.pass_name,
    description: p.description ?? undefined,
    price: `₹${p.cost ?? ""}`,
    videoSrc: "/videos/feature-1.mp4", // fallback demo video to keep hover animation intact
    passId: p.id,
  }));
  const tiles: Tile[] = normalized.slice(0, 3);
  while (tiles.length < 3) {
    tiles.push({
      id: `placeholder-${tiles.length}`,
      title: "Falak Pass",
      description: undefined,
      price: "",
      videoSrc: "/videos/feature-1.mp4",
      // no passId means show Buy Now CTA instead of Add to Cart
      passId: undefined,
    });
  }
  return (
    <section className="bg-[#32212C] pb-10">
      <div className="container mx-auto px-3 md:px-0">
        <div className="px-5 pt-32 pb-16">
          <p className="special-font hero-heading text-lg text-blue-50 text-center">
            Get your tickets now!!
          </p>
          <p className="max-w-md font-circular-web text-lg text-blue-50 opacity-50"></p>
        </div>
        
        {/* Prominent Cassette Display */}
        <div className="flex justify-center mb-12">
          {tiles.length > 0 && tiles[0].passId && (
            <div className="scale-125">
              <CassettePass 
                pass={{
                  id: tiles[0].passId,
                  pass_name: String(tiles[0].title),
                  cost: tiles[0].price.replace('₹', '')
                }} 
              />
            </div>
          )}
        </div>
        
        <>
          <div>
            <div className="grid h-[80vh] w-full grid-cols-2 grid-rows-2 gap-7 ">
              {tiles.map((p, index) => (
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
                    price={p.price}
                    passId={p.passId}
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
