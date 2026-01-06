import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { encode as encodeBase64 } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Simple password encryption using base64 + XOR (for temporary storage only)
function encryptPassword(password: string, key: string): string {
  const keyBytes = new TextEncoder().encode(key);
  const passwordBytes = new TextEncoder().encode(password);
  const encrypted = new Uint8Array(passwordBytes.length);
  for (let i = 0; i < passwordBytes.length; i++) {
    encrypted[i] = passwordBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return encodeBase64(encrypted.buffer);
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
    
    logStep("Keys verified");

    const { priceId, nomeAdega, nomeCompleto, email, password } = await req.json();
    logStep("Request data received", { priceId, nomeAdega, email });

    // Input validation
    if (!priceId || !email || !nomeCompleto || !password || !nomeAdega) {
      throw new Error("Missing required fields");
    }

    if (nomeCompleto.length > 100) throw new Error("Nome muito longo (máx 100 caracteres)");
    if (nomeAdega.length > 100) throw new Error("Nome da adega muito longo (máx 100 caracteres)");
    if (email.length > 255) throw new Error("Email muito longo (máx 255 caracteres)");
    if (password.length < 6) throw new Error("Senha deve ter no mínimo 6 caracteres");
    if (password.length > 72) throw new Error("Senha muito longa (máx 72 caracteres)");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Encrypt password for temporary storage
    const encryptionKey = supabaseServiceKey.substring(0, 32);
    const encryptedPassword = encryptPassword(password, encryptionKey);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/cadastro-sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/signup`,
      metadata: {
        nome_adega: nomeAdega,
        nome_completo: nomeCompleto,
        email: email,
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Store registration data temporarily in pending_registrations table
    const { data: pendingData, error: pendingError } = await supabase
      .from('pending_registrations')
      .insert({
        session_id: session.id,
        email: email,
        nome_completo: nomeCompleto,
        nome_adega: nomeAdega,
        password_hash: encryptedPassword,
      })
      .select('token')
      .single();

    if (pendingError) {
      logStep("Error storing pending registration", { error: pendingError });
      throw new Error("Failed to store registration data");
    }

    logStep("Pending registration stored", { token: pendingData.token });

    return new Response(JSON.stringify({ url: session.url }), {
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
