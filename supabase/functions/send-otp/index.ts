// supabase/functions/send-otp/index.ts
// Supabase Edge Function — generates OTP, stores it in DB, sends via Twilio SMS

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, user_id } = await req.json();

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!phone || !user_id) {
      return new Response(
        JSON.stringify({ error: "phone and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalise phone: strip spaces/dashes, ensure E.164 format
    const normalised = phone.replace(/[\s\-]/g, "");
    if (!/^\+[1-9]\d{6,14}$/.test(normalised)) {
      return new Response(
        JSON.stringify({ error: "Phone must be in E.164 format e.g. +919876543210" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Rate-limit: max 3 OTPs per phone per 10 minutes ──────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("otp_verifications")
      .select("id", { count: "exact", head: true })
      .eq("phone", normalised)
      .gte("created_at", tenMinutesAgo);

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please wait 10 minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Generate 6-digit OTP ─────────────────────────────────────────────────
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min TTL

    // ── Store OTP in DB ──────────────────────────────────────────────────────
    const { error: dbError } = await supabase.from("otp_verifications").insert({
      user_id,
      phone: normalised,
      otp_code: otp,
      expires_at: expiresAt,
      verified: false,
    });

    if (dbError) throw new Error("DB insert failed: " + dbError.message);

    // ── Send SMS via Twilio ──────────────────────────────────────────────────
    const twilioSid    = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const twilioToken  = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const twilioFrom   = Deno.env.get("TWILIO_PHONE_NUMBER")!; // e.g. +15005550006

    const twilioBody = new URLSearchParams({
      To:   normalised,
      From: twilioFrom,
      Body: `Your VolunteerBridge verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
    });

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: twilioBody.toString(),
      }
    );

    if (!twilioRes.ok) {
      const twilioErr = await twilioRes.json();
      console.error("Twilio error:", twilioErr);
      throw new Error(`Twilio error ${twilioRes.status}: ${twilioErr.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent via SMS" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("send-otp error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
