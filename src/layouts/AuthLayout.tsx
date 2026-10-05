import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="user-app-shell min-h-screen bg-[var(--color-bg)]">
      <Outlet />
    </div>
  );
}
