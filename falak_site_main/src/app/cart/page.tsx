import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/actions/tables/users";
import CartList from "@/components/cart/CartList";

export default async function Cart() {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    await (email ? getUserByEmail(email) : Promise.resolve({ ok: true, data: null }));
    // Always render guest-mode list; it will read localStorage client side.
    return <CartList passes={[]} />
}