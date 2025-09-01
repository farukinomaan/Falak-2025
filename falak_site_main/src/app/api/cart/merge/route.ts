export async function POST() {
  return new Response(JSON.stringify({ ok: false, error: "cart/merge deprecated" }), { status: 410 });
}
