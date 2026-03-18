import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { BookOpen } from "lucide-react";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

function LoadingScreen() {
  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center px-4">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-[#2DA44E] text-white shadow-sm">
          <BookOpen size={32} />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          <span className="text-sm text-slate-700">Đang kiểm tra đăng nhập...</span>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasSession, setHasSession] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function check() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (!isMounted) return;
          setHasSession(false);
          return;
        }

        if (!isMounted) return;
        setHasSession(Boolean(data.session));
      } finally {
        if (!isMounted) return;
        setIsChecking(false);
      }
    }

    check();

    // Keep state in sync if session changes in another tab
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setHasSession(Boolean(session));
      setIsChecking(false);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (isChecking) return <LoadingScreen />;

  if (!hasSession) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
