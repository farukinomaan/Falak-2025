export async function GET() {
  return new Response(JSON.stringify({ ok: false, error: "cart/count deprecated" }), { status: 410 });
}
