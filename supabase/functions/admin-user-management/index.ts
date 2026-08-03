import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-USER-MANAGEMENT] ${step}${detailsStr}`);
};

// Usuários acessam o sistema por "nome.sobrenome"; o e-mail é apenas informativo.
const USERNAME_EMAIL_DOMAIN = "adegastock.local";

const normalizeUsername = (raw: string): string => {
  const normalized = String(raw)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");

  if (normalized.length < 3) {
    throw new Error("Usuário inválido: use o formato nome.sobrenome");
  }
  return normalized;
};

const usernameToAuthEmail = (username: string) => `${username}@${USERNAME_EMAIL_DOMAIN}`;


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

    // Check if user has admin permissions (admin_geral or gerente_adega)
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role, adega_id")
      .eq("user_id", user.id);

    if (rolesError) throw rolesError;
    
    const isAdminGeral = roles?.some(r => r.role === 'admin_geral');
    const isGerenteAdega = roles?.some(r => r.role === 'gerente_adega');
    const userAdegaId = roles?.find(r => r.adega_id)?.adega_id;

    if (!isAdminGeral && !isGerenteAdega) {
      throw new Error("Forbidden: Insufficient permissions");
    }
    logStep("Permissions verified", { isAdminGeral, isGerenteAdega, userAdegaId });

    const { action, ...params } = await req.json();
    logStep("Action received", { action });

    switch (action) {
      case "reset_password": {
        const { userId, newPassword } = params;
        
        if (!userId || !newPassword) {
          throw new Error("Missing required fields: userId, newPassword");
        }

        if (newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        // If not admin_geral, verify the target user belongs to their adega
        if (!isAdminGeral) {
          const { data: targetProfile } = await supabaseAdmin
            .from("profiles")
            .select("adega_id")
            .eq("id", userId)
            .single();

          if (targetProfile?.adega_id !== userAdegaId) {
            throw new Error("Forbidden: Cannot modify users from other adegas");
          }
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: newPassword
        });

        if (error) throw error;

        logStep("Password reset successful", { targetUserId: userId });
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "create_user": {
        const { email, username, password, nomeCompleto, telefone, adegaId, role } = params;

        if (!username || !password || !nomeCompleto || !role) {
          throw new Error("Missing required fields");
        }

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        const normalizedUsername = normalizeUsername(username);
        const authEmail = usernameToAuthEmail(normalizedUsername);

        // Validate role
        const validRoles = ['admin_geral', 'gerente_adega', 'operador'];
        if (!validRoles.includes(role)) {
          throw new Error("Invalid role");
        }

        // Only admin_geral can create admin_geral users
        if (role === 'admin_geral' && !isAdminGeral) {
          throw new Error("Forbidden: Only admin_geral can create admin_geral users");
        }

        // If gerente_adega, can only create users for their own adega
        if (!isAdminGeral && adegaId !== userAdegaId) {
          throw new Error("Forbidden: Cannot create users for other adegas");
        }

        // Username must be unique
        const { data: existingUsername } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .ilike("username", normalizedUsername)
          .maybeSingle();

        if (existingUsername) {
          throw new Error(`O usuário "${normalizedUsername}" já está em uso`);
        }

        // Create auth user (login is username-based; the email is only informative)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: authEmail,
          password,
          email_confirm: true,
          user_metadata: { nome_completo: nomeCompleto, username: normalizedUsername }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create user");

        logStep("User created", { newUserId: authData.user.id, username: normalizedUsername });

        // Update profile
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({
            nome_completo: nomeCompleto,
            username: normalizedUsername,
            email: email || authEmail,
            telefone: telefone || null,
            adega_id: adegaId || null,
          })
          .eq("id", authData.user.id);

        if (profileError) {
          logStep("Profile update error", { error: profileError });
        }


        // Create role
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: role,
            adega_id: adegaId || null,
          });

        if (roleError) {
          logStep("Role creation error", { error: roleError });
        }

        logStep("User creation completed", { newUserId: authData.user.id });
        return new Response(JSON.stringify({ success: true, userId: authData.user.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "toggle_user_status": {
        const { userId, ativo } = params;
        
        if (!userId || ativo === undefined) {
          throw new Error("Missing required fields: userId, ativo");
        }

        // If not admin_geral, verify the target user belongs to their adega
        if (!isAdminGeral) {
          const { data: targetProfile } = await supabaseAdmin
            .from("profiles")
            .select("adega_id")
            .eq("id", userId)
            .single();

          if (targetProfile?.adega_id !== userAdegaId) {
            throw new Error("Forbidden: Cannot modify users from other adegas");
          }
        }

        // Update profile status
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({ ativo })
          .eq("id", userId);

        if (profileError) throw profileError;

        // If blocking user, also sign them out globally
        if (!ativo) {
          await supabaseAdmin.auth.admin.signOut(userId, 'global');
          logStep("User signed out globally", { targetUserId: userId });
        }

        logStep("User status updated", { targetUserId: userId, ativo });
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "update_user": {
        const { userId, nomeCompleto, telefone, adegaId, role, ativo, username, email } = params;


        if (!userId) {
          throw new Error("Missing required field: userId");
        }

        // Validate role if provided
        if (role) {
          const validRoles = ['admin_geral', 'gerente_adega', 'operador'];
          if (!validRoles.includes(role)) {
            throw new Error("Invalid role");
          }

          // Only admin_geral can assign admin_geral role
          if (role === 'admin_geral' && !isAdminGeral) {
            throw new Error("Forbidden: Only admin_geral can assign admin_geral role");
          }
        }

        // If not admin_geral, verify the target user belongs to their adega
        if (!isAdminGeral) {
          const { data: targetProfile } = await supabaseAdmin
            .from("profiles")
            .select("adega_id")
            .eq("id", userId)
            .single();

          if (targetProfile?.adega_id !== userAdegaId) {
            throw new Error("Forbidden: Cannot modify users from other adegas");
          }

          // Gerente can only assign users to their own adega
          if (adegaId && adegaId !== userAdegaId) {
            throw new Error("Forbidden: Cannot assign users to other adegas");
          }
        }

        // Update login username (also updates the internal auth email)
        let normalizedUsername: string | null = null;
        if (username) {
          normalizedUsername = normalizeUsername(username);

          const { data: existingUsername } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .ilike("username", normalizedUsername)
            .neq("id", userId)
            .maybeSingle();

          if (existingUsername) {
            throw new Error(`O usuário "${normalizedUsername}" já está em uso`);
          }

          const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email: usernameToAuthEmail(normalizedUsername),
            email_confirm: true,
            user_metadata: { username: normalizedUsername },
          });

          if (authUpdateError) throw authUpdateError;
        }

        // Update profile
        const profileUpdateData: Record<string, any> = {};
        if (nomeCompleto !== undefined) profileUpdateData.nome_completo = nomeCompleto;
        if (telefone !== undefined) profileUpdateData.telefone = telefone || null;
        if (adegaId !== undefined) profileUpdateData.adega_id = adegaId || null;
        if (ativo !== undefined) profileUpdateData.ativo = ativo;
        if (email) profileUpdateData.email = email;
        if (normalizedUsername) profileUpdateData.username = normalizedUsername;


        if (Object.keys(profileUpdateData).length > 0) {
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update(profileUpdateData)
            .eq("id", userId);

          if (profileError) throw profileError;
          logStep("Profile updated", { userId, updates: profileUpdateData });
        }

        // Update role if provided
        if (role) {
          // Delete existing roles
          const { error: deleteError } = await supabaseAdmin
            .from("user_roles")
            .delete()
            .eq("user_id", userId);

          if (deleteError) {
            logStep("Error deleting existing roles", { error: deleteError });
          }

          // Insert new role
          const { error: roleError } = await supabaseAdmin
            .from("user_roles")
            .insert({
              user_id: userId,
              role: role,
              adega_id: adegaId || null,
            });

          if (roleError) throw roleError;
          logStep("Role updated", { userId, role });
        }

        // If user is being blocked, sign them out
        if (ativo === false) {
          await supabaseAdmin.auth.admin.signOut(userId, 'global');
          logStep("User signed out globally", { targetUserId: userId });
        }

        logStep("User update completed", { userId });
        return new Response(JSON.stringify({ success: true }), {
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
