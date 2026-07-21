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
  value:
    | string
    | Stripe.Customer
    | Stripe.DeletedCustomer
    | Stripe.Subscription
    | Stripe.PaymentIntent
    | null,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function getPaymentIntentId(session: Stripe.Checkout.Session) {
  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }

  return session.payment_intent?.id ?? null;
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

async function handleProfessionalCheckout(
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

async function handleProfessionalSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = await getUserIdFromSubscription(subscription);
  const isActive =
    subscription.status === "active" ||
    subscription.status === "trialing";

  const updates: ProfessionalUpdate = {
    stripe_customer_id: getStripeId(subscription.customer),
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

async function handleProfessionalSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = await getUserIdFromSubscription(subscription);

  const updates: ProfessionalUpdate = {
    stripe_customer_id: getStripeId(subscription.customer),
    stripe_subscription_id: subscription.id,
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

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacyInvoice = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };

  return getStripeId(legacyInvoice.subscription ?? null);
}

async function handleProfessionalInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) return;

  await updateProfessionalBySubscriptionId(subscriptionId, {
    subscription_status: "past_due",
    is_published: false,
  });
}

async function handleProfessionalInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleProfessionalSubscriptionUpdated(subscription);
}

async function handleRequestPayment(session: Stripe.Checkout.Session) {
  const requestId = session.metadata?.requestId;
  const amountTotal = session.amount_total;

  if (!requestId || !amountTotal) {
    throw new Error("Missing requestId or payment amount");
  }

  if (session.payment_status !== "paid") {
    console.log(`Request Checkout not paid: ${session.id}`);
    return;
  }

  const helperAmount = Number(session.metadata?.helperAmount ?? 0);
  const platformFee = Number(session.metadata?.platformFee ?? 0);
  const totalAmount = amountTotal / 100;
  const paidAt = new Date().toISOString();

  if (
    !Number.isFinite(helperAmount) ||
    helperAmount < 0 ||
    !Number.isFinite(platformFee) ||
    platformFee < 0
  ) {
    throw new Error("Invalid request payment metadata");
  }

  const { data: updatedRequests, error: updateError } = await supabaseAdmin
    .from("requests")
    .update({
      payment_status: "paid",
      paid_at: paidAt,
      platform_fee: platformFee,
      helper_amount: helperAmount,
    })
    .eq("id", requestId)
    .eq("status", "completata")
    .neq("payment_status", "paid")
    .select("id, title, reward, seeker_id, helper_id");

  if (updateError) {
    throw updateError;
  }

  const requestData = updatedRequests?.[0];

  if (!requestData) {
    console.log(`Request payment already processed: ${requestId}`);
    return;
  }

  const { error: notificationError } = await supabaseAdmin
    .from("admin_notifications")
    .insert({
      type: "stripe_payment_completed",
      title: "Pagamento Stripe completato",
      message:
        `Pagamento completato per ${requestData.title ?? "una richiesta"}: €${totalAmount.toFixed(2)}.`,
      metadata: {
        request_id: requestId,
        request_title: requestData.title ?? null,
        seeker_id: requestData.seeker_id ?? null,
        helper_id: requestData.helper_id ?? null,
        amount_total: totalAmount,
        helper_amount: helperAmount,
        platform_fee: platformFee,
        stripe_session_id: session.id,
        stripe_payment_intent_id: getPaymentIntentId(session),
        paid_at: paidAt,
      },
    });

  if (notificationError) {
    console.error(
      "Admin request payment notification error:",
      notificationError,
    );
  }
}

async function handlePenaltyPayment(session: Stripe.Checkout.Session) {
  const penaltyId = session.metadata?.penaltyId;
  const userId = session.metadata?.userId;
  const requestId = session.metadata?.requestId;

  const expectedAmount = Number(
    session.metadata?.penaltyAmount ?? 0,
  );

  const receivedAmount = Number(session.amount_total ?? 0) / 100;

  if (!penaltyId || !userId || !requestId) {
    throw new Error("Missing penalty metadata");
  }

  if (session.payment_status !== "paid") {
    console.log(`Penalty Checkout not paid: ${session.id}`);
    return;
  }

  if (
    !Number.isFinite(expectedAmount) ||
    expectedAmount <= 0 ||
    !Number.isFinite(receivedAmount) ||
    receivedAmount <= 0 ||
    Math.abs(expectedAmount - receivedAmount) > 0.001
  ) {
    throw new Error("Penalty payment amount mismatch");
  }

  const { data: existingPenalty, error: lookupError } =
    await supabaseAdmin
      .from("penalties")
      .select(
        `
          id,
          user_id,
          request_id,
          amount,
          reason,
          status
        `,
      )
      .eq("id", penaltyId)
      .eq("user_id", userId)
      .eq("request_id", requestId)
      .single();

  if (lookupError || !existingPenalty) {
    throw new Error("Penalty not found");
  }

  const databaseAmount = Number(existingPenalty.amount);

  if (
    !Number.isFinite(databaseAmount) ||
    Math.abs(databaseAmount - receivedAmount) > 0.001
  ) {
    throw new Error("Database penalty amount mismatch");
  }

  if (existingPenalty.status === "paid") {
    console.log(`Penalty already processed: ${penaltyId}`);
    return;
  }

  if (existingPenalty.status !== "pending") {
    throw new Error("Penalty is not payable");
  }

  const paidAt = new Date().toISOString();
  const paymentIntentId = getPaymentIntentId(session);

  const { data: updatedPenalties, error: penaltyError } =
    await supabaseAdmin
      .from("penalties")
      .update({
        status: "paid",
        paid_at: paidAt,
        updated_at: paidAt,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq("id", penaltyId)
      .eq("user_id", userId)
      .eq("request_id", requestId)
      .eq("status", "pending")
      .select("id, amount, reason");

  if (penaltyError) {
    throw penaltyError;
  }

  const paidPenalty = updatedPenalties?.[0];

  if (!paidPenalty) {
    console.log(`Penalty already processed concurrently: ${penaltyId}`);
    return;
  }

  const { error: requestError } = await supabaseAdmin
    .from("requests")
    .update({
      cancellation_fee_status: "paid",
    })
    .eq("id", requestId)
    .eq("cancelled_by", userId)
    .eq("cancellation_fee_status", "pending");

  if (requestError) {
    throw requestError;
  }

  const { error: userNotificationError } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: userId,
      type: "penalty_paid",
      title: "Penale saldata",
      body:
        `Il pagamento della penale ELPYO di €${receivedAmount.toFixed(2)} è stato registrato correttamente.`,
      link: "/penali",
      is_read: false,
    });

  if (userNotificationError) {
    console.error(
      "Penalty user notification error:",
      userNotificationError,
    );
  }

  const { error: adminNotificationError } = await supabaseAdmin
    .from("admin_notifications")
    .insert({
      type: "stripe_penalty_paid",
      title: "Penale Stripe saldata",
      message:
        `Un utente ha saldato una penale ELPYO di €${receivedAmount.toFixed(2)}.`,
      metadata: {
        penalty_id: penaltyId,
        request_id: requestId,
        user_id: userId,
        amount: receivedAmount,
        reason: paidPenalty.reason,
        stripe_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        paid_at: paidAt,
      },
    });

  if (adminNotificationError) {
    console.error(
      "Penalty admin notification error:",
      adminNotificationError,
    );
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
    });
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing Stripe signature", {
      status: 400,
    });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error(
      "Webhook signature verification failed:",
      error,
    );

    return new Response("Invalid signature", {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        if (
          session.mode === "subscription" ||
          session.metadata?.subscription_type === "professional"
        ) {
          await handleProfessionalCheckout(session);
        } else if (session.metadata?.paymentType === "penalty") {
          await handlePenaltyPayment(session);
        } else {
          await handleRequestPayment(session);
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleProfessionalSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await handleProfessionalSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "invoice.payment_succeeded":
        await handleProfessionalInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
        );
        break;

      case "invoice.payment_failed":
        await handleProfessionalInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;

      default:
        console.log(`Evento Stripe ignorato: ${event.type}`);
    }

    return new Response("ok", {
      status: 200,
    });
  } catch (error) {
    console.error("Webhook handler error:", error);

    return new Response("Webhook error", {
      status: 500,
    });
  }
});
