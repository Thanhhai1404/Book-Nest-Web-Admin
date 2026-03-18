import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { QrCode, Check, X, BookOpen, ArrowRight } from "@phosphor-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────
type LoanStatus = "Chờ duyệt" | "Đang mượn" | "Đã trả" | "Đã hủy" | "Quá hạn";

type OrderRow = {
  id: string;                // mapm
  borrowerName: string;      // doc_gia full name
  borrowerPhone: string;     // doc_gia sdt
  bookTitle: string;         // dau_sach tensach (qua chi_tiet_muon -> sach -> dau_sach)
  bookBarcode: string;       // mavach
  borrowedAt: string;        // ngaymuon
  dueAt: string;             // ngayhentra
  returnedAt: string | null; // ngaytrathucte
  rawStatus: number;         // trangthai gốc (0,1,2,3)
  status: LoanStatus;        // computed
  note: string;              // ghichu
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeLoanStatus(rawStatus: number, dueAt: string | null): LoanStatus {
  if (rawStatus === 2) return "Chờ duyệt";
  if (rawStatus === 1) return "Đã trả";
  if (rawStatus === 3) return "Đã hủy";
  // rawStatus === 0 (Đang mượn) — kiểm tra quá hạn
  if (dueAt && new Date(dueAt) < new Date()) return "Quá hạn";
  return "Đang mượn";
}

function getLoanBadge(status: LoanStatus) {
  switch (status) {
    case "Chờ duyệt":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Đang mượn":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Quá hạn":
      return "bg-red-100 text-red-700 border-red-200";
    case "Đã trả":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Đã hủy":
      return "bg-slate-100 text-slate-500 border-slate-200";
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Orders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LoanStatus>("all");
  const { toast } = useToast();

  // ── QR Dialog ──
  const [qrOpen, setQrOpen] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [qrResult, setQrResult] = useState<OrderRow | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // ── Action states ──
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [returnTarget, setReturnTarget] = useState<OrderRow | null>(null);
  const [cancelTarget, setCancelTarget] = useState<OrderRow | null>(null);

  // ── Fetch phiếu mượn (chia nhỏ query để tránh lỗi nested join) ──
  async function fetchOrders() {
    setIsLoading(true);
    try {
      // ── Bước 1: Fetch tất cả phiếu mượn + thông tin độc giả ──
      const { data: pmData, error: pmError } = await supabase
        .from("phieu_muon")
        .select("mapm, madg, ngaymuon, ghichu, doc_gia(madg, hodg, tenlotdg, tendg, sdt)")
        .order("ngaymuon", { ascending: false });

      if (pmError) {
        console.error("LỖI FETCH SUPABASE (phieu_muon):", pmError);
        toast({ variant: "destructive", title: "Lỗi tải phiếu mượn", description: pmError.message });
        setOrders([]);
        return; // finally vẫn chạy
      }

      if (!pmData || pmData.length === 0) {
        setOrders([]);
        return;
      }

      // Tạo map nhanh: mapm → phieu_muon row
      const pmMap = new Map<string, any>();
      for (const pm of pmData) {
        pmMap.set(pm.mapm, pm);
      }

      // ── Bước 2: Fetch tất cả chi_tiet_muon ──
      const { data: ctData, error: ctError } = await supabase
        .from("chi_tiet_muon")
        .select("mapm, mavach, ngayhentra, ngaytrathucte, trangthai");

      if (ctError) {
        console.error("LỖI FETCH SUPABASE (chi_tiet_muon):", ctError);
        toast({ variant: "destructive", title: "Lỗi tải chi tiết mượn", description: ctError.message });
        setOrders([]);
        return;
      }

      // ── Bước 3: Lấy tên sách qua mavach → sach → dau_sach ──
      // Thu thập tất cả mavach unique
      const allBarcodes = [...new Set((ctData || []).map((ct: any) => ct.mavach).filter(Boolean))];

      // Fetch sach + dau_sach cho tất cả barcodes
      let sachMap = new Map<string, string>(); // mavach → tensach
      if (allBarcodes.length > 0) {
        const { data: sachData, error: sachError } = await supabase
          .from("sach")
          .select("mavach, dau_sach(tensach)")
          .in("mavach", allBarcodes);

        if (sachError) {
          console.error("LỖI FETCH SUPABASE (sach):", sachError);
          // Không return — vẫn hiển thị phiếu, chỉ thiếu tên sách
        } else {
          for (const s of sachData || []) {
            const ds = s.dau_sach as any;
            sachMap.set(s.mavach, ds?.tensach || "Không rõ tên sách");
          }
        }
      }

      // ── Bước 4: Map lại thành OrderRow[] ──
      const mapped: OrderRow[] = (ctData || [])
        .filter((ct: any) => pmMap.has(ct.mapm)) // chỉ lấy chi tiết có phiếu tương ứng
        .map((ct: any) => {
          const pm = pmMap.get(ct.mapm);
          const dg = pm?.doc_gia as any;

          const fullName = [dg?.hodg, dg?.tenlotdg, dg?.tendg]
            .filter((s: string | null) => s && s.trim())
            .join(" ") || "Không rõ";

          const rawStatus = ct.trangthai ?? 0;
          const dueAt = ct.ngayhentra || null;

          return {
            id: ct.mapm || "",
            borrowerName: fullName,
            borrowerPhone: dg?.sdt || "",
            bookTitle: sachMap.get(ct.mavach) || "Không rõ tên sách",
            bookBarcode: ct.mavach || "",
            borrowedAt: pm?.ngaymuon || "",
            dueAt: dueAt || "",
            returnedAt: ct.ngaytrathucte || null,
            rawStatus,
            status: computeLoanStatus(rawStatus, dueAt),
            note: pm?.ghichu || "",
          };
        })
        // Sắp xếp theo ngày mượn mới nhất
        .sort((a: OrderRow, b: OrderRow) => {
          if (!a.borrowedAt && !b.borrowedAt) return 0;
          if (!a.borrowedAt) return 1;
          if (!b.borrowedAt) return -1;
          return new Date(b.borrowedAt).getTime() - new Date(a.borrowedAt).getTime();
        });

      setOrders(mapped);
    } catch (err: any) {
      console.error("LỖI FETCH SUPABASE:", err);
      toast({ variant: "destructive", title: "Lỗi nghiêm trọng", description: err?.message || "Không thể tải dữ liệu phiếu mượn" });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchOrders();

    // ── Realtime: Lắng nghe thay đổi từ Supabase ──
    const channel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'phieu_muon' },
        () => {
          fetchOrders();
          toast({ title: "🔄 Có cập nhật phiếu mượn!" });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chi_tiet_muon' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    // Cleanup khi component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Filter ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchQ =
        q.length === 0 ||
        o.id.toLowerCase().includes(q) ||
        o.borrowerName.toLowerCase().includes(q) ||
        o.bookTitle.toLowerCase().includes(q) ||
        o.borrowerPhone.includes(q);
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [orders, search, statusFilter]);

  // ── Count ──
  const statusCounts = useMemo(() => {
    const c = { all: orders.length, "Chờ duyệt": 0, "Đang mượn": 0, "Quá hạn": 0, "Đã trả": 0, "Đã hủy": 0 };
    orders.forEach((o) => { c[o.status]++; });
    return c;
  }, [orders]);

  // ── ACTION: Giao sách (Duyệt) → trangthai 2 → 0 (Đang mượn) ──
  async function handleApprove(order: OrderRow) {
    setActionLoading(order.id + "_approve");
    const mapm = order.id.trim();
    const mavach = order.bookBarcode.trim();

    try {
      // Update chi_tiet_muon và lấy lại row đã update để xác nhận
      const { data, error } = await supabase
        .from("chi_tiet_muon")
        .update({ trangthai: 0 })
        .eq("mapm", mapm)
        .eq("mavach", mavach)
        .select();

      if (error) {
        console.error("LỖI DUYỆT ĐƠN (chi_tiet_muon):", error, { mapm, mavach });
        toast({ variant: "destructive", title: "Duyệt thất bại", description: error.message });
        setActionLoading(null);
        return;
      }

      if (!data || data.length === 0) {
        console.error("DUYỆT ĐƠN: Không có row nào được update!", { mapm, mavach });
        toast({ variant: "destructive", title: "Duyệt thất bại", description: "Không tìm thấy bản ghi để cập nhật. Kiểm tra mã phiếu." });
        setActionLoading(null);
        return;
      }

      // Cập nhật trạng thái sách vật lý → 1 (Đang mượn)
      const { error: sachError } = await supabase
        .from("sach")
        .update({ trangthai: 1 })
        .eq("mavach", mavach);

      if (sachError) {
        console.error("LỖI CẬP NHẬT SÁCH (sach):", sachError, { mavach });
        // Không return — chi_tiet_muon đã update thành công
      }

      // DB đã thay đổi thành công → mới cập nhật UI
      toast({ title: "Đã giao sách!", description: `Phiếu ${mapm} — ${order.bookTitle}` });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id && o.bookBarcode === order.bookBarcode
            ? { ...o, rawStatus: 0, status: computeLoanStatus(0, o.dueAt) }
            : o
        )
      );
      if (qrResult && qrResult.id === order.id) {
        setQrResult({ ...qrResult, rawStatus: 0, status: "Đang mượn" });
      }
    } catch (err: any) {
      console.error("LỖI DUYỆT ĐƠN (exception):", err);
      toast({ variant: "destructive", title: "Lỗi hệ thống", description: err?.message || "Không thể duyệt đơn" });
    }
    setActionLoading(null);
  }

  // ── ACTION: Xác nhận Trả Sách → trangthai 0/quá hạn → 1 (Đã trả) ──
  async function handleReturn() {
    if (!returnTarget) return;
    setActionLoading(returnTarget.id + "_return");
    const mapm = returnTarget.id.trim();
    const mavach = returnTarget.bookBarcode.trim();

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("chi_tiet_muon")
        .update({ trangthai: 1, ngaytrathucte: now })
        .eq("mapm", mapm)
        .eq("mavach", mavach)
        .select();

      if (error) {
        console.error("LỖI TRẢ SÁCH (chi_tiet_muon):", error, { mapm, mavach });
        toast({ variant: "destructive", title: "Xác nhận trả thất bại", description: error.message });
        setActionLoading(null);
        setReturnTarget(null);
        return;
      }

      if (!data || data.length === 0) {
        console.error("TRẢ SÁCH: Không có row nào được update!", { mapm, mavach });
        toast({ variant: "destructive", title: "Xác nhận trả thất bại", description: "Không tìm thấy bản ghi để cập nhật." });
        setActionLoading(null);
        setReturnTarget(null);
        return;
      }

      // Trả sách vật lý về trạng thái 0 (Sẵn sàng)
      const { error: sachError } = await supabase
        .from("sach")
        .update({ trangthai: 0 })
        .eq("mavach", mavach);

      if (sachError) {
        console.error("LỖI CẬP NHẬT SÁCH KHI TRẢ:", sachError, { mavach });
      }

      // DB đã thay đổi thành công → mới cập nhật UI
      toast({ title: "Đã xác nhận trả sách!", description: `Phiếu ${mapm}` });
      // TODO: Gọi API cộng lại tiền hoàn cọc vào ví người dùng tại đây
      setOrders((prev) =>
        prev.map((o) =>
          o.id === returnTarget.id && o.bookBarcode === returnTarget.bookBarcode
            ? { ...o, rawStatus: 1, status: "Đã trả", returnedAt: now }
            : o
        )
      );
    } catch (err: any) {
      console.error("LỖI TRẢ SÁCH (exception):", err);
      toast({ variant: "destructive", title: "Lỗi hệ thống", description: err?.message || "Không thể xác nhận trả sách" });
    }
    setActionLoading(null);
    setReturnTarget(null);
  }

  // ── ACTION: Hủy đơn → trangthai 2 → 3 (Đã hủy) ──
  async function handleCancel() {
    if (!cancelTarget) return;
    setActionLoading(cancelTarget.id + "_cancel");
    const mapm = cancelTarget.id.trim();
    const mavach = cancelTarget.bookBarcode.trim();

    try {
      const { data, error } = await supabase
        .from("chi_tiet_muon")
        .update({ trangthai: 3 })
        .eq("mapm", mapm)
        .eq("mavach", mavach)
        .select();

      if (error) {
        console.error("LỖI HỦY ĐƠN (chi_tiet_muon):", error, { mapm, mavach });
        toast({ variant: "destructive", title: "Hủy thất bại", description: error.message });
        setActionLoading(null);
        setCancelTarget(null);
        return;
      }

      if (!data || data.length === 0) {
        console.error("HỦY ĐƠN: Không có row nào được update!", { mapm, mavach });
        toast({ variant: "destructive", title: "Hủy thất bại", description: "Không tìm thấy bản ghi để cập nhật." });
        setActionLoading(null);
        setCancelTarget(null);
        return;
      }

      // Trả sách vật lý về trạng thái 0 (Sẵn sàng)
      await supabase.from("sach").update({ trangthai: 0 }).eq("mavach", mavach);
      await supabase.from("phieu_muon").update({ ghichu: "Đã hủy bởi Admin" }).eq("mapm", mapm);

      // DB đã thay đổi thành công → mới cập nhật UI
      toast({ title: "Đã hủy đơn!", description: `Phiếu ${mapm}` });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelTarget.id && o.bookBarcode === cancelTarget.bookBarcode
            ? { ...o, rawStatus: 3, status: "Đã hủy" }
            : o
        )
      );
    } catch (err: any) {
      console.error("LỖI HỦY ĐƠN (exception):", err);
      toast({ variant: "destructive", title: "Lỗi hệ thống", description: err?.message || "Không thể hủy đơn" });
    }
    setActionLoading(null);
    setCancelTarget(null);
  }

  // ── QR: Tìm phiếu ──
  async function handleQrSearch() {
    const code = qrInput.trim();
    if (!code) return;
    setQrLoading(true);
    setQrResult(null);

    // Tìm trong danh sách đã load
    const found = orders.find((o) => o.id === code);
    if (found) {
      setQrResult(found);
    } else {
      toast({ variant: "destructive", title: "Không tìm thấy", description: `Mã phiếu "${code}" không tồn tại.` });
    }
    setQrLoading(false);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JSX
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
            Phiếu mượn
          </h1>
          <p className="text-sm text-slate-500">
            Duyệt, theo dõi và quản lý các yêu cầu mượn/trả sách.
          </p>
        </div>
        <Button
          className="h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm cursor-pointer transition-colors duration-200 gap-2"
          onClick={() => { setQrOpen(true); setQrInput(""); setQrResult(null); }}
        >
          <QrCode className="h-5 w-5" weight="bold" />
          Quét mã QR giao sách
        </Button>
      </div>

      {/* ── Card chứa bảng ── */}
      <Card className="rounded-2xl border-0 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base text-slate-900">
              Danh sách phiếu mượn
            </CardTitle>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã phiếu, tên độc giả, tên sách..."
              className="w-full sm:w-[320px]"
            />
          </div>

          {/* ── Tabs ── */}
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "all" | LoanStatus)}
            className="mt-3"
          >
            <TabsList variant="line">
              <TabsTrigger value="all">
                Tất cả
                <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 font-medium">
                  {statusCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="Chờ duyệt">
                Chờ duyệt
                <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 font-medium bg-amber-50 text-amber-700 border-amber-200">
                  {statusCounts["Chờ duyệt"]}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="Đang mượn">
                Đang mượn
                <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 font-medium bg-blue-50 text-blue-700 border-blue-200">
                  {statusCounts["Đang mượn"]}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="Quá hạn">
                Quá hạn
                <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 font-medium bg-red-50 text-red-700 border-red-200">
                  {statusCounts["Quá hạn"]}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="Đã trả">
                Đã trả / Đã hủy
                <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 font-medium bg-slate-50 text-slate-500 border-slate-200">
                  {statusCounts["Đã trả"] + statusCounts["Đã hủy"]}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Mã phiếu</TableHead>
                <TableHead>Độc giả</TableHead>
                <TableHead>Tên sách</TableHead>
                <TableHead className="w-[130px]">Ngày mượn</TableHead>
                <TableHead className="w-[120px]">Hạn trả</TableHead>
                <TableHead className="w-[130px]">Trạng thái</TableHead>
                <TableHead className="w-[200px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><div className="h-4 w-28 animate-pulse rounded bg-slate-200" /></TableCell>
                    <TableCell><div className="h-4 w-24 animate-pulse rounded bg-slate-200" /></TableCell>
                    <TableCell><div className="h-4 w-36 animate-pulse rounded bg-slate-200" /></TableCell>
                    <TableCell><div className="h-4 w-20 animate-pulse rounded bg-slate-200" /></TableCell>
                    <TableCell><div className="h-4 w-20 animate-pulse rounded bg-slate-200" /></TableCell>
                    <TableCell><div className="h-6 w-20 animate-pulse rounded bg-slate-100" /></TableCell>
                    <TableCell><div className="h-9 w-24 animate-pulse rounded bg-slate-100 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filtered.map((o) => (
                  <TableRow
                    key={`${o.id}_${o.bookBarcode}`}
                    className="transition-all duration-300 ease-in-out hover:bg-slate-50/80 animate-in fade-in slide-in-from-bottom-2"
                  >
                    <TableCell className="font-semibold text-slate-900">{o.id}</TableCell>
                    <TableCell>
                      <div>{o.borrowerName}</div>
                      {o.borrowerPhone && (
                        <div className="text-xs text-slate-400">{o.borrowerPhone}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-700 max-w-[200px] truncate" title={o.bookTitle}>
                      {o.bookTitle}
                    </TableCell>
                    <TableCell className="text-slate-700">{formatDateTime(o.borrowedAt)}</TableCell>
                    <TableCell className="text-slate-700">{formatDate(o.dueAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getLoanBadge(o.status)} transition-colors duration-200`}
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {/* Chờ duyệt → Giao Sách + Hủy */}
                        {o.status === "Chờ duyệt" && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer transition-colors duration-200 gap-1"
                              disabled={actionLoading === o.id + "_approve"}
                              onClick={() => handleApprove(o)}
                            >
                              <Check className="h-3.5 w-3.5" weight="bold" />
                              {actionLoading === o.id + "_approve" ? "..." : "Giao sách"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer transition-colors duration-200"
                              onClick={() => setCancelTarget(o)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {/* Đang mượn / Quá hạn → Xác nhận trả */}
                        {(o.status === "Đang mượn" || o.status === "Quá hạn") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer transition-colors duration-200 gap-1"
                            onClick={() => setReturnTarget(o)}
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            Trả sách
                          </Button>
                        )}
                        {/* Đã trả / Đã hủy → Không có action */}
                        {(o.status === "Đã trả" || o.status === "Đã hủy") && (
                          <span className="text-xs text-slate-400 italic">Hoàn tất</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    <div className="text-sm font-medium text-slate-900">Không có kết quả</div>
                    <div className="text-xs text-slate-500">Hãy thử từ khóa khác hoặc chọn Tab khác.</div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════
          Dialog Quét QR
          ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-amber-500" weight="bold" />
              Quét mã QR / Nhập mã phiếu
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="qr-input">
                Mã phiếu mượn
              </label>
              <div className="flex gap-2">
                <Input
                  id="qr-input"
                  placeholder="Nhập hoặc quét mã phiếu..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleQrSearch(); }}
                  autoFocus
                />
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shrink-0"
                  onClick={handleQrSearch}
                  disabled={qrLoading || !qrInput.trim()}
                >
                  <ArrowRight className="h-4 w-4" weight="bold" />
                </Button>
              </div>
            </div>

            {/* Kết quả tìm kiếm */}
            {qrResult && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{qrResult.id}</span>
                  <Badge variant="outline" className={getLoanBadge(qrResult.status)}>
                    {qrResult.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div><span className="text-slate-500">Độc giả:</span> <span className="font-medium">{qrResult.borrowerName}</span></div>
                  <div><span className="text-slate-500">Sách:</span> <span className="font-medium">{qrResult.bookTitle}</span></div>
                  <div><span className="text-slate-500">Ngày mượn:</span> {formatDateTime(qrResult.borrowedAt)}</div>
                  <div><span className="text-slate-500">Hạn trả:</span> {formatDate(qrResult.dueAt)}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  {qrResult.status === "Chờ duyệt" && (
                    <Button
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer gap-1"
                      disabled={actionLoading === qrResult.id + "_approve"}
                      onClick={() => handleApprove(qrResult)}
                    >
                      <Check className="h-4 w-4" weight="bold" />
                      {actionLoading === qrResult.id + "_approve" ? "Đang xử lý..." : "Xác nhận giao sách"}
                    </Button>
                  )}
                  {(qrResult.status === "Đang mượn" || qrResult.status === "Quá hạn") && (
                    <Button
                      className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer gap-1"
                      variant="outline"
                      onClick={() => { setReturnTarget(qrResult); setQrOpen(false); }}
                    >
                      <BookOpen className="h-4 w-4" />
                      Xác nhận trả sách
                    </Button>
                  )}
                  {(qrResult.status === "Đã trả" || qrResult.status === "Đã hủy") && (
                    <p className="text-sm text-slate-500 italic">Phiếu này đã xử lý xong.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQrOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          AlertDialog xác nhận TRẢ SÁCH
          ═══════════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={!!returnTarget} onOpenChange={(v) => { if (!v) setReturnTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận trả sách</AlertDialogTitle>
            <AlertDialogDescription>
              Xác nhận rằng sách <strong>"{returnTarget?.bookTitle}"</strong> (Phiếu {returnTarget?.id}) đã được trả lại?
              {/* TODO: Gọi API cộng lại tiền hoàn cọc vào ví người dùng */}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading === returnTarget?.id + "_return"}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleReturn}
              disabled={actionLoading === returnTarget?.id + "_return"}
            >
              {actionLoading === returnTarget?.id + "_return" ? "Đang xử lý..." : "Xác nhận trả"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          AlertDialog xác nhận HỦY ĐƠN
          ═══════════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(v) => { if (!v) setCancelTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy đơn mượn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn hủy phiếu <strong>{cancelTarget?.id}</strong> — "{cancelTarget?.bookTitle}"?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading === cancelTarget?.id + "_cancel"}>Huỷ bỏ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleCancel}
              disabled={actionLoading === cancelTarget?.id + "_cancel"}
            >
              {actionLoading === cancelTarget?.id + "_cancel" ? "Đang xử lý..." : "Xác nhận hủy"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
