import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="dark min-h-screen bg-auth-dark">
      <Outlet />
    </div>
  );
}
