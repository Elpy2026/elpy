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
      .select("id, stripe_account_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return Response.json(
        { error: "Profile not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    if (!profile.stripe_account_id) {
      return Response.json(
        { error: "Stripe account not connected" },
        { status: 400, headers: corsHeaders },
      );
    }

    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    const onboardingCompleted = Boolean(account.details_submitted);
    const payoutsEnabled = Boolean(account.payouts_enabled);
    const chargesEnabled = Boolean(account.charges_enabled);

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        stripe_onboarding_completed: onboardingCompleted,
        stripe_payouts_enabled: payoutsEnabled,
        stripe_charges_enabled: chargesEnabled,
      })
      .eq("id", user.id);

    if (updateError) {
      return Response.json(
        { error: updateError.message },
        { status: 500, headers: corsHeaders },
      );
    }

    return Response.json(
      {
        stripe_account_id: profile.stripe_account_id,
        stripe_onboarding_completed: onboardingCompleted,
        stripe_payouts_enabled: payoutsEnabled,
        stripe_charges_enabled: chargesEnabled,
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
            : "Errore sincronizzazione account Stripe",
      },
      { status: 500, headers: corsHeaders },
    );
  }
});