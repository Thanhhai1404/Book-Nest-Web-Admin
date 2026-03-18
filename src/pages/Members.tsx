import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type MemberStatus = "Hoạt động" | "Khóa";

type MemberRow = {
  id: string; // members.id (MaDG)
  name: string; // last + middle + first
  email: string;
  phone: string;
  status: MemberStatus;
  avatarUrl?: string;
};

function getMemberStatusBadge(status: MemberStatus) {
  switch (status) {
    case "Hoạt động":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Khóa":
      return "bg-red-100 text-red-700 border-red-200";
  }
}

export function Members() {
  // Mock data based on Flutter/Drift table: Members (DOC_GIA).
  const members = useMemo<MemberRow[]>(
    () => [
      {
        id: "DG001",
        name: "Phạm Minh Tuấn",
        email: "tuandev@gmail.com",
        phone: "0909111222",
        status: "Hoạt động",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=DG001",
      },
      {
        id: "DG002",
        name: "Nguyễn Thu Hà",
        email: "hnguyen@gmail.com",
        phone: "0918333444",
        status: "Hoạt động",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=DG002",
      },
      {
        id: "DG003",
        name: "Trần Văn Bình",
        email: "binhtran@outlook.com",
        phone: "0939555666",
        status: "Hoạt động",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=DG003",
      },
      {
        id: "DG004",
        name: "Lê Thị Mai",
        email: "maile@gmail.com",
        phone: "0988777888",
        status: "Khóa",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=DG004",
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
          Hội viên
        </h1>
        <p className="text-sm text-slate-500">
          Quản lý độc giả/hội viên (DOC_GIA) và trạng thái tài khoản.
        </p>
      </div>

      <Card className="rounded-2xl border-0 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-900">
            Danh sách hội viên
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">Ảnh</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[160px]">Số điện thoại</TableHead>
                <TableHead className="w-[140px]">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={m.avatarUrl} />
                      <AvatarFallback className="bg-amber-500 text-white">
                        {m.name
                          .split(" ")
                          .slice(-2)
                          .map((p) => p[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900">{m.name}</div>
                      <div className="text-xs text-slate-500">Mã: {m.id}</div>
                    </div>
                  </TableCell>

                  <TableCell className="text-slate-700">{m.email}</TableCell>
                  <TableCell className="text-slate-700">{m.phone}</TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getMemberStatusBadge(m.status)}
                    >
                      {m.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
