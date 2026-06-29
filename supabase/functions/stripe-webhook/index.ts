import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");
if (!webhookSecret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SERVICE_ROLE_KEY");

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia",
});

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const requestId = session.metadata?.requestId;
      const amountTotal = session.amount_total;

      if (!requestId || !amountTotal) {
        return new Response("Missing requestId or amount", { status: 400 });
      }

      const helperAmount = Number(session.metadata?.helperAmount ?? 0);
      const platformFee = Number(session.metadata?.platformFee ?? 0);
      const totalAmount = amountTotal / 100;

      const { error: updateError } = await supabaseAdmin
        .from("requests")
        .update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          platform_fee: platformFee,
          helper_amount: helperAmount,
        })
        .eq("id", requestId)
        .eq("status", "completata");

      if (updateError) {
        console.error("Supabase update error:", updateError);
        return new Response("Database update failed", { status: 500 });
      }

      const { data: requestData, error: requestError } = await supabaseAdmin
        .from("requests")
        .select("id, title, reward, seeker_id, helper_id")
        .eq("id", requestId)
        .single();

      if (requestError) {
        console.error("Request lookup error:", requestError);
      }

      const { error: notificationError } = await supabaseAdmin
        .from("admin_notifications")
        .insert({
          type: "stripe_payment_completed",
          title: "Pagamento Stripe completato",
          message: `Pagamento completato per ${requestData?.title ?? "una richiesta"}: €${totalAmount.toFixed(2)}.`,
          metadata: {
            request_id: requestId,
            request_title: requestData?.title ?? null,
            seeker_id: requestData?.seeker_id ?? null,
            helper_id: requestData?.helper_id ?? null,
            amount_total: totalAmount,
            helper_amount: helperAmount,
            platform_fee: platformFee,
            stripe_session_id: session.id,
          },
        });

      if (notificationError) {
        console.error("Admin notification error:", notificationError);
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response("Webhook error", { status: 500 });
  }
});