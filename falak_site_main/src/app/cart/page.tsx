// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { getUserByEmail } from "@/lib/actions/tables/users";
// import CartList from "@/components/cart/CartList";

// export default async function Cart() {
//     const session = await getServerSession(authOptions);
//     const email = session?.user?.email ?? null;
//     await (email ? getUserByEmail(email) : Promise.resolve({ ok: true, data: null }));
//     // Always render guest-mode list; it will read localStorage client side.
//     return <CartList passes={[]} />
// }

// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { getUserByEmail } from "@/lib/actions/tables/users";
// import CartList from "@/components/cart/CartList";

// export default async function Cart() {
//   const session = await getServerSession(authOptions);
//   const email = session?.user?.email ?? null;
//   await (email ? getUserByEmail(email) : Promise.resolve({ ok: true, data: null }));

//   return (
//     <div 
//       className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8"
//       style={{ backgroundColor: '#F3C079' }}
//     >
//       <div className="max-w-4xl mx-auto">
//         {/* Header Section */}
//         <div className="text-center mb-12">
//           <h1 className="text-4xl sm:text-5xl font-bold mb-4 font-serif" style={{ color: '#191919' }}>
//             Your Cart
//           </h1>
//           <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: '#59917E' }}></div>
//         </div>

//         {/* Cart Content */}
//         <div className="space-y-8">
//           <CartList passes={[]} />
//         </div>
//       </div>
//     </div>
//   );
// }

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import CartList from "@/components/cart/CartList";

export default async function Cart() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  await (email ? getUserByEmail(email) : Promise.resolve({ ok: true, data: null }));

  return <CartList passes={[]} />;
}