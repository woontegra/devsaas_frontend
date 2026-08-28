import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#F4F7F7]">
      <Outlet />
    </div>
  );
}
