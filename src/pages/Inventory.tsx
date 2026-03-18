import { useMemo, useState, useEffect, useCallback } from "react";
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
import { PencilSimple, Trash, CaretDown } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicFormModal, type EntityType } from "@/components/DynamicFormModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// ─── Types ────────────────────────────────────────────────────────────────────
type InventoryStatus = "Còn hàng" | "Sắp hết hàng" | "Hết hàng";

type InventoryBookRow = {
  id: string;
  title: string;
  authors: string;
  totalQuantity: number;
  status: InventoryStatus;
  coverUrl: string;
  // Raw data để phục vụ Edit
  matl: number;
  manxb: number;
  namxb: number;
  giabia: number;
  mota: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeStatus(quantity: number): InventoryStatus {
  if (quantity > 10) return "Còn hàng";
  if (quantity > 0) return "Sắp hết hàng";
  return "Hết hàng";
}

function getInventoryBadge(status: InventoryStatus) {
  switch (status) {
    case "Còn hàng":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Sắp hết hàng":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Hết hàng":
      return "bg-red-100 text-red-700 border-red-200";
  }
}

function mapBookRow(b: any): InventoryBookRow {
  const qty = b.tongsoluong || 0;
  return {
    id: b.mads || "",
    title: b.tensach || "",
    authors: b.mota || "",
    totalQuantity: qty,
    status: computeStatus(qty),
    coverUrl: b.anhbia || "https://placehold.co/72x96/png?text=Cover",
    matl: b.matl || 0,
    manxb: b.manxb || 0,
    namxb: b.namxb || 0,
    giabia: b.giabia || 0,
    mota: b.mota || "",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Inventory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InventoryStatus>("all");
  const [books, setBooks] = useState<InventoryBookRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // ── Add Book Dialog ──
  const [open, setOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [form, setForm] = useState({
    mads: "",
    tensach: "",
    tongsoluong: 1,
    giabia: 0,
    nhaxuatban: "",
    namxb: "",
    theloai: "",
    mota: "",
    anhbia: "",
    file: undefined as File | undefined,
    previewUrl: "",
  });

  // ── Combobox state ──
  const [categories, setCategories] = useState<{ matl: number; tentl: string }[]>([]);
  const [publishers, setPublishers] = useState<{ manxb: number; tennxb: string }[]>([]);
  const [authors, setAuthors] = useState<{ matg: number; tentg: string }[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>("");

  // ── DynamicFormModal (thay thế window.prompt) ──
  const [addEntityOpen, setAddEntityOpen] = useState(false);
  const [addEntityType, setAddEntityType] = useState<EntityType>("the_loai");

  // ── Delete state ──
  const [deleteTarget, setDeleteTarget] = useState<InventoryBookRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Edit state ──
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editBook, setEditBook] = useState<InventoryBookRow | null>(null);
  const [editForm, setEditForm] = useState({
    tensach: "",
    tongsoluong: 0,
    giabia: 0,
    nhaxuatban: "",
    namxb: "",
    theloai: "",
    mota: "",
    anhbia: "",
    file: undefined as File | undefined,
    previewUrl: "",
  });

  // ── Fetch books ──
  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("dau_sach").select("*");
    if (error) {
      setBooks([]);
    } else {
      setBooks((data || []).map(mapBookRow));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // ── Fetch combobox data khi mở modal Add hoặc Edit ──
  useEffect(() => {
    if (!open && !editOpen) return;
    (async () => {
      const [cat, pub, aut] = await Promise.all([
        supabase.from("the_loai").select("matl, tentl"),
        supabase.from("nha_xuat_ban").select("manxb, tennxb"),
        supabase.from("tac_gia").select("matg, tentg"),
      ]);
      setCategories(cat.data || []);
      setPublishers(pub.data || []);
      setAuthors(aut.data || []);
    })();
  }, [open, editOpen]);

  // ── Filter logic ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter((b) => {
      const matchesQuery =
        q.length === 0 ||
        b.title.toLowerCase().includes(q) ||
        b.authors.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [books, search, statusFilter]);

  // ── Đếm số lượng theo trạng thái cho Tabs ──
  const statusCounts = useMemo(() => {
    const counts = { all: books.length, "Còn hàng": 0, "Sắp hết hàng": 0, "Hết hàng": 0 };
    books.forEach((b) => { counts[b.status]++; });
    return counts;
  }, [books]);

  // ── File change handler ──
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setForm(f => ({ ...f, file, previewUrl: URL.createObjectURL(file) }));
    }
  }

  function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setEditForm(f => ({ ...f, file, previewUrl: URL.createObjectURL(file) }));
    }
  }

  // ── DynamicFormModal handlers ──
  function handleAddNew(type: EntityType) {
    setAddEntityType(type);
    setAddEntityOpen(true);
  }

  function handleAddEntitySuccess(data: Record<string, any>) {
    if (addEntityType === "the_loai") {
      setCategories(prev => [...prev, data as any]);
      setForm(f => ({ ...f, theloai: data.matl.toString() }));
      toast({ title: "Đã thêm thể loại mới!" });
    } else if (addEntityType === "nha_xuat_ban") {
      setPublishers(prev => [...prev, data as any]);
      setForm(f => ({ ...f, nhaxuatban: data.manxb.toString() }));
      toast({ title: "Đã thêm nhà xuất bản mới!" });
    } else if (addEntityType === "tac_gia") {
      setAuthors(prev => [...prev, data as any]);
      setSelectedAuthor(data.matg.toString());
      toast({ title: "Đã thêm tác giả mới!" });
    }
  }

  // Cũng cần handler cho Edit modal khi thêm mới entity
  function handleAddEntitySuccessForEdit(data: Record<string, any>) {
    if (addEntityType === "the_loai") {
      setCategories(prev => [...prev, data as any]);
      setEditForm(f => ({ ...f, theloai: data.matl.toString() }));
      toast({ title: "Đã thêm thể loại mới!" });
    } else if (addEntityType === "nha_xuat_ban") {
      setPublishers(prev => [...prev, data as any]);
      setEditForm(f => ({ ...f, nhaxuatban: data.manxb.toString() }));
      toast({ title: "Đã thêm nhà xuất bản mới!" });
    } else if (addEntityType === "tac_gia") {
      setAuthors(prev => [...prev, data as any]);
      toast({ title: "Đã thêm tác giả mới!" });
    }
  }

  // ── ADD BOOK ──
  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    let coverUrl = form.anhbia;
    if (form.file) {
      const fileName = `${form.mads}_${Date.now()}`;
      const { error } = await supabase.storage.from("book_covers").upload(fileName, form.file);
      if (error) {
        toast({ variant: "destructive", title: "Lỗi upload ảnh bìa", description: error.message });
        setAddLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("book_covers").getPublicUrl(fileName);
      coverUrl = urlData?.publicUrl || "";
    }
    const payload = {
      mads: form.mads,
      tensach: form.tensach,
      namxb: Number(form.namxb),
      giabia: Number(form.giabia),
      tongsoluong: Number(form.tongsoluong),
      mota: form.mota,
      matl: Number(form.theloai),
      manxb: Number(form.nhaxuatban),
      anhbia: coverUrl,
    };
    const { data: bookData, error: insertError } = await supabase.from("dau_sach").insert([payload]).select();
    if (insertError || !bookData || !bookData[0]) {
      toast({ variant: "destructive", title: "Thêm sách thất bại", description: insertError?.message });
      setAddLoading(false);
      return;
    }
    if (selectedAuthor) {
      await supabase.from("chi_tiet_tac_gia").insert({ mads: bookData[0].mads, matg: Number(selectedAuthor) });
    }
    toast({ title: "Thêm sách thành công!", description: `Đã thêm sách '${form.tensach}'.` });
    setOpen(false);
    setForm({
      mads: "",
      tensach: "",
      tongsoluong: 1,
      giabia: 0,
      nhaxuatban: "",
      namxb: "",
      theloai: "",
      mota: "",
      anhbia: "",
      file: undefined,
      previewUrl: "",
    });
    setSelectedAuthor("");
    await fetchBooks();
    setAddLoading(false);
  }

  // ── DELETE BOOK ──
  async function handleDeleteBook() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    // Xóa chi_tiet_tac_gia trước (tránh lỗi FK)
    await supabase.from("chi_tiet_tac_gia").delete().eq("mads", deleteTarget.id);
    const { error } = await supabase.from("dau_sach").delete().eq("mads", deleteTarget.id);
    setDeleteLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Xóa thất bại", description: error.message });
    } else {
      toast({ title: "Đã xóa sách!", description: `Sách '${deleteTarget.title}' đã được xóa.` });
      // Cập nhật state trực tiếp (không cần F5)
      setBooks(prev => prev.filter(b => b.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }

  // ── OPEN EDIT ──
  function handleOpenEdit(book: InventoryBookRow) {
    setEditBook(book);
    setEditForm({
      tensach: book.title,
      tongsoluong: book.totalQuantity,
      giabia: book.giabia,
      nhaxuatban: book.manxb ? book.manxb.toString() : "",
      namxb: book.namxb ? book.namxb.toString() : "",
      theloai: book.matl ? book.matl.toString() : "",
      mota: book.mota,
      anhbia: book.coverUrl,
      file: undefined,
      previewUrl: "",
    });
    setEditOpen(true);
  }

  // ── SAVE EDIT ──
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBook) return;
    setEditLoading(true);

    let coverUrl = editForm.anhbia;
    if (editForm.file) {
      const fileName = `${editBook.id}_${Date.now()}`;
      const { error } = await supabase.storage.from("book_covers").upload(fileName, editForm.file);
      if (error) {
        toast({ variant: "destructive", title: "Lỗi upload ảnh bìa", description: error.message });
        setEditLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("book_covers").getPublicUrl(fileName);
      coverUrl = urlData?.publicUrl || "";
    }

    const payload = {
      tensach: editForm.tensach,
      namxb: Number(editForm.namxb),
      giabia: Number(editForm.giabia),
      tongsoluong: Number(editForm.tongsoluong),
      mota: editForm.mota,
      matl: Number(editForm.theloai),
      manxb: Number(editForm.nhaxuatban),
      anhbia: coverUrl,
    };

    const { error: updateError } = await supabase.from("dau_sach").update(payload).eq("mads", editBook.id);
    setEditLoading(false);

    if (updateError) {
      toast({ variant: "destructive", title: "Cập nhật thất bại", description: updateError.message });
      return;
    }

    toast({ title: "Cập nhật thành công!", description: `Sách '${editForm.tensach}' đã được cập nhật.` });
    setEditOpen(false);
    setEditBook(null);

    // Cập nhật state trực tiếp
    setBooks(prev =>
      prev.map(b => {
        if (b.id !== editBook.id) return b;
        const qty = Number(editForm.tongsoluong);
        return {
          ...b,
          title: editForm.tensach,
          totalQuantity: qty,
          status: computeStatus(qty),
          giabia: Number(editForm.giabia),
          matl: Number(editForm.theloai),
          manxb: Number(editForm.nhaxuatban),
          namxb: Number(editForm.namxb),
          mota: editForm.mota,
          coverUrl: coverUrl,
          authors: editForm.mota,
        };
      })
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JSX
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── Header + Nút Thêm ── */}
      <div className="space-y-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
            Kho sách
          </h1>
          <p className="text-sm text-slate-500">
            Quản lý đầu sách và tồn kho tổng (theo Books / BookCopies của app di động).
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 h-10 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm cursor-pointer transition-colors duration-200">
              + Thêm Sách Mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm Sách Mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddBook} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="mads">Mã sách</label>
                <Input id="mads" value={form.mads} onChange={e => setForm(f => ({ ...f, mads: e.target.value }))} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="tensach">Tên sách</label>
                <Input id="tensach" value={form.tensach} onChange={e => setForm(f => ({ ...f, tensach: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="nhaxuatban">Nhà xuất bản</label>
                <Select value={form.nhaxuatban} onValueChange={v => setForm(f => ({ ...f, nhaxuatban: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn nhà xuất bản" />
                    <CaretDown className="ml-2 h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    {publishers.map(nxb => (
                      <SelectItem key={nxb.manxb} value={nxb.manxb.toString()}>{nxb.tennxb}</SelectItem>
                    ))}
                    <div className="border-t my-1" />
                    <Button type="button" variant="ghost" className="w-full justify-start px-2 py-1 text-left text-amber-600" onClick={() => handleAddNew("nha_xuat_ban")}>+ Thêm nhà xuất bản mới</Button>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="namxb">Năm xuất bản</label>
                <Input id="namxb" type="number" value={form.namxb} onChange={e => setForm(f => ({ ...f, namxb: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="theloai">Thể loại</label>
                <Select value={form.theloai} onValueChange={v => setForm(f => ({ ...f, theloai: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn thể loại" />
                    <CaretDown className="ml-2 h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(tl => (
                      <SelectItem key={tl.matl} value={tl.matl.toString()}>{tl.tentl}</SelectItem>
                    ))}
                    <div className="border-t my-1" />
                    <Button type="button" variant="ghost" className="w-full justify-start px-2 py-1 text-left text-amber-600" onClick={() => handleAddNew("the_loai")}>+ Thêm thể loại mới</Button>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="tacgia">Tác giả</label>
                <Select value={selectedAuthor} onValueChange={v => setSelectedAuthor(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn tác giả" />
                    <CaretDown className="ml-2 h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map(tg => (
                      <SelectItem key={tg.matg} value={tg.matg.toString()}>{tg.tentg}</SelectItem>
                    ))}
                    <div className="border-t my-1" />
                    <Button type="button" variant="ghost" className="w-full justify-start px-2 py-1 text-left text-amber-600" onClick={() => handleAddNew("tac_gia")}>+ Thêm tác giả mới</Button>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1" htmlFor="mota">Giới thiệu / Mô tả</label>
                <Textarea id="mota" value={form.mota} onChange={e => setForm(f => ({ ...f, mota: e.target.value }))} rows={4} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="giabia">Giá bìa</label>
                <Input id="giabia" type="number" min={0} value={form.giabia} onChange={e => setForm(f => ({ ...f, giabia: Number(e.target.value) }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="anhbia">Ảnh bìa</label>
                <Input id="anhbia" type="file" accept="image/*" onChange={handleFileChange} />
                {form.previewUrl && (
                  <div className="mt-2 h-16 w-12 rounded border border-slate-200 bg-slate-100 overflow-hidden">
                    <img src={form.previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Huỷ</Button>
                </DialogClose>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white" disabled={addLoading}>
                  {addLoading ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Card chứa bảng ── */}
      <Card className="rounded-2xl border-0 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base text-slate-900">
              Danh sách kho sách
            </CardTitle>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên sách, tác giả hoặc mã..."
              className="w-full sm:w-[320px]"
            />
          </div>

          {/* ── Tabs bộ lọc trạng thái ── */}
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "all" | InventoryStatus)}
            className="mt-3"
          >
            <TabsList variant="line">
              <TabsTrigger value="all">
                Tất cả
                <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 font-medium">
                  {statusCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="Còn hàng">
                Còn hàng
                <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                  {statusCounts["Còn hàng"]}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="Sắp hết hàng">
                Sắp hết hàng
                <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 font-medium bg-amber-50 text-amber-700 border-amber-200">
                  {statusCounts["Sắp hết hàng"]}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="Hết hàng">
                Hết hàng
                <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 font-medium bg-red-50 text-red-700 border-red-200">
                  {statusCounts["Hết hàng"]}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[96px]">Bìa</TableHead>
                <TableHead>Tên sách</TableHead>
                <TableHead>Tác giả</TableHead>
                <TableHead className="w-[140px] text-right">Số lượng</TableHead>
                <TableHead className="w-[160px]">Trạng thái</TableHead>
                <TableHead className="w-[120px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="h-16 w-12 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-32 animate-pulse rounded bg-slate-200 mb-2" />
                      <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-10 animate-pulse rounded bg-slate-200 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-24 animate-pulse rounded bg-slate-100" />
                    </TableCell>
                    <TableCell>
                      <div className="h-9 w-20 animate-pulse rounded bg-slate-100 mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                filtered.map((b) => (
                  <TableRow
                    key={b.id}
                    className="transition-all duration-300 ease-in-out hover:bg-slate-50/80 animate-in fade-in slide-in-from-bottom-2"
                  >
                    <TableCell>
                      <div className="h-16 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition-transform duration-200 hover:scale-105">
                        <img
                          src={b.coverUrl}
                          alt={`Bìa sách ${b.title}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900">{b.title}</div>
                        <div className="text-xs text-slate-500">Mã: {b.id}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700">{b.authors}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">
                      {b.totalQuantity}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getInventoryBadge(b.status)} transition-colors duration-200`}
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {/* ── Nút Sửa ── */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 cursor-pointer transition-colors duration-200 hover:bg-amber-50 hover:text-amber-600"
                          aria-label={`Sửa ${b.title}`}
                          onClick={() => handleOpenEdit(b)}
                        >
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                        {/* ── Nút Xóa ── */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-red-600 hover:text-red-600 cursor-pointer transition-colors duration-200 hover:bg-red-50"
                          aria-label={`Xóa ${b.title}`}
                          onClick={() => setDeleteTarget(b)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">
                    <div className="text-sm font-medium text-slate-900">
                      Không có kết quả
                    </div>
                    <div className="text-xs text-slate-500">
                      Hãy thử từ khóa khác hoặc xóa bộ lọc.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════
          AlertDialog xác nhận XÓA
          ═══════════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sách</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa sách <strong>"{deleteTarget?.title}"</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteBook}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          Dialog SỬA sách
          ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditBook(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa sách — {editBook?.id}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="edit-tensach">Tên sách</label>
              <Input id="edit-tensach" value={editForm.tensach} onChange={e => setEditForm(f => ({ ...f, tensach: e.target.value }))} required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-nhaxuatban">Nhà xuất bản</label>
              <Select value={editForm.nhaxuatban} onValueChange={v => setEditForm(f => ({ ...f, nhaxuatban: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn nhà xuất bản" />
                  <CaretDown className="ml-2 h-4 w-4" />
                </SelectTrigger>
                <SelectContent>
                  {publishers.map(nxb => (
                    <SelectItem key={nxb.manxb} value={nxb.manxb.toString()}>{nxb.tennxb}</SelectItem>
                  ))}
                  <div className="border-t my-1" />
                  <Button type="button" variant="ghost" className="w-full justify-start px-2 py-1 text-left text-amber-600" onClick={() => handleAddNew("nha_xuat_ban")}>+ Thêm nhà xuất bản mới</Button>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-namxb">Năm xuất bản</label>
              <Input id="edit-namxb" type="number" value={editForm.namxb} onChange={e => setEditForm(f => ({ ...f, namxb: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-theloai">Thể loại</label>
              <Select value={editForm.theloai} onValueChange={v => setEditForm(f => ({ ...f, theloai: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn thể loại" />
                  <CaretDown className="ml-2 h-4 w-4" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(tl => (
                    <SelectItem key={tl.matl} value={tl.matl.toString()}>{tl.tentl}</SelectItem>
                  ))}
                  <div className="border-t my-1" />
                  <Button type="button" variant="ghost" className="w-full justify-start px-2 py-1 text-left text-amber-600" onClick={() => handleAddNew("the_loai")}>+ Thêm thể loại mới</Button>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-tongsoluong">Số lượng tồn kho</label>
              <Input id="edit-tongsoluong" type="number" min={0} value={editForm.tongsoluong} onChange={e => setEditForm(f => ({ ...f, tongsoluong: Number(e.target.value) }))} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="edit-mota">Giới thiệu / Mô tả</label>
              <Textarea id="edit-mota" value={editForm.mota} onChange={e => setEditForm(f => ({ ...f, mota: e.target.value }))} rows={4} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-giabia">Giá bìa</label>
              <Input id="edit-giabia" type="number" min={0} value={editForm.giabia} onChange={e => setEditForm(f => ({ ...f, giabia: Number(e.target.value) }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-anhbia">Ảnh bìa</label>
              <Input id="edit-anhbia" type="file" accept="image/*" onChange={handleEditFileChange} />
              {(editForm.previewUrl || editForm.anhbia) && (
                <div className="mt-2 h-16 w-12 rounded border border-slate-200 bg-slate-100 overflow-hidden">
                  <img src={editForm.previewUrl || editForm.anhbia} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
            <DialogFooter className="sm:col-span-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setEditOpen(false); setEditBook(null); }}>Huỷ</Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white" disabled={editLoading}>
                {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal thêm mới thể loại / NXB / tác giả ── */}
      <DynamicFormModal
        open={addEntityOpen}
        onOpenChange={setAddEntityOpen}
        entityType={addEntityType}
        onSuccess={editOpen ? handleAddEntitySuccessForEdit : handleAddEntitySuccess}
      />
    </div>
  );
}
