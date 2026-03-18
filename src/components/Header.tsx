import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/Sidebar";
import {
  Bell,
  MagnifyingGlass,
  Moon,
  Sun,
  User,
  Gear,
  SignOut,
  CaretRight,
} from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface HeaderProps {
  onMenuClick: () => void;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Trang chủ", href: "/admin/dashboard" },
  { label: "Tổng quan" },
];

export function Header({ onMenuClick }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationCount] = useState(5);
  const [userEmail, setUserEmail] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (isMounted && data?.user?.email) {
        setUserEmail(data.user.email);
      }
    }
    fetchUser();
    return () => { isMounted = false; };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm lg:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <SidebarTrigger onClick={onMenuClick} />

        {/* Breadcrumbs */}
        <nav className="hidden items-center gap-1.5 text-sm md:flex">
          {breadcrumbs.map((item, index) => (
            <div key={item.label} className="flex items-center gap-1.5">
              {index > 0 && (
                <CaretRight className="h-3.5 w-3.5 text-slate-400" />
              )}
              {item.href ? (
                <Link
                  to={item.href}
                  className="text-slate-500 transition-colors hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-slate-900">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Center Section - Search */}
      <div className="hidden max-w-md flex-1 px-8 lg:block">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Tìm sách, phiếu mượn, hội viên..."
            className="h-10 w-full rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 text-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-400 focus:bg-white focus:ring-amber-400/20"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Mobile Search */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <MagnifyingGlass className="h-5 w-5" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl p-2">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-sm font-semibold text-slate-900">
                Thông báo
              </span>
              <Badge variant="secondary" className="rounded-full text-xs">
                {notificationCount} mới
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto">
              {[
                {
                  title: "Đơn mới #1234",
                  message: "Có một đơn mua sách mới vừa được tạo",
                  time: "2 phút trước",
                },
                {
                  title: "Cảnh báo sắp hết sách",
                  message: '"The Great Gatsby" sắp hết hàng',
                  time: "1 giờ trước",
                },
                {
                  title: "Đăng ký hội viên",
                  message: "John Doe vừa đăng ký",
                  time: "3 giờ trước",
                },
              ].map((notification, index) => (
                <DropdownMenuItem
                  key={index}
                  className="flex cursor-pointer flex-col items-start gap-1 rounded-lg p-3"
                >
                  <span className="text-sm font-medium text-slate-900">
                    {notification.title}
                  </span>
                  <span className="text-xs text-slate-500">
                    {notification.message}
                  </span>
                  <span className="text-xs text-slate-400">
                    {notification.time}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center rounded-lg text-amber-600 hover:text-amber-700">
              Xem tất cả thông báo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="ml-2 flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100"
            >
              <Avatar size="sm">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
                <AvatarFallback className="bg-amber-500 text-white text-xs">
                  {userEmail ? userEmail[0].toUpperCase() : "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-slate-900">{userEmail || "Quản trị viên"}</p>
                <p className="text-xs text-slate-500">Toàn quyền</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
            <div className="mb-2 px-2 py-1.5">
              <p className="text-sm font-medium text-slate-900">{userEmail || "Quản trị viên"}</p>
              <p className="text-xs text-slate-500">{userEmail || "admin@booknest.com"}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg">
              <User className="h-4 w-4" />
              <span>Hồ sơ</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg">
              <Gear className="h-4 w-4" />
              <span>Cài đặt</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer gap-2 rounded-lg"
              onClick={handleLogout}
            >
              <SignOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
