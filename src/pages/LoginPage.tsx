import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
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
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6">
      <div className="relative w-full max-w-[420px] animate-fade-in">
        <Card variant="glass" className="p-6 md:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-button bg-gradient-primary flex items-center justify-center mb-4 shadow-soft-glow">
              <span className="text-white font-semibold text-lg">A</span>
            </div>
            <h1 className="text-xl font-semibold text-ds-text">
              {isRegister ? "Create account" : "Welcome back"}
            </h1>
            <p className="text-[15px] text-ds-muted mt-1">
              {isRegister ? "Sign up to get started" : "Sign in to continue"}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <p className="text-[15px] text-red-400">{error}</p>
            )}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Please wait…" : isRegister ? "Register" : "Sign in"}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => { setIsRegister((v) => !v); setError(null); }}
            className="mt-6 text-[15px] text-ds-muted hover:text-blue-400 transition-colors duration-200 w-full text-center"
          >
            {isRegister ? "Already have an account? Sign in" : "Create an account"}
          </button>
        </Card>
      </div>
    </div>
  );
}
