// Legacy DB cart endpoint removed. Keeping empty module to avoid 404 import noise until directories are pruned.
export async function POST() {
  return new Response(JSON.stringify({ ok: false, error: "cart/add deprecated" }), { status: 410 });
}
