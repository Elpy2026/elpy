import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");
if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SERVICE_ROLE_KEY");

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia",
});

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function centsToEuro(amount: number | null | undefined) {
  return Number(((amount ?? 0) / 100).toFixed(2));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return Response.json(
        { error: "Missing Authorization header" },
        { status: 401, headers: corsHeaders },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return Response.json(
        { error: "User not authenticated" },
        { status: 401, headers: corsHeaders },
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, is_admin")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return Response.json(
        { error: "Admin access required" },
        { status: 403, headers: corsHeaders },
      );
    }

    const [balance, charges, paymentIntents, connectedAccounts] =
      await Promise.all([
        stripe.balance.retrieve(),
        stripe.charges.list({ limit: 50 }),
        stripe.paymentIntents.list({ limit: 50 }),
        stripe.accounts.list({ limit: 50 }),
      ]);

    const successfulCharges = charges.data.filter(
      (charge) => charge.status === "succeeded" && !charge.refunded,
    );

    const refundedCharges = charges.data.filter((charge) => charge.refunded);

    const volumeTotal = successfulCharges.reduce(
      (sum, charge) => sum + centsToEuro(charge.amount),
      0,
    );

    const refundedTotal = refundedCharges.reduce(
      (sum, charge) => sum + centsToEuro(charge.amount_refunded),
      0,
    );

    const applicationFeesTotal = successfulCharges.reduce(
      (sum, charge) => sum + centsToEuro(charge.application_fee_amount),
      0,
    );

    const availableBalance = balance.available.reduce(
      (sum, item) => sum + centsToEuro(item.amount),
      0,
    );

    const pendingBalance = balance.pending.reduce(
      (sum, item) => sum + centsToEuro(item.amount),
      0,
    );

    const latestPayments = charges.data.slice(0, 20).map((charge) => ({
      id: charge.id,
      created: charge.created,
      date: new Date(charge.created * 1000).toISOString(),
      amount: centsToEuro(charge.amount),
      amountRefunded: centsToEuro(charge.amount_refunded),
      currency: charge.currency,
      status: charge.status,
      refunded: charge.refunded,
      paid: charge.paid,
      description: charge.description,
      receiptEmail: charge.receipt_email,
      paymentIntent:
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id ?? null,
      applicationFeeAmount: centsToEuro(charge.application_fee_amount),
    }));

    const latestPaymentIntents = paymentIntents.data.slice(0, 20).map((pi) => ({
      id: pi.id,
      created: pi.created,
      date: new Date(pi.created * 1000).toISOString(),
      amount: centsToEuro(pi.amount),
      amountReceived: centsToEuro(pi.amount_received),
      currency: pi.currency,
      status: pi.status,
      description: pi.description,
      metadata: pi.metadata,
    }));

    const accounts = connectedAccounts.data.map((account) => ({
      id: account.id,
      email: account.email,
      type: account.type,
      country: account.country,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      created: account.created,
      date: new Date(account.created * 1000).toISOString(),
      businessType: account.business_type,
    }));

    return Response.json(
      {
        summary: {
          volumeTotal,
          applicationFeesTotal,
          refundedTotal,
          availableBalance,
          pendingBalance,
          successfulPayments: successfulCharges.length,
          refundedPayments: refundedCharges.length,
          connectedAccounts: connectedAccounts.data.length,
        },
        latestPayments,
        latestPaymentIntents,
        connectedAccounts: accounts,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Errore caricamento dashboard Stripe",
      },
      { status: 500, headers: corsHeaders },
    );
  }
});