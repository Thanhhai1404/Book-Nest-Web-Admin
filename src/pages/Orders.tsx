import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type LoanStatus =
  | "Chờ duyệt"
  | "Đang mượn"
  | "Đã trả"
  | "Đã hủy"
  | "Quá hạn";

type OrderRow = {
  id: string; // loans.id (MaPhieuMuon)
  borrowerName: string; // member name
  bookTitle: string;
  borrowedAt: string; // loans.borrowedAt
  dueAt: string; // loan detail due date (ngayhentra)
  status: LoanStatus;
};

function getLoanStatusBadge(status: LoanStatus) {
  switch (status) {
    case "Đã trả":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Chờ duyệt":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Đang mượn":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Quá hạn":
      return "bg-red-100 text-red-700 border-red-200";
    case "Đã hủy":
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function Orders() {
  // Mock data based on Flutter/Drift tables: Loans + Members + BookCopies.
  const orders = useMemo<OrderRow[]>(
    () => [
      {
        id: "PM240101001",
        borrowerName: "Nguyễn Thu Hà",
        bookTitle: "Tuổi trẻ đáng giá bao nhiêu",
        borrowedAt: "2026-03-11 08:30",
        dueAt: "2026-03-18",
        status: "Đã trả",
      },
      {
        id: "PM240105002",
        borrowerName: "Phạm Minh Tuấn",
        bookTitle: "Mắt Biếc",
        borrowedAt: "2026-03-12 10:05",
        dueAt: "2026-03-19",
        status: "Đang mượn",
      },
      {
        id: "PM240105003",
        borrowerName: "Trần Văn Bình",
        bookTitle: "Clean Code",
        borrowedAt: "2026-03-01 09:10",
        dueAt: "2026-03-10",
        status: "Quá hạn",
      },
      {
        id: "PM240113014",
        borrowerName: "Lê Thị Mai",
        bookTitle: "Tìm mình trong thế giới hậu tuổi thơ",
        borrowedAt: "2026-03-13 14:20",
        dueAt: "2026-03-20",
        status: "Chờ duyệt",
      },
      {
        id: "PM240112009",
        borrowerName: "Nguyễn Thu Hà",
        bookTitle: "Mắt Biếc",
        borrowedAt: "2026-03-12 16:40",
        dueAt: "2026-03-19",
        status: "Đã hủy",
      },
    ],
    []
  );

  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === "Chờ duyệt").length,
    [orders]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
          Phiếu mượn
        </h1>
        <p className="text-sm text-slate-500">
          Duyệt và theo dõi các yêu cầu mượn (Loans / ChiTietMuon).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-0 bg-white shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-slate-900">
                Yêu cầu mượn sách
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200"
              >
                Chờ duyệt: {pendingCount}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Mã phiếu</TableHead>
                  <TableHead>Người mượn</TableHead>
                  <TableHead>Sách</TableHead>
                  <TableHead className="w-[170px]">Ngày mượn</TableHead>
                  <TableHead className="w-[140px]">Hạn trả</TableHead>
                  <TableHead className="w-[140px]">Trạng thái</TableHead>
                  <TableHead className="w-[140px] text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {o.id}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {o.borrowerName}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {o.bookTitle}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {o.borrowedAt}
                    </TableCell>
                    <TableCell className="text-slate-700">{o.dueAt}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getLoanStatusBadge(o.status)}
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        className="h-9"
                        disabled={o.status !== "Chờ duyệt"}
                      >
                        Duyệt đơn
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Ghi chú</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Chờ duyệt</span>:
              Hội viên tạo yêu cầu, chờ thủ thư xác nhận.
            </p>
            <p>
              <span className="font-semibold text-slate-900">Đang mượn</span>:
              Sách đang được mượn.
            </p>
            <p>
              <span className="font-semibold text-slate-900">Quá hạn</span>: Đã
              quá ngày hẹn trả nhưng chưa ghi nhận trả.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
