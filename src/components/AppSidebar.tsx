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
  Tags,
  Crown,
  CreditCard,
  TrendingUp
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useAdegaPlan } from "@/hooks/useAdegaPlan";
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
import { Badge } from "@/components/ui/badge";

type AdegaInfo = {
  nome: string;
  logo_url: string | null;
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { role, adegaId } = useUserRole();
  const { signOut } = useAuth();
  const { plano, isLoading: planLoading } = useAdegaPlan();
  const currentPath = location.pathname;
  const [adegaInfo, setAdegaInfo] = useState<AdegaInfo | null>(null);
  
  const isCollapsed = state === "collapsed";
  const isAdminGeral = role === 'admin_geral';

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

  // Escutar evento de atualização de logo
  useEffect(() => {
    const handleLogoUpdate = (event: CustomEvent<{ logoUrl: string | null }>) => {
      setAdegaInfo(prev => prev ? { ...prev, logo_url: event.detail.logoUrl } : null);
    };

    window.addEventListener('logo-updated', handleLogoUpdate as EventListener);
    return () => {
      window.removeEventListener('logo-updated', handleLogoUpdate as EventListener);
    };
  }, []);

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

    // Add Ticket Médio for Ouro plan (premium feature)
    if (plano === 'ouro' && !isAdminGeral) {
      lojaItems.push({ title: "Ticket Médio", url: "/ticket-medio", icon: TrendingUp });
    }

    lojaItems.push({ title: "Assinatura", url: "/assinatura", icon: CreditCard });

    if (role === "operador") return baseItems;
    if (role === "gerente_adega") return lojaItems;
    return lojaItems;
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
        {/* Logo - Maior no topo */}
        <div className="px-4 py-6 border-b border-sidebar-border">
          <div className="flex items-center justify-center">
            {displayLogo ? (
              <img 
                src={displayLogo} 
                alt={displayName}
                className={`rounded-lg object-contain ${isCollapsed ? 'h-10 w-10' : 'h-16 w-full max-w-[180px]'}`}
              />
            ) : (
              <Wine className={`text-primary ${isCollapsed ? 'h-8 w-8' : 'h-12 w-12'}`} />
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

      {/* Footer com Nome da Adega, Plano e Logout */}
      <SidebarFooter className="border-t border-sidebar-border">
        {/* Nome da Adega e Plano */}
        {!isCollapsed && (
          <div className="px-3 py-3 border-b border-sidebar-border">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground truncate">
                {displayName}
              </span>
              {!isAdminGeral && !planLoading && (
                <Badge 
                  variant="outline" 
                  className={`text-xs w-fit ${plano === 'ouro' ? 'border-gold text-gold' : 'border-silver text-silver'}`}
                >
                  <Crown className="w-3 h-3 mr-1" />
                  {plano === 'ouro' ? 'Ouro' : 'Prata'}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Logout */}
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
