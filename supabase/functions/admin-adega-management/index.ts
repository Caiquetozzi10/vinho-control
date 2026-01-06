import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-ADEGA-MANAGEMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not set");
    }

    // Get the authorization header to verify the calling user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create client with user's token to verify permissions
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // Get the calling user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized: Invalid user token");
    }
    logStep("User authenticated", { userId: user.id });

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Check if user has admin_geral permissions
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) throw rolesError;
    
    const isAdminGeral = roles?.some(r => r.role === 'admin_geral');

    if (!isAdminGeral) {
      throw new Error("Forbidden: Only admin_geral can manage adegas");
    }
    logStep("Admin permissions verified");

    const { action, ...params } = await req.json();
    logStep("Action received", { action });

    switch (action) {
      case "create_adega": {
        const { nome, email, telefone, endereco, status_pagamento, ativo, logo_url, plano, is_trial, trial_expires_at } = params;

        if (!nome) {
          throw new Error("Missing required field: nome");
        }

        const adegaData = {
          nome,
          email: email || null,
          telefone: telefone || null,
          endereco: endereco || null,
          status_pagamento: status_pagamento || 'aguardando',
          ativo: ativo !== undefined ? ativo : true,
          logo_url: logo_url || null,
          plano: plano || 'prata',
          is_trial: is_trial || false,
          trial_expires_at: trial_expires_at || null,
        };

        const { data, error } = await supabaseAdmin
          .from("adegas")
          .insert([adegaData])
          .select()
          .single();

        if (error) throw error;

        logStep("Adega created", { adegaId: data.id });
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "update_adega": {
        const { adegaId, nome, email, telefone, endereco, status_pagamento, ativo, logo_url, plano, is_trial, trial_expires_at } = params;

        if (!adegaId) {
          throw new Error("Missing required field: adegaId");
        }

        const updateData: Record<string, any> = {};
        if (nome !== undefined) updateData.nome = nome;
        if (email !== undefined) updateData.email = email || null;
        if (telefone !== undefined) updateData.telefone = telefone || null;
        if (endereco !== undefined) updateData.endereco = endereco || null;
        if (status_pagamento !== undefined) updateData.status_pagamento = status_pagamento;
        if (ativo !== undefined) updateData.ativo = ativo;
        if (logo_url !== undefined) updateData.logo_url = logo_url || null;
        if (plano !== undefined) updateData.plano = plano;
        if (is_trial !== undefined) updateData.is_trial = is_trial;
        if (trial_expires_at !== undefined) updateData.trial_expires_at = trial_expires_at;

        const { data, error } = await supabaseAdmin
          .from("adegas")
          .update(updateData)
          .eq("id", adegaId)
          .select()
          .single();

        if (error) throw error;

        logStep("Adega updated", { adegaId });
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "list_adegas": {
        const { data, error } = await supabaseAdmin
          .from("adegas")
          .select("*")
          .order("nome");

        if (error) throw error;

        logStep("Adegas listed", { count: data?.length });
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    const status = errorMessage.includes("Unauthorized") ? 401 
                 : errorMessage.includes("Forbidden") ? 403 
                 : 500;
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
