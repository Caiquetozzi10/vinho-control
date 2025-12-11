import { useEffect, useState } from "react";
import { 
  Home, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Building2, 
  Users, 
  LogOut,
  Wine,
  Tags
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

type AdegaInfo = {
  nome: string;
  logo_url: string | null;
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { role, adegaId } = useUserRole();
  const { signOut } = useAuth();
  const currentPath = location.pathname;
  const [adegaInfo, setAdegaInfo] = useState<AdegaInfo | null>(null);
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  useEffect(() => {
    const fetchAdegaInfo = async () => {
      if (!adegaId) return;

      try {
        const { data, error } = await supabase
          .from("adegas")
          .select("nome, logo_url")
          .eq("id", adegaId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setAdegaInfo(data);
        }
      } catch (error) {
        console.error("Erro ao buscar informações da adega:", error);
      }
    };

    fetchAdegaInfo();
  }, [adegaId]);

  // Itens disponíveis para cada perfil
  const getMainItems = () => {
    const baseItems = [
      { title: "Vendas", url: "/vendas", icon: ShoppingCart },
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
    ];

    const lojaItems = [
      { title: "Dashboard", url: "/", icon: Home },
      { title: "Produtos", url: "/produtos", icon: Package },
      { title: "Categorias", url: "/categorias", icon: Tags },
      ...baseItems,
    ];

    if (role === "operador") return baseItems;
    if (role === "gerente_adega") return lojaItems; // Admin Loja
    return lojaItems; // Admin Geral
  };

  const mainItems = getMainItems();

  const adminItems = [
    { title: "Adegas", url: "/admin/adegas", icon: Building2 },
    { title: "Usuários", url: "/admin/usuarios", icon: Users },
  ];

  // Determinar o nome e logo a exibir
  const displayName = adegaInfo?.nome || "AdegaStock";
  const displayLogo = adegaInfo?.logo_url;

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"}>
      <SidebarContent>
        {/* Logo */}
        <div className="px-4 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            {displayLogo ? (
              <img 
                src={displayLogo} 
                alt={displayName}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <Wine className="h-6 w-6 text-primary" />
            )}
            {!isCollapsed && (
              <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                {displayName}
              </span>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent transition-base"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation */}
        {role === "admin_geral" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent transition-base"
                        activeClassName="bg-sidebar-accent text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer with Logout */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-sidebar-accent transition-base"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span>Sair</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
