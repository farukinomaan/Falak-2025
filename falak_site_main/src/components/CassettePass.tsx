"use client";

import PassAddToCartButton from "@/components/cart/PassAddToCartButton";

interface CassettePassProps {
  pass: {
    id: string;
    pass_name: string;
    description?: string | null;
    cost?: number | string | null;
  };
}

export default function CassettePass({ pass }: CassettePassProps) {
  return (
    <div className="relative w-[1053px] h-[631px] mx-auto cursor-pointer z-40" style={{ perspective: '1000px' }}>
      {/* Main cassette container with flip effect */}
      <div className="relative w-full h-full transition-transform duration-700 ease-in-out hover:rotate-y-180" style={{ transformStyle: 'preserve-3d' }}>
        
        {/* FRONT SIDE - Pass Name and Cost */}
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
          {/* Cassette background */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: "url('/cassette.png')",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center"
            }}
          />
          
          {/* Neon border that follows cassette shape */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "url('/cassette.png')",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              filter: "drop-shadow(0 0 10px #8B5CF6) drop-shadow(0 0 20px #A855F7)",
              borderRadius: "16px"
            }}
          />
          
          {/* Pass Name - positioned independently */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-14">
            <h3 
              className="text-white font-bold text-2xl text-center"
              style={{
                fontFamily: "'Varela Round', 'Quicksand', sans-serif",
                textShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
              }}
            >
              {pass.pass_name}
            </h3>
          </div>

          {/* Pass Cost - positioned independently */}
          {pass.cost && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-20">
              <p 
                className="font-bold text-2xl text-center"
                style={{
                  fontFamily: "'Varela Round', 'Quicksand', sans-serif",
                  color: 'white'
                }}
              >
                ₹{typeof pass.cost === "number" ? pass.cost : pass.cost}
              </p>
            </div>
          )}
          
          {/* Add to Cart Button */}
          <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2">
            <PassAddToCartButton
              passId={pass.id}
              className="px-6 py-3 rounded-lg bg-[#D7897D] text-white font-semibold text-lg shadow-lg hover:bg-[#c97b70] transition-colors duration-200"
            />
          </div>
        </div>

        {/* BACK SIDE - Description */}
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          {/* Cassette background */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: "url('/cassette.png')",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center"
            }}
          />
          
          {/* Neon border that follows cassette shape */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "url('/cassette.png')",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              filter: "drop-shadow(0 0 10px #8B5CF6) drop-shadow(0 0 20px #A855F7)",
              borderRadius: "16px"
            }}
          />
          
          {/* Translucent Label Overlay - Much Smaller Cassette Size */}
          <div 
            className="absolute z-10"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              padding: '20px 30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // Much smaller size to match cassette PNG more closely
              width: '60%',
              height: '60%',
              top: '20%',
              left: '20%'
            }}
          >
            {/* Pass Description - centered on label */}
            {pass.description ? (
              <div className="text-center">
                <h4 
                  className="text-purple-300 text-sm font-semibold mb-3 uppercase tracking-wider"
                  style={{
                    fontFamily: "'Varela Round', 'Quicksand', sans-serif",
                    textShadow: '0 0 4px rgba(139, 92, 246, 0.5)'
                  }}
                >
                  Description
                </h4>
                <p 
                  className="text-white text-base leading-relaxed"
                  style={{
                    fontFamily: "'Varela Round', 'Quicksand', sans-serif",
                    textShadow: '0 0 6px rgba(255, 255, 255, 0.3)'
                  }}
                >
                  {pass.description}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <h4 
                  className="text-purple-300 text-sm font-semibold mb-3 uppercase tracking-wider"
                  style={{
                    fontFamily: "'Varela Round', 'Quicksand', sans-serif",
                    textShadow: '0 0 4px rgba(139, 92, 246, 0.5)'
                  }}
                >
                  Description
                </h4>
                <p 
                  className="text-gray-300 text-base"
                  style={{
                    fontFamily: "'Varela Round', 'Quicksand', sans-serif",
                    textShadow: '0 0 4px rgba(255, 255, 255, 0.2)'
                  }}
                >
                  No description available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );    
}
