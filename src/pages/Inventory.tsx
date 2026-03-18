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
import { PencilSimple, Trash, CaretDown } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicFormModal, type EntityType } from "@/components/DynamicFormModal";

type InventoryStatus =
  | "Còn hàng"
  | "Sắp hết"
  | "Hết hàng"
  | "Ngừng kinh doanh";

type InventoryBookRow = {
  id: string; // Book ID (MaDauSach / books.id)
  title: string;
  authors: string;
  totalQuantity: number;
  status: InventoryStatus;
  coverUrl: string;
};

function getInventoryBadge(status: InventoryStatus) {
  switch (status) {
    case "Còn hàng":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Sắp hết":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Hết hàng":
      return "bg-red-100 text-red-700 border-red-200";
    case "Ngừng kinh doanh":
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function Inventory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InventoryStatus>("all");
  const [books, setBooks] = useState<InventoryBookRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
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

  // State cho combobox
  const [categories, setCategories] = useState<{ matl: number; tentl: string }[]>([]);
  const [publishers, setPublishers] = useState<{ manxb: number; tennxb: string }[]>([]);
  const [authors, setAuthors] = useState<{ matg: number; tentg: string }[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>("");

  // State cho DynamicFormModal (thay thế window.prompt)
  const [addEntityOpen, setAddEntityOpen] = useState(false);
  const [addEntityType, setAddEntityType] = useState<EntityType>("the_loai");

  useEffect(() => {
    async function fetchBooks() {
      setIsLoading(true);
      const { data, error } = await supabase.from("dau_sach").select("*");
      if (error) {
        setBooks([]);
      } else {
        setBooks(
          (data || []).map((b: any) => ({
            id: b.mads || "",
            title: b.tensach || "",
            authors: b.mota || "", // Không có cột tác giả, tạm dùng mô tả hoặc để trống
            totalQuantity: b.tongsoluong || 0,
            status: "Còn hàng", // Nếu có cột trạng thái thì map, còn không mặc định
            coverUrl: b.anhbia || "https://placehold.co/72x96/png?text=Cover",
          }))
        );
      }
      setIsLoading(false);
    }
    fetchBooks();
  }, []);

  // Fetch dữ liệu khi mở modal
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setForm(f => ({ ...f, file, previewUrl: URL.createObjectURL(file) }));
    }
  }

  // Mở modal thêm mới thể loại, NXB, tác giả (thay thế window.prompt)
  function handleAddNew(type: EntityType) {
    setAddEntityType(type);
    setAddEntityOpen(true);
  }

  // Callback khi thêm mới thành công từ DynamicFormModal
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
      // Lấy public URL
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
      matl: Number(form.theloai), // map input thể loại vào matl
      manxb: Number(form.nhaxuatban), // map input nhà xuất bản vào manxb
      anhbia: coverUrl,
    };
    // Insert vào dau_sach
    const { data: bookData, error: insertError } = await supabase.from("dau_sach").insert([payload]).select();
    if (insertError || !bookData || !bookData[0]) {
      toast({ variant: "destructive", title: "Thêm sách thất bại", description: insertError?.message });
      setAddLoading(false);
      return;
    }
    // Insert vào chi_tiet_tac_gia
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
    // Refetch data
    setIsLoading(true);
    const { data, error: fetchError } = await supabase.from("dau_sach").select("*");
    if (!fetchError) {
      setBooks(
        (data || []).map((b: any) => ({
          id: b.mads || "",
          title: b.tensach || "",
          authors: b.mota || "",
          totalQuantity: b.tongsoluong || 0,
          status: "Còn hàng",
          coverUrl: b.anhbia || "https://placehold.co/72x96/png?text=Cover",
        }))
      );
    }
    setIsLoading(false);
    setAddLoading(false);
  }

  return (
    <div className="space-y-6">
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
            <Button className="mt-4 sm:mt-0 h-10 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm">
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

      <Card className="rounded-2xl border-0 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base text-slate-900">
              Danh sách kho sách
            </CardTitle>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên sách, tác giả hoặc mã..."
                className="w-full sm:w-[320px]"
              />

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={statusFilter === "all" ? "default" : "outline"}
                  className="h-9"
                  onClick={() => setStatusFilter("all")}
                >
                  Tất cả
                </Button>
                <Button
                  type="button"
                  variant={statusFilter === "Còn hàng" ? "default" : "outline"}
                  className="h-9"
                  onClick={() => setStatusFilter("Còn hàng")}
                >
                  Còn hàng
                </Button>
                <Button
                  type="button"
                  variant={statusFilter === "Sắp hết" ? "default" : "outline"}
                  className="h-9"
                  onClick={() => setStatusFilter("Sắp hết")}
                >
                  Sắp hết
                </Button>
              </div>
            </div>
          </div>
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
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="h-16 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
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
                        className={getInventoryBadge(b.status)}
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          aria-label={`Sửa ${b.title}`}
                        >
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-red-600 hover:text-red-600"
                          aria-label={`Xóa ${b.title}`}
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
      {/* Modal thêm mới thể loại / NXB / tác giả */}
      <DynamicFormModal
        open={addEntityOpen}
        onOpenChange={setAddEntityOpen}
        entityType={addEntityType}
        onSuccess={handleAddEntitySuccess}
      />
    </div>
  );
}
