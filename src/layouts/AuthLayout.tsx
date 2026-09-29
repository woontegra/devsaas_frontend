import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Outlet />
    </div>
  );
}
