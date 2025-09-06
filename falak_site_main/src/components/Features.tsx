"use client";

import { useRef, ReactNode } from "react";
import BuyNowButton from "@/components/BuyNowButton";
import PassAddToCartButton from "@/components/cart/PassAddToCartButton";
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
  title: ReactNode;
  description?: string;
  price: string;
  perks?: string[];
  passId?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({ title, description, price, perks, passId }) => {
  return (
    <div className="relative size-full bg-[#32212C] rounded-lg">
      <div className="flex size-full flex-col justify-between p-5 text-blue-50">
        <div>
          <h1 className="bento-title font-brasty">{title}</h1>
          {description && (
            <p className="mt-3 max-w-64 text-xs md:text-base">{description}</p>
          )}
          <p className="mt-2 font-bold font-brasty">{price}</p>
          {perks && perks.length > 0 && (
            <ul className="list-disc ml-5 text-sm mt-2">
              {perks.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>
          )}
          {passId ? <PassAddToCartButton passId={passId} /> : <BuyNowButton />}
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
    <section className="bg-transparent pb-10 relative z-10">
      <div className="container mx-auto px-3 md:px-0">
        <div className="px-5 pt-30 md:pt-36 pb-16">
                          <p
                  className="text-6xl text-yellow-400 text-center font-bold uppercase tracking-wider sm:mb-10 font-brasty"
                  style={{
                    // Brasty Vintage applied via font-brasty utility; keep effect styles only
                    textShadow: '0 0 10px #fbbf24, 0 0 20px #f59e0b, 0 0 30px #d97706, 0 0 40px #b45309',
                    filter: 'drop-shadow(0 0 5px #fbbf24) drop-shadow(0 0 10px #f59e0b)'
                  }}
                >
                  Get your Passes now!!
                </p>
        </div>
        
        {/* Prominent Cassette Display */}
        <div className="flex justify-center items-center min-h-screen -mt-52">
          {tiles.length > 0 && tiles[0].passId && (
            <CassettePass 
              pass={{
                id: tiles[0].passId,
                pass_name: String(tiles[0].title),
                description: tiles[0].description,
                cost: tiles[0].price.replace('₹', '')
              }} 
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default Features;
