import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { BookOpen } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  // Supabase will validate password correctness; don't enforce a client-side minimum length here.
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (isMounted && data.session) {
        navigate("/admin/dashboard", { replace: true });
      }
    }
    checkSession();
    return () => { isMounted = false; };
  }, [navigate]);

  const defaultValues = useMemo<LoginValues>(
    () => ({
      email: "",
      password: "",
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues,
    mode: "onSubmit",
  });

  async function onSubmit(values: LoginValues) {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Đăng nhập thất bại",
          description: "Thông tin đăng nhập không chính xác. Vui lòng thử lại.",
        });
        return;
      }

      toast({
        title: "Đăng nhập thành công",
        description: "Đang chuyển bạn đến Bảng điều khiển...",
      });

      navigate("/admin/dashboard", { replace: true });
    } catch {
      toast({
        variant: "destructive",
        title: "Có lỗi xảy ra",
        description: "Vui lòng thử lại sau.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] text-slate-900 font-sans px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[400px]">
        
        {/* Header / Logo */}
        <div className="mb-8 flex flex-col items-center justify-center">
          <div className="flex bg-[#2DA44E] text-white p-3 rounded-xl mb-6 shadow-sm">
            <BookOpen size={36} className="text-white" />
          </div>
          <h2 className="text-[24px] font-light tracking-tight text-[#1F2328]">
            Đăng nhập vào BookNest
          </h2>
        </div>

        {/* Login Form Card */}
        <div className="rounded-xl border border-[#d0d7de] bg-[#F6F8FA] p-4 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium text-[#1F2328] text-sm">
                Địa chỉ Email
              </Label>
              <Input
                id="email"
                type="email"
                className="h-8 bg-white border-[#d0d7de] text-[#1F2328] focus-visible:bg-white focus-visible:ring-[#0969da] focus-visible:border-[#0969da] rounded-md shadow-sm"
                disabled={isLoading}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-sm font-medium text-red-500">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-medium text-[#1F2328] text-sm">
                  Mật khẩu
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                className="h-8 bg-white border-[#d0d7de] text-[#1F2328] focus-visible:bg-white focus-visible:ring-[#0969da] focus-visible:border-[#0969da] rounded-md shadow-sm"
                disabled={isLoading}
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-sm font-medium text-red-500">{errors.password.message}</p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="mt-4 w-full h-8 bg-[#1f883d] hover:bg-[#1a7f37] text-white font-medium rounded-md shadow-sm border border-[rgba(31,35,40,0.15)] transition-colors focus:ring-4 focus:ring-[rgba(46,164,79,0.4)]"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>
        </div>

        {/* Footer Notes */}
        <div className="mt-4 rounded-xl border border-[#d0d7de] bg-white p-4 text-center text-sm text-[#1F2328]">
          <p>
            Nếu bạn quên mật khẩu vui lòng liên hệ quản trị viên lấy lại mật khẩu
          </p>
        </div>

      </div>
    </div>
  );
}
