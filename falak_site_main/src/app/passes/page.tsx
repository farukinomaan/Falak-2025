import { passes } from "@/lib/mock_data/passes";
import Link from "next/link";
import BuyNowButton from "@/components/BuyNowButton";
import Features from "@/components/Features";

export const revalidate = 60;

export default function PassesPage() {
  return (
    <>
      <Features />
      {/* <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-semibold">Passes</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {passes.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 space-y-2">
              <h2 className="text-xl font-medium">{p.title}</h2>
              <p className="text-sm text-gray-600">{p.description}</p>
              <p className="font-bold">₹{p.price}</p>
              <ul className="list-disc ml-5 text-sm">
                {p.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <BuyNowButton />
            </div>
          ))}
        </div>
      </div> */}
    </>
  );
}


