import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
const siteUrl = Deno.env.get("SITE_URL") ?? "https://www.elpyo.com";

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

const PLATFORM_FEE_PERCENTAGE = 15;
const MIN_PLATFORM_FEE = 2;
const PLATFORM_FEE_THRESHOLD = 20;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { requestId, description } = await req.json();

    if (!requestId) {
      return Response.json(
        { error: "Missing requestId" },
        { status: 400, headers: corsHeaders },
      );
    }

    const { data: request, error: requestError } = await supabaseAdmin
      .from("requests")
      .select("id, title, reward, helper_id, status")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return Response.json(
        { error: "Request not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    if (request.status !== "completata") {
      return Response.json(
        { error: "Request is not completed" },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!request.helper_id) {
      return Response.json(
        { error: "Missing helper" },
        { status: 400, headers: corsHeaders },
      );
    }

    const { data: helperProfile, error: helperError } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_completed, stripe_payouts_enabled, stripe_charges_enabled")
      .eq("id", request.helper_id)
      .single();

    if (helperError || !helperProfile?.stripe_account_id) {
      return Response.json(
        { error: "Helper has no Stripe Connect account" },
        { status: 400, headers: corsHeaders },
      );
    }

    if (
      !helperProfile.stripe_onboarding_completed ||
      !helperProfile.stripe_payouts_enabled ||
      !helperProfile.stripe_charges_enabled
    ) {
      return Response.json(
        { error: "Helper Stripe account is not ready to receive payments" },
        { status: 400, headers: corsHeaders },
      );
    }

    const { data: approvedExpenses, error: expensesError } = await supabaseAdmin
      .from("request_expenses")
      .select("receipt_amount")
      .eq("request_id", requestId)
      .eq("status", "approved");

    if (expensesError) {
      return Response.json(
        { error: expensesError.message },
        { status: 500, headers: corsHeaders },
      );
    }

    const helperReward = Number(request.reward);
    const safeHelperReward = Number.isNaN(helperReward) ? 0 : helperReward;

    const expensesTotal = Number(
      (approvedExpenses ?? [])
        .reduce((sum, expense) => sum + Number(expense.receipt_amount), 0)
        .toFixed(2),
    );

    const platformFee =
      safeHelperReward > 0
        ? safeHelperReward <= PLATFORM_FEE_THRESHOLD
          ? MIN_PLATFORM_FEE
          : Number(((safeHelperReward * PLATFORM_FEE_PERCENTAGE) / 100).toFixed(2))
        : 0;

    const helperAmount = Number((safeHelperReward + expensesTotal).toFixed(2));
    const totalAmount = Number((helperAmount + platformFee).toFixed(2));

    const amountInCents = Math.round(totalAmount * 100);
    const helperAmountInCents = Math.round(helperAmount * 100);
    const platformFeeInCents = Math.round(platformFee * 100);

    if (!Number.isFinite(amountInCents) || amountInCents < 50) {
      return Response.json(
        { error: "Invalid amount" },
        { status: 400, headers: corsHeaders },
      );
    }

    const paymentMetadata = {
      requestId,
      helperId: request.helper_id,
      helperAmount: String(helperAmount),
      helperReward: String(safeHelperReward),
      approvedExpenses: String(expensesTotal),
      platformFee: String(platformFee),
      totalAmount: String(totalAmount),
      stripeConnectedAccountId: helperProfile.stripe_account_id,
    };

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
              name: description || `Pagamento richiesta ELPYO - ${request.title}`,
              metadata: paymentMetadata,
            },
          },
        },
      ],
      payment_intent_data: {
        transfer_data: {
          destination: helperProfile.stripe_account_id,
          amount: helperAmountInCents,
        },
        metadata: paymentMetadata,
      },
      metadata: paymentMetadata,
      success_url: `${siteUrl}/pagamento-successo?session_id={CHECKOUT_SESSION_ID}&request_id=${requestId}`,
      cancel_url: `${siteUrl}/pagamento-annullato?request_id=${requestId}`,
    });

    return Response.json({ url: session.url }, { headers: corsHeaders });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: error instanceof Error ? error.message : "Errore pagamento" },
      { status: 500, headers: corsHeaders },
    );
  }
});
