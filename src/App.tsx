import { AdminLayout } from "@/layouts/AdminLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Inventory } from "@/pages/Inventory";
import { Orders } from "@/pages/Orders";
import { Members } from "@/pages/Members";
import { Placeholder } from "@/pages/Placeholder";
import { LoginPage } from "@/pages/LoginPage";
import "./index.css";

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="members" element={<Members />} />
                  <Route
                    path="staff"
                    element={
                      <Placeholder
                        title="Nhân viên"
                        description="(Sắp có) Quản lý tài khoản nhân viên (NHAN_VIEN / staff_accounts)."
                      />
                    }
                  />
                  <Route
                    path="reports"
                    element={
                      <Placeholder
                        title="Báo cáo"
                        description="(Sắp có) Thống kê và xuất dữ liệu."
                      />
                    }
                  />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
