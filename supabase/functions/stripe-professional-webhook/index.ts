import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_PROFESSIONAL_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");
if (!webhookSecret) {
  throw new Error("Missing STRIPE_PROFESSIONAL_WEBHOOK_SECRET");
}
if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SERVICE_ROLE_KEY");

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

type ProfessionalUpdate = {
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string;
  current_period_end?: string | null;
  subscription_started_at?: string | null;
  cancel_at_period_end?: boolean;
  is_published?: boolean;
  published_at?: string | null;
  updated_at?: string;
};

function timestampToIso(timestamp?: number | null): string | null {
  if (!timestamp) return null;

  return new Date(timestamp * 1000).toISOString();
}

function getStripeId(
  value: string | Stripe.Customer | Stripe.DeletedCustomer | Stripe.Subscription | null,
): string | null {
  if (!value) return null;

  return typeof value === "string" ? value : value.id;
}

async function updateProfessionalByUserId(
  userId: string,
  updates: ProfessionalUpdate,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("professional_profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(
      `Errore aggiornamento profilo professionale ${userId}: ${error.message}`,
    );
  }
}

async function updateProfessionalBySubscriptionId(
  subscriptionId: string,
  updates: ProfessionalUpdate,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("professional_profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    throw new Error(
      `Errore aggiornamento abbonamento ${subscriptionId}: ${error.message}`,
    );
  }
}

async function getUserIdFromSubscription(
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const metadataUserId =
    subscription.metadata?.professional_user_id ||
    subscription.metadata?.user_id;

  if (metadataUserId) {
    return metadataUserId;
  }

  const { data, error } = await supabaseAdmin
    .from("professional_profiles")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Errore ricerca profilo da subscription: ${error.message}`,
    );
  }

  return data?.user_id ?? null;
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.mode !== "subscription") return;

  const userId =
    session.metadata?.professional_user_id ||
    session.metadata?.user_id ||
    session.client_reference_id;

  const customerId = getStripeId(session.customer);
  const subscriptionId = getStripeId(session.subscription);

  if (!userId) {
    throw new Error(
      `User ID mancante nella Checkout Session ${session.id}`,
    );
  }

  if (!subscriptionId) {
    throw new Error(
      `Subscription ID mancante nella Checkout Session ${session.id}`,
    );
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const isActive =
    subscription.status === "active" ||
    subscription.status === "trialing";

  await updateProfessionalByUserId(userId, {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    current_period_end: timestampToIso(subscription.current_period_end),
    subscription_started_at: timestampToIso(subscription.start_date),
    cancel_at_period_end: subscription.cancel_at_period_end,
    is_published: isActive,
    published_at: isActive ? new Date().toISOString() : null,
  });
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = await getUserIdFromSubscription(subscription);

  const customerId = getStripeId(subscription.customer);

  const isActive =
    subscription.status === "active" ||
    subscription.status === "trialing";

  const updates: ProfessionalUpdate = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    current_period_end: timestampToIso(subscription.current_period_end),
    subscription_started_at: timestampToIso(subscription.start_date),
    cancel_at_period_end: subscription.cancel_at_period_end,
    is_published: isActive,
  };

  if (isActive) {
    updates.published_at = new Date().toISOString();
  }

  if (userId) {
    await updateProfessionalByUserId(userId, updates);
    return;
  }

  await updateProfessionalBySubscriptionId(subscription.id, updates);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = await getUserIdFromSubscription(subscription);

  const updates: ProfessionalUpdate = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: getStripeId(subscription.customer),
    subscription_status: "canceled",
    current_period_end: timestampToIso(subscription.current_period_end),
    cancel_at_period_end: false,
    is_published: false,
  };

  if (userId) {
    await updateProfessionalByUserId(userId, updates);
    return;
  }

  await updateProfessionalBySubscriptionId(subscription.id, updates);
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = getStripeId(invoice.subscription);

  if (!subscriptionId) return;

  await updateProfessionalBySubscriptionId(subscriptionId, {
    subscription_status: "past_due",
    is_published: false,
  });
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = getStripeId(invoice.subscription);

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await handleSubscriptionUpdated(subscription);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
    });
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", {
      status: 400,
    });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );
  } catch (error) {
    console.error("Firma webhook non valida:", error);

    return new Response(
      error instanceof Error ? error.message : "Invalid webhook signature",
      { status: 400 },
    );
  }

  try {
    console.log(`Evento Stripe ricevuto: ${event.type} - ${event.id}`);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
        );
        break;

      default:
        console.log(`Evento ignorato: ${event.type}`);
    }

    return Response.json({
      received: true,
    });
  } catch (error) {
    console.error(`Errore gestione evento ${event.type}:`, error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Errore durante la gestione del webhook",
      },
      { status: 500 },
    );
  }
});// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

console.log("Hello from Functions!");

// This endpoint uses 'publishable' | 'secret' access, apiKey is required.
// Use publishable for Client-facing, key-validated endpoints
// Use secret for Server-to-server, internal calls
export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    // Called by another service with a secret key
    // ctx.supabaseAdmin bypasses RLS — use for privileged operations
    /*
    if (ctx.authMode === "secret") {
      const { user_id } = await req.json();
      const { data } = await ctx.supabaseAdmin.auth.admin.getUserById(user_id);

      return Response.json({
        email: data?.user?.email,
      });
    }
    */

    const { name } = await req.json();

    return Response.json({
      message: `Hello ${name}!`,
    });
  }),
};

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/stripe-professional-webhook' \
    --header 'apiKey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH' \
    --data '{"name":"Functions"}'

*/
