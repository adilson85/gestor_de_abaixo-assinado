"use client";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";

const PUBLIC_PREFIXES = ["/login", "/a", "/api/public", "/privacy"];

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirected = useRef(false);

  const isPublic = PUBLIC_PREFIXES.some((p) => 
    location.pathname === p || location.pathname.startsWith(p + "/")
  );

  useEffect(() => {
    if (loading || redirected.current) return;
    
    // Se não está logado e não é rota pública
    if (!isPublic && !user) {
      redirected.current = true;
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    
    // Se está logado mas não é admin e não é rota pública
    if (!isPublic && user && !isAdmin) {
      redirected.current = true;
      navigate(`/login?error=access_denied`);
      return;
    }
    
    // Se está logado como admin e está na página de login
    if (user && isAdmin && location.pathname === '/login') {
      redirected.current = true;
      navigate('/dashboard');
      return;
    }
  }, [loading, user, isAdmin, isPublic, location.pathname, navigate]);

  return <>{children}</>;
}
