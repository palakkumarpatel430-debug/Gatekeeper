import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function findUserByCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  return data?.id ?? null;
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // ── Payment completed: activate premium ──────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, planName } = session.metadata!;
    const customerId = session.customer as string;

    let planExpiresAt: string | null = null;
    if (session.subscription) {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      planExpiresAt = new Date(sub.current_period_end * 1000).toISOString();
    }

    await supabase.from("profiles").upsert({
      id: userId,
      premium: true,
      plan: planName,
      stripe_customer_id: customerId,
      plan_expires_at: planExpiresAt,
    });
  }

  // ── Subscription renewed: extend expiry ──────────────────────────────────
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    if (invoice.subscription) {
      const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const userId = await findUserByCustomer(sub.customer as string);
      if (userId) {
        await supabase.from("profiles").update({
          premium: true,
          plan_expires_at: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq("id", userId);
      }
    }
  }

  // ── Subscription cancelled or past due: revoke access ────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = await findUserByCustomer(sub.customer as string);
    if (userId) {
      await supabase.from("profiles").update({
        premium: false,
        plan_expires_at: new Date().toISOString(),
      }).eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    if (["past_due", "canceled", "unpaid", "paused"].includes(sub.status)) {
      const userId = await findUserByCustomer(sub.customer as string);
      if (userId) {
        await supabase.from("profiles").update({
          premium: false,
          plan_expires_at: new Date().toISOString(),
        }).eq("id", userId);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
