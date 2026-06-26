import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const siteUrl = Deno.env.get("SITE_URL") ?? "https://www.elpyo.com";

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { requestId, amount, description } = await req.json();

    if (!requestId || !amount) {
      return Response.json(
        { error: "Missing requestId or amount" },
        { status: 400, headers: corsHeaders },
      );
    }

    const amountInCents = Math.round(Number(amount) * 100);

    if (!Number.isFinite(amountInCents) || amountInCents < 50) {
      return Response.json(
        { error: "Invalid amount" },
        { status: 400, headers: corsHeaders },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amountInCents,
            product_data: {
              name: description || "Pagamento richiesta ELPYO",
              metadata: {
                requestId,
              },
            },
          },
        },
      ],
      metadata: {
        requestId,
      },
      success_url: `${siteUrl}/pagamento-successo?session_id={CHECKOUT_SESSION_ID}&request_id=${requestId}`,
      cancel_url: `${siteUrl}/pagamento-annullato?request_id=${requestId}`,
    });

    return Response.json(
      { url: session.url },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Errore pagamento" },
      { status: 500, headers: corsHeaders },
    );
  }
});
