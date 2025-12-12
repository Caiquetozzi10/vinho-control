import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import CadastroSucesso from "./pages/CadastroSucesso";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Vendas from "./pages/Vendas";
import Relatorios from "./pages/Relatorios";
import Categorias from "./pages/Categorias";
import Adegas from "./pages/admin/Adegas";
import Usuarios from "./pages/admin/Usuarios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/cadastro-sucesso" element={<CadastroSucesso />} />
          <Route path="/login" element={<Login />} />
          {/* Rotas apenas para Admin */}
          <Route
            path="/"
            element={
              <ProtectedRoute adminOnly>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/produtos"
            element={
              <ProtectedRoute adminOnly>
                <DashboardLayout>
                  <Produtos />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/categorias"
            element={
              <ProtectedRoute adminOnly>
                <DashboardLayout>
                  <Categorias />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* Rotas para todos os usuários */}
          <Route
            path="/vendas"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Vendas />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Relatorios />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* Rotas de Administração (Admin Geral) */}
          <Route
            path="/admin/adegas"
            element={
              <ProtectedRoute adminOnly>
                <DashboardLayout>
                  <Adegas />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute adminOnly>
                <DashboardLayout>
                  <Usuarios />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;