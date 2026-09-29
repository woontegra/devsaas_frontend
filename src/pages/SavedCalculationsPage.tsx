import { useNavigate } from "react-router-dom";
import { SavedCalculationsView } from "../modules/actuarial/SavedCalculationsView";

export function SavedCalculationsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-58px)] bg-[#F5F7FA] pb-5">
      <div className="app-workspace dashboard-workspace py-3 sm:py-4">
        <SavedCalculationsView
          onBack={() => navigate("/dashboard")}
          onOpen={(id) => {
            navigate("/dashboard", { state: { openSavedId: id } });
          }}
        />
      </div>
    </div>
  );
}
