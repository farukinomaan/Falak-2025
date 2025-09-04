"use client";

import AddToCartButton from "@/components/cart/AddToCartButton";

interface CassettePassProps {
  pass: {
    id: string;
    pass_name: string;
    cost?: number | string | null;
  };
}

export default function CassettePass({ pass }: CassettePassProps) {
  return (
    <div className="relative w-[537px] h-[322px] mx-auto">
      {/* Cassette background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/cassette.png')"
        }}
      />
      
      {/* Pass details overlay */}
      <div className="absolute inset-0 flex flex-col justify-center items-center p-12">
        {/* Pass Name */}
        <h3 className="text-white font-bold text-2xl mb-3 text-center">
          {pass.pass_name}
        </h3>
        
        {/* Pass Cost */}
        {pass.cost && (
          <p className="text-white font-semibold text-2xl mb-6">
            ₹{typeof pass.cost === "number" ? pass.cost : pass.cost}
          </p>
        )}
        
        {/* Add to Cart Button */}
        <div className="mt-24">
          <AddToCartButton 
            passId={pass.id} 
            className="px-6 py-3 rounded-lg text-white font-semibold text-lg shadow-lg transition-colors duration-200 cursor-pointer bg-[#DBAAA6]"
            
          />
        </div>
      </div>
    </div>
  );
}
