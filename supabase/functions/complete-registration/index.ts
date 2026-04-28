import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { decode as decodeBase64 } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COMPLETE-REGISTRATION] ${step}${detailsStr}`);
};

// Decrypt password from temporary storage (AES-GCM)
async function decryptPassword(encrypted: string, keyMaterial: string): Promise<string> {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const keyHash = await crypto.subtle.digest("SHA-256", enc.encode(keyMaterial));
  const key = await crypto.subtle.importKey(
    "raw",
    keyHash,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  const combined = new Uint8Array(decodeBase64(encrypted));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return dec.decode(plaintext);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase credentials not set");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { sessionId } = await req.json();
    logStep("Request data received", { sessionId });

    if (!sessionId) {
      throw new Error("Missing sessionId");
    }

    // Retrieve pending registration data
    const { data: pendingData, error: pendingError } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (pendingError || !pendingData) {
      logStep("Pending registration not found or expired", { error: pendingError });
      throw new Error("Registration data not found or expired. Please try again.");
    }

    logStep("Pending registration found", { email: pendingData.email });

    // Decrypt password
    const encryptionKey = supabaseServiceKey.substring(0, 32);
    const password = decryptPassword(pendingData.password_hash, encryptionKey);

    // Verify payment with Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }
    logStep("Payment verified", { paymentStatus: session.payment_status });

    // Determine plan based on price
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    const priceId = subscription.items.data[0].price.id;
    
    const isGoldPlan = priceId === "price_1SdMCI056ZndHVpeLiqbs6mU";
    const plano = isGoldPlan ? 'ouro' : 'prata';
    logStep("Plan determined", { priceId, plano });

    // Get customer ID from session
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    // Create the adega first
    const { data: adegaData, error: adegaError } = await supabase
      .from('adegas')
      .insert({
        nome: pendingData.nome_adega,
        status_pagamento: 'ativo',
        data_ultimo_pagamento: new Date().toISOString(),
        plano: plano,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
      })
      .select()
      .single();

    if (adegaError) {
      logStep("Error creating adega", { error: adegaError });
      throw new Error(`Failed to create adega: ${adegaError.message}`);
    }
    logStep("Adega created", { adegaId: adegaData.id });

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: pendingData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nome_completo: pendingData.nome_completo,
      }
    });

    if (authError) {
      // Rollback adega creation
      await supabase.from('adegas').delete().eq('id', adegaData.id);
      logStep("Error creating user, rolled back adega", { error: authError });
      throw new Error(`Failed to create user: ${authError.message}`);
    }
    logStep("User created", { userId: authData.user.id });

    // Update profile with adega_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ adega_id: adegaData.id })
      .eq('id', authData.user.id);

    if (profileError) {
      logStep("Error updating profile", { error: profileError });
    }

    // Create user role as gerente_adega
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'gerente_adega',
        adega_id: adegaData.id,
      });

    if (roleError) {
      logStep("Error creating user role", { error: roleError });
    }

    // Mark pending registration as used
    await supabase
      .from('pending_registrations')
      .update({ used: true })
      .eq('id', pendingData.id);

    logStep("Registration completed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      userId: authData.user.id,
      adegaId: adegaData.id,
      plan: isGoldPlan ? 'ouro' : 'prata'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
