import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SERVICE_ROLE_KEY");
}

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

    const accessToken = authorization.replace("Bearer ", "").trim();

    const {
      data: { user: authenticatedUser },
      error: authenticationError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authenticationError || !authenticatedUser) {
      console.error(
        "Admin users authentication error:",
        authenticationError,
      );

      return jsonResponse(
        {
          error: "Invalid authentication",
        },
        401,
      );
    }

    const { data: adminProfile, error: adminProfileError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, is_admin")
        .eq("id", authenticatedUser.id)
        .single();

    if (
      adminProfileError ||
      !adminProfile ||
      adminProfile.is_admin !== true
    ) {
      console.error(
        "Admin users authorization error:",
        adminProfileError,
      );

      return jsonResponse(
        {
          error: "Access denied",
        },
        403,
      );
    }

    const allAuthUsers = [];
    const perPage = 1000;
    let page = 1;

    while (true) {
      const {
        data: authUsersResult,
        error: authUsersError,
      } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (authUsersError) {
        console.error("Auth users lookup error:", authUsersError);

        return jsonResponse(
          {
            error: authUsersError.message,
          },
          500,
        );
      }

      const currentUsers = authUsersResult.users ?? [];

      allAuthUsers.push(...currentUsers);

      if (currentUsers.length < perPage) {
        break;
      }

      page += 1;

      if (page > 20) {
        console.warn(
          "Admin users list stopped after 20,000 users.",
        );
        break;
      }
    }

    const userIds = allAuthUsers.map((user) => user.id);

    if (userIds.length === 0) {
      return jsonResponse({
        users: [],
        total: 0,
      });
    }

    const [
      profilesResult,
      penaltiesResult,
      requestsResult,
      applicationsResult,
      reviewsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select(
          `
            id,
            full_name,
            phone,
            role,
            city,
            postal_code,
            verified,
            is_admin,
            created_at,
            stripe_account_id,
            stripe_onboarding_completed,
            stripe_payouts_enabled,
            stripe_charges_enabled
          `,
        )
        .in("id", userIds),

      supabaseAdmin
        .from("penalties")
        .select("user_id, amount, status")
        .in("user_id", userIds),

      supabaseAdmin
        .from("requests")
        .select(
          `
            id,
            seeker_id,
            helper_id,
            category,
            title,
            city,
            reward,
            status,
            request_date,
            created_at
          `,
        )
        .or(
          `seeker_id.in.(${userIds.join(",")}),helper_id.in.(${userIds.join(",")})`,
        ),

      supabaseAdmin
        .from("request_applications")
        .select("helper_id, status")
        .in("helper_id", userIds),

      supabaseAdmin
        .from("reviews")
        .select("reviewed_user_id, rating")
        .in("reviewed_user_id", userIds),
    ]);

    if (profilesResult.error) {
      throw profilesResult.error;
    }

    if (penaltiesResult.error) {
      throw penaltiesResult.error;
    }

    if (requestsResult.error) {
      throw requestsResult.error;
    }

    if (applicationsResult.error) {
      throw applicationsResult.error;
    }

    if (reviewsResult.error) {
      throw reviewsResult.error;
    }

    const profilesMap = new Map(
      (profilesResult.data ?? []).map((profile) => [
        profile.id,
        profile,
      ]),
    );

    const users = allAuthUsers.map((authUser) => {
      const profile = profilesMap.get(authUser.id);

      const userPenalties = (penaltiesResult.data ?? []).filter(
        (penalty) => penalty.user_id === authUser.id,
      );

      const pendingPenalties = userPenalties.filter(
        (penalty) => penalty.status === "pending",
      );

      const pendingPenaltyAmount = pendingPenalties.reduce(
        (sum, penalty) => sum + Number(penalty.amount ?? 0),
        0,
      );

      const publishedRequests = (
        requestsResult.data ?? []
      )
        .filter(
          (request) => request.seeker_id === authUser.id,
        )
        .sort((first, second) => {
          const firstDate = new Date(
            first.created_at ?? 0,
          ).getTime();
      
          const secondDate = new Date(
            second.created_at ?? 0,
          ).getTime();
      
          return secondDate - firstDate;
        });
      
      const publishedRequestHistory = publishedRequests
        .slice(0, 10)
        .map((request) => ({
          id: request.id,
          category: request.category ?? null,
          title: request.title ?? null,
          city: request.city ?? null,
          reward: Number(request.reward ?? 0),
          status: request.status ?? null,
          requestDate: request.request_date ?? null,
          createdAt: request.created_at ?? null,
        }));

      const completedActivities = (
        requestsResult.data ?? []
      ).filter(
        (request) =>
          request.helper_id === authUser.id &&
          request.status === "completata",
      );

      const applications = (
        applicationsResult.data ?? []
      ).filter(
        (application) =>
          application.helper_id === authUser.id,
      );

      const reviews = (reviewsResult.data ?? []).filter(
        (review) => review.reviewed_user_id === authUser.id,
      );

      const averageRating =
        reviews.length > 0
          ? Number(
              (
                reviews.reduce(
                  (sum, review) =>
                    sum + Number(review.rating ?? 0),
                  0,
                ) / reviews.length
              ).toFixed(2),
            )
          : null;

      return {
        id: authUser.id,
        email: authUser.email ?? null,
        emailConfirmedAt: authUser.email_confirmed_at ?? null,
        lastSignInAt: authUser.last_sign_in_at ?? null,
        authCreatedAt: authUser.created_at,
        bannedUntil: authUser.banned_until ?? null,

        fullName: profile?.full_name ?? null,
        phone: profile?.phone ?? null,
        role: profile?.role ?? null,
        city: profile?.city ?? null,
        postalCode: profile?.postal_code ?? null,
        verified: Boolean(profile?.verified),
        isAdmin: Boolean(profile?.is_admin),
        profileCreatedAt: profile?.created_at ?? null,

        stripeAccountId: profile?.stripe_account_id ?? null,
        stripeOnboardingCompleted: Boolean(
          profile?.stripe_onboarding_completed,
        ),
        stripePayoutsEnabled: Boolean(
          profile?.stripe_payouts_enabled,
        ),
        stripeChargesEnabled: Boolean(
          profile?.stripe_charges_enabled,
        ),

        pendingPenalties: pendingPenalties.length,
        pendingPenaltyAmount: Number(
          pendingPenaltyAmount.toFixed(2),
        ),

        publishedRequests: publishedRequests.length,
        publishedRequestHistory,
        completedActivities: completedActivities.length,
        applications: applications.length,
        reviews: reviews.length,
        averageRating,
      };
    });

    users.sort((first, second) => {
      const firstDate = new Date(
        first.authCreatedAt ?? 0,
      ).getTime();

      const secondDate = new Date(
        second.authCreatedAt ?? 0,
      ).getTime();

      return secondDate - firstDate;
    });

    return jsonResponse({
      users,
      total: users.length,
    });
  } catch (error) {
    console.error("Admin users list error:", error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Errore durante il caricamento degli utenti.",
      },
      500,
    );
  }
});