import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// ─── Schema cho từng entity type ──────────────────────────────────────────────
type FieldSchema = {
  name: string;
  label: string;
  type: "text";
  required: boolean;
  placeholder?: string;
};

type EntitySchema = {
  title: string;
  fields: FieldSchema[];
};

const ENTITY_SCHEMAS: Record<EntityType, EntitySchema> = {
  the_loai: {
    title: "Thêm Thể Loại Mới",
    fields: [
      {
        name: "tentl",
        label: "Tên thể loại",
        type: "text",
        required: true,
        placeholder: "VD: Văn học trong nước",
      },
    ],
  },
  nha_xuat_ban: {
    title: "Thêm Nhà Xuất Bản Mới",
    fields: [
      {
        name: "tennxb",
        label: "Tên nhà xuất bản",
        type: "text",
        required: true,
        placeholder: "VD: NXB Trẻ",
      },
      {
        name: "diachi",
        label: "Địa chỉ",
        type: "text",
        required: false,
        placeholder: "VD: 161B Lý Chính Thắng, Q.3, TP.HCM",
      },
    ],
  },
  tac_gia: {
    title: "Thêm Tác Giả Mới",
    fields: [
      {
        name: "hotg",
        label: "Họ",
        type: "text",
        required: true,
        placeholder: "VD: Nguyễn",
      },
      {
        name: "tenlottg",
        label: "Tên lót",
        type: "text",
        required: false,
        placeholder: "VD: Nhật",
      },
      {
        name: "tentg",
        label: "Tên",
        type: "text",
        required: true,
        placeholder: "VD: Ánh",
      },
      {
        name: "quequan",
        label: "Quê quán",
        type: "text",
        required: false,
        placeholder: "VD: Quảng Nam",
      },
    ],
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type EntityType = "the_loai" | "nha_xuat_ban" | "tac_gia";

export type DynamicFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  onSuccess: (data: Record<string, any>) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────
export function DynamicFormModal({
  open,
  onOpenChange,
  entityType,
  onSuccess,
}: DynamicFormModalProps) {
  const schema = ENTITY_SCHEMAS[entityType];

  // Form state: { fieldName: value }
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form khi mở/đóng hoặc đổi entityType
  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      schema.fields.forEach((f) => {
        initial[f.name] = "";
      });
      setFormData(initial);
      setError(null);
    }
  }, [open, entityType]);

  function handleChange(fieldName: string, value: string) {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Xóa lỗi khi người dùng bắt đầu nhập lại
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate required fields
    for (const field of schema.fields) {
      if (field.required && !formData[field.name]?.trim()) {
        setError(`Vui lòng nhập ${field.label}.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    // Chuẩn bị payload (loại bỏ giá trị rỗng)
    const payload: Record<string, string> = {};
    for (const field of schema.fields) {
      const val = formData[field.name]?.trim();
      if (val) {
        payload[field.name] = val;
      }
    }

    const { data, error: apiError } = await supabase
      .from(entityType)
      .insert(payload)
      .select();

    setIsSubmitting(false);

    if (apiError || !data || !data[0]) {
      // Xử lý lỗi trùng (409 Conflict) hoặc các lỗi khác
      const msg = apiError?.message || "Đã xảy ra lỗi không xác định.";
      if (apiError?.code === "23505" || msg.toLowerCase().includes("duplicate")) {
        setError("Dữ liệu đã tồn tại. Vui lòng kiểm tra và thử lại.");
      } else {
        setError(msg);
      }
      return;
    }

    // Thành công → callback + đóng modal
    onSuccess(data[0]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{schema.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {schema.fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={`dynamic-${field.name}`}>
                {field.label}
                {field.required && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </Label>
              <Input
                id={`dynamic-${field.name}`}
                type={field.type}
                value={formData[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                autoFocus={field === schema.fields[0]}
              />
            </div>
          ))}

          {/* Inline error message */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
