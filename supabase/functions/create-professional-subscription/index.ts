import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
const siteUrl = Deno.env.get("SITE_URL") ?? "https://www.elpyo.com";

const professionalPriceId = "price_1TvZzgCwt7Wup76QSgLwcu6q";

if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");
if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SERVICE_ROLE_KEY");

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia",
});

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405,
    );
  }

  try {
    const authorizationHeader = req.headers.get("Authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Utente non autenticato" },
        401,
      );
    }

    const accessToken = authorizationHeader.replace("Bearer ", "").trim();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      console.error("Errore autenticazione:", userError);

      return jsonResponse(
        { error: "Sessione non valida o scaduta" },
        401,
      );
    }

    const { data: professionalProfile, error: profileError } =
      await supabaseAdmin
        .from("professional_profiles")
        .select(
          `
            user_id,
            business_name,
            email,
            onboarding_step,
            subscription_status,
            is_published
          `,
        )
        .eq("user_id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Errore lettura profilo professionale:",
        profileError,
      );

      return jsonResponse(
        { error: "Errore durante il recupero del profilo" },
        500,
      );
    }

    if (!professionalProfile) {
      return jsonResponse(
        { error: "Profilo professionale non trovato" },
        404,
      );
    }

    if ((professionalProfile.onboarding_step ?? 0) < 4) {
      return jsonResponse(
        {
          error:
            "Completa tutti i passaggi dell’onboarding prima di procedere al pagamento",
        },
        400,
      );
    }

    if (
      professionalProfile.subscription_status === "active" ||
      professionalProfile.subscription_status === "trialing"
    ) {
      return jsonResponse(
        { error: "L’abbonamento professionale è già attivo" },
        409,
      );
    }

    const customerEmail =
      professionalProfile.email?.trim() ||
      user.email?.trim() ||
      undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      payment_method_types: ["card"],

      line_items: [
        {
          price: professionalPriceId,
          quantity: 1,
        },
      ],

      customer_email: customerEmail,

      client_reference_id: user.id,

      metadata: {
        user_id: user.id,
        professional_user_id: user.id,
        subscription_type: "professional",
        business_name:
          professionalProfile.business_name ?? "",
      },

      subscription_data: {
        metadata: {
          user_id: user.id,
          professional_user_id: user.id,
          subscription_type: "professional",
          business_name:
            professionalProfile.business_name ?? "",
        },
      },

      success_url:
        `${siteUrl}/onboarding-professionista?step=4&checkout=success&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${siteUrl}/onboarding-professionista?step=4&checkout=cancelled`,

      allow_promotion_codes: false,
      billing_address_collection: "auto",
    });

    if (!session.url) {
      return jsonResponse(
        { error: "Stripe non ha restituito l’URL del Checkout" },
        500,
      );
    }

    return jsonResponse({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error(
      "Errore create-professional-subscription:",
      error,
    );

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Errore durante la creazione del Checkout",
      },
      500,
    );
  }
});