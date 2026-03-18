import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Books,
  Package,
  Users,
  CurrencyDollar,
  TrendUp,
  TrendDown,
  Plus,
  UserPlus,
  Barcode,
  Eye,
  ArrowRight,
  Clock,
  CalendarBlank,
} from "@phosphor-icons/react";

// Mock Data
const statsData = [
  {
    title: "Tổng số sách",
    value: "12,847",
    change: "+12.5%",
    trend: "up",
    icon: Books,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    title: "Đơn chờ duyệt",
    value: "284",
    change: "+8.2%",
    trend: "up",
    icon: Package,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
  },
  {
    title: "Hội viên hoạt động",
    value: "3,429",
    change: "+23.1%",
    trend: "up",
    icon: Users,
    color: "from-emerald-500 to-green-600",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    title: "Doanh thu tháng",
    value: "$48,295",
    change: "-2.4%",
    trend: "down",
    icon: CurrencyDollar,
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
];

const recentOrders = [
  {
    id: "ORD-001",
    customer: {
      name: "Sarah Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    },
    book: "The Great Gatsby",
    date: "13/03/2026",
    status: "Hoàn tất",
  },
  {
    id: "ORD-002",
    customer: {
      name: "Michael Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
    },
    book: "1984 - George Orwell",
    date: "13/03/2026",
    status: "Chờ duyệt",
  },
  {
    id: "ORD-003",
    customer: {
      name: "Emily Davis",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
    },
    book: "To Kill a Mockingbird",
    date: "12/03/2026",
    status: "Đang xử lý",
  },
  {
    id: "ORD-004",
    customer: {
      name: "James Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
    },
    book: "Pride and Prejudice",
    date: "12/03/2026",
    status: "Hoàn tất",
  },
  {
    id: "ORD-005",
    customer: {
      name: "Lisa Thompson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
    },
    book: "The Catcher in the Rye",
    date: "11/03/2026",
    status: "Đã hủy",
  },
];

const quickActions = [
  {
    title: "Thêm sách mới",
    description: "Thêm đầu sách vào kho",
    icon: Plus,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    hoverColor: "hover:bg-blue-500/20",
  },
  {
    title: "Tạo thẻ hội viên",
    description: "Đăng ký hội viên mới",
    icon: UserPlus,
    color: "from-emerald-500 to-green-600",
    bgColor: "bg-emerald-500/10",
    hoverColor: "hover:bg-emerald-500/20",
  },
  {
    title: "Quét mã vạch",
    description: "Tra cứu sách nhanh",
    icon: Barcode,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
    hoverColor: "hover:bg-amber-500/20",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Hoàn tất":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Chờ duyệt":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Đang xử lý":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Đã hủy":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
            Tổng quan
          </h1>
          <p className="text-sm text-slate-500">
            Xin chào! Dưới đây là tình hình BookNest hôm nay.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarBlank className="h-4 w-4" />
          <span>13/03/2026</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendUp : TrendDown;

          return (
            <Card
              key={stat.title}
              className="group relative overflow-hidden rounded-2xl border-0 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold tracking-tight text-slate-900">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex items-center gap-0.5 text-xs font-semibold ${
                          stat.trend === "up"
                            ? "text-emerald-600"
                            : "text-red-500"
                        }`}
                      >
                        <TrendIcon className="h-3.5 w-3.5" />
                        {stat.change}
                      </span>
                      <span className="text-xs text-slate-400">
                        so với tháng trước
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-6 w-6 text-white" weight="fill" />
                  </div>
                </div>
              </CardContent>
              {/* Decorative gradient line */}
              <div
                className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${stat.color}`}
              />
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Orders Table */}
        <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm xl:col-span-2">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Đơn hàng gần đây
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Các giao dịch mới nhất của cửa hàng
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                className="gap-2 rounded-xl text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Mã đơn
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Khách hàng
                    </th>
                    <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 md:table-cell">
                      Sách
                    </th>
                    <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">
                      Ngày
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">
                          {order.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            <AvatarImage src={order.customer.avatar} />
                            <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                              {order.customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-slate-700">
                            {order.customer.name}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-6 py-4 md:table-cell">
                        <span className="text-slate-600">{order.book}</span>
                      </td>
                      <td className="hidden px-6 py-4 sm:table-cell">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-sm">{order.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Xem</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Thao tác nhanh
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Các thao tác thường dùng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.title}
                  className={`group flex w-full items-center gap-4 rounded-xl p-4 text-left transition-all duration-200 ${action.bgColor} ${action.hoverColor}`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-lg transition-transform duration-200 group-hover:scale-110`}
                  >
                    <Icon className="h-6 w-6 text-white" weight="bold" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-slate-900">
                      {action.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              );
            })}
          </CardContent>

          {/* Activity Summary */}
          <div className="border-t border-slate-100 p-4">
            <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4">
              <h4 className="mb-3 font-semibold text-slate-900">
                Hoạt động hôm nay
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Sách đã bán</span>
                  <span className="font-semibold text-slate-900">47</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Hội viên mới</span>
                  <span className="font-semibold text-slate-900">12</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Phiếu trả đã xử lý</span>
                  <span className="font-semibold text-slate-900">5</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
