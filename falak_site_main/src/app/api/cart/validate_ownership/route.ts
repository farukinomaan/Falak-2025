export async function GET() {
  return new Response(JSON.stringify({ ok: false, error: "cart/validate_ownership deprecated" }), { status: 410 });
}
