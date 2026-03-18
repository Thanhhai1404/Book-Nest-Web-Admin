import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Books,
  ChartLineUp,
  House,
  Package,
  Users,
  UserCircle,
  Barcode,
  CaretDown,
  List,
  X,
} from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    label: "Tổng quan",
    icon: House,
    href: "/admin/dashboard",
    badge: null as number | null,
  },
  {
    label: "Kho sách",
    icon: Books,
    href: "/admin/inventory",
    badge: null,
  },
  {
    label: "Phiếu mượn",
    icon: Package,
    href: "/admin/orders",
    badge: 3,
  },
  {
    label: "Hội viên",
    icon: Users,
    href: "/admin/members",
    badge: null,
  },
  {
    label: "Nhân viên",
    icon: UserCircle,
    href: "/admin/staff",
    badge: null,
  },
  {
    label: "Báo cáo",
    icon: ChartLineUp,
    href: "/admin/reports",
    badge: null,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-slate-950 text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
              <Books className="h-6 w-6 text-white" weight="fill" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">BookNest</h1>
              <p className="text-xs text-slate-500">Bảng điều khiển</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Menu chính
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/admin/dashboard" &&
                location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => onClose()}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-amber-400" : "text-slate-500"
                  )}
                  weight={isActive ? "fill" : "regular"}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-amber-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="border-t border-slate-800 px-3 py-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Thao tác nhanh
          </p>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-slate-800/70 hover:text-slate-200">
            <Barcode className="h-5 w-5 text-slate-500" />
            <span>Quét mã vạch</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/50 p-3">
            <Avatar size="default">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
              <AvatarFallback className="bg-amber-500 text-white">AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-white">Quản trị viên</p>
              <p className="truncate text-xs text-slate-500">admin@booknest.com</p>
            </div>
            <button className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
              <CaretDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function SidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
    >
      <List className="h-6 w-6" />
    </button>
  );
}
