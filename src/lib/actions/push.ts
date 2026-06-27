"use server";

import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function guardarSuscripcionPush(sub: PushSubscriptionInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(sub, { onConflict: "endpoint" });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function eliminarSuscripcionPush(endpoint: string) {
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return { ok: true as const };
}

export async function enviarPushATodos(title: string, body: string, url = "/") {
  const supabase = await createClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (!subs?.length) return { ok: true as const, sent: 0 };

  let sent = 0;
  const toDelete: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, url })
        );
        sent++;
      } catch (err: unknown) {
        const code =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode: number }).statusCode
            : 0;
        if (code === 404 || code === 410) toDelete.push(sub.endpoint);
      }
    })
  );

  if (toDelete.length) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", toDelete);
  }

  return { ok: true as const, sent };
}
