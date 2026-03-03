import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { login, register } from "../services/api";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = isRegister ? register : login;
    fn({ email, password })
      .then((res) => {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        navigate("/dashboard", { replace: true });
      })
      .catch((err) => {
        setError(err.response?.data?.error ?? "Request failed");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-4">
            {isRegister ? "Register" : "Sign in"}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isRegister ? 8 : undefined}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
            {error && (
              <p className="text-base text-red-600">{error}</p>
            )}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Please wait…" : isRegister ? "Register" : "Sign in"}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => { setIsRegister((v) => !v); setError(null); }}
            className="mt-4 text-base text-blue-600 hover:underline"
          >
            {isRegister ? "Already have an account? Sign in" : "Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
