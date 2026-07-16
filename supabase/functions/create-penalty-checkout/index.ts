import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
const siteUrl = Deno.env.get("SITE_URL") ?? "https://www.elpyo.com";

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SERVICE_ROLE_KEY");
}

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
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed",
      },
      405,
    );
  }

  try {
    const authorization = req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    const accessToken = authorization
      .replace("Bearer ", "")
      .trim();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      console.error("Penalty Checkout authentication error:", userError);

      return jsonResponse(
        {
          error: "Invalid authentication",
        },
        401,
      );
    }

    let requestBody: {
      penaltyId?: string;
    };

    try {
      requestBody = await req.json();
    } catch {
      return jsonResponse(
        {
          error: "Invalid request body",
        },
        400,
      );
    }

    const penaltyId = requestBody.penaltyId?.trim();

    if (!penaltyId) {
      return jsonResponse(
        {
          error: "Missing penaltyId",
        },
        400,
      );
    }

    const { data: penalty, error: penaltyError } = await supabaseAdmin
      .from("penalties")
      .select(
        `
          id,
          user_id,
          request_id,
          amount,
          reason,
          status,
          stripe_checkout_session_id
        `,
      )
      .eq("id", penaltyId)
      .eq("user_id", user.id)
      .single();

    if (penaltyError || !penalty) {
      console.error("Penalty lookup error:", penaltyError);

      return jsonResponse(
        {
          error: "Penalty not found",
        },
        404,
      );
    }

    if (penalty.status === "paid") {
      return jsonResponse(
        {
          error: "La penale risulta già pagata.",
        },
        409,
      );
    }

    if (penalty.status !== "pending") {
      return jsonResponse(
        {
          error: "La penale non può essere pagata.",
        },
        400,
      );
    }

    const { data: requestData, error: requestError } = await supabaseAdmin
    .from("requests")
    .select("id, title")
    .eq("id", penalty.request_id)
    .single();
  
  if (requestError || !requestData) {
    console.error("Penalty request lookup error:", requestError);
  
    return jsonResponse(
      {
        error: "Richiesta collegata alla penale non trovata.",
      },
      404,
    );
  }
  
  const penaltyAmount = Number(penalty.amount);
  
  if (!Number.isFinite(penaltyAmount) || penaltyAmount <= 0) {
    return jsonResponse(
      {
        error: "Importo della penale non valido.",
      },
      400,
    );
  }

    if (requestData.cancelled_by !== user.id) {
      return jsonResponse(
        {
          error: "La penale non appartiene all’utente autenticato.",
        },
        403,
      );
    }

    if (requestData.cancellation_fee_status === "paid") {
      return jsonResponse(
        {
          error: "La commissione di annullamento risulta già saldata.",
        },
        409,
      );
    }

    if (requestData.cancellation_fee_status !== "pending") {
      return jsonResponse(
        {
          error: "La commissione di annullamento non risulta pagabile.",
        },
        400,
      );
    }

    const penaltyAmount = Number(penalty.amount);
    const requestPenaltyAmount = Number(
      requestData.cancellation_fee_amount,
    );

    if (
      !Number.isFinite(penaltyAmount) ||
      penaltyAmount <= 0
    ) {
      return jsonResponse(
        {
          error: "Importo della penale non valido.",
        },
        400,
      );
    }

    if (
      !Number.isFinite(requestPenaltyAmount) ||
      Math.abs(penaltyAmount - requestPenaltyAmount) > 0.001
    ) {
      console.error("Penalty amount mismatch:", {
        penaltyAmount,
        requestPenaltyAmount,
        penaltyId: penalty.id,
        requestId: penalty.request_id,
      });

      return jsonResponse(
        {
          error:
            "L’importo della penale non coincide con quello della richiesta.",
        },
        409,
      );
    }

    const amountInCents = Math.round(penaltyAmount * 100);

    if (!Number.isFinite(amountInCents) || amountInCents < 50) {
      return jsonResponse(
        {
          error: "Importo Stripe non valido.",
        },
        400,
      );
    }

    if (penalty.stripe_checkout_session_id) {
      try {
        const existingSession =
          await stripe.checkout.sessions.retrieve(
            penalty.stripe_checkout_session_id,
          );

        if (
          existingSession.status === "open" &&
          existingSession.url
        ) {
          return jsonResponse({
            url: existingSession.url,
            reused: true,
          });
        }

        if (
          existingSession.status === "complete" ||
          existingSession.payment_status === "paid"
        ) {
          return jsonResponse(
            {
              error:
                "Il pagamento risulta completato su Stripe ed è in fase di registrazione.",
            },
            409,
          );
        }
      } catch (existingSessionError) {
        console.error(
          "Existing penalty Checkout Session lookup failed:",
          existingSessionError,
        );
      }
    }

    const metadata = {
      paymentType: "penalty",
      penaltyId: penalty.id,
      userId: penalty.user_id,
      requestId: penalty.request_id,
      penaltyAmount: penaltyAmount.toFixed(2),
      penaltyReason: String(penalty.reason ?? ""),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      customer_email: user.email ?? undefined,

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amountInCents,
            product_data: {
              name: "Pagamento penale ELPYO",
              description:
                requestData.title
                  ? `Commissione per annullamento: ${requestData.title}`
                  : "Commissione dovuta per annullamento del servizio",
              metadata,
            },
          },
        },
      ],

      payment_intent_data: {
        metadata,
      },

      metadata,

      success_url:
        `${siteUrl}/penali?payment=success&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${siteUrl}/penali?payment=cancelled`,
    });

    if (!session.url) {
      console.error(
        "Stripe Checkout Session created without URL:",
        session.id,
      );

      return jsonResponse(
        {
          error: "Stripe non ha restituito il link di pagamento.",
        },
        500,
      );
    }

    const { data: updatedPenalty, error: updateError } =
      await supabaseAdmin
        .from("penalties")
        .update({
          stripe_checkout_session_id: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", penalty.id)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

    if (updateError || !updatedPenalty) {
      console.error(
        "Unable to save penalty Checkout Session:",
        updateError,
      );

      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        console.error(
          "Unable to expire orphan Checkout Session:",
          expireError,
        );
      }

      return jsonResponse(
        {
          error:
            "Impossibile salvare la sessione di pagamento della penale.",
        },
        500,
      );
    }

    return jsonResponse({
      url: session.url,
      sessionId: session.id,
      reused: false,
    });
  } catch (error) {
    console.error("Penalty Checkout error:", error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Errore durante la creazione del pagamento.",
      },
      500,
    );
  }
});