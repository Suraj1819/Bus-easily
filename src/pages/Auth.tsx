import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// FIX: Corrected import path from react-react-router-dom
// import { useNavigate } from "react-router-dom"; 
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import {
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";

// --- 1. IMPORT THE ACTUAL BUS ASSET HERE ---
import BusImage from '@/assets/bus.png'; 


/* ----------------------------- Original Google Logo ----------------------------- */
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

/* -------------------------- ENV / Redirect URL ------------------------- */
const SITE_URL = "https://buseasily.netlify.app";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  /* ------------------------ Session / Auth listener ------------------------ */
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        checkUserProfile(session.user.id);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        checkUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profile) {
        navigate("/browse");
      } else {
        navigate("/profile");
      }
    } catch {
      navigate("/profile");
    }
  };

  /* ----------------------------- Auth Handlers ---------------------------- */

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${SITE_URL}/auth`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Google authentication failed");
    } finally {
      setGoogleLoading(false); 
    }
  };

  const handleEmailOtp = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${SITE_URL}/auth`,
        },
      });

      if (error) throw error;
      toast.success("Magic link sent! Check your email.");
      setLoginMethod("password");
    } catch (error: any) {
      toast.error(error.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_URL}/auth`,
      });

      if (error) throw error;
      toast.success("Password reset link sent to your email!");
      setShowForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (
      !email ||
      (!isLogin && !password) ||
      (isLogin && loginMethod === "password" && !password)
    ) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      if (isLogin && loginMethod === "password") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (!isLogin) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${SITE_URL}/auth`,
          },
        });
        if (error) throw error;
        toast.success("Account created! Please verify your email to continue.");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- Forgot Screen ---------------------------- */

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="w-full max-w-md px-4">
          <Card className="border-none shadow-xl rounded-2xl">
            <CardHeader className="pt-8 text-center space-y-2">
              <div className="mx-auto h-11 w-11 rounded-xl bg-violet-100 flex items-center justify-center mb-1 shadow-inner">
                <Mail className="h-6 w-6 text-violet-500" />
              </div>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Reset your password
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Enter your registered email address and we&apos;ll send you a
                secure reset link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pb-8 px-6">
              <div className="space-y-2 text-left">
                <Label htmlFor="email" className="text-slate-800">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="py-5 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-11 rounded-xl"
                />
              </div>
              <Button
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full py-5 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl shadow-md"
              >
                {loading ? "Sending link..." : "Send reset link"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowForgotPassword(false)}
                className="w-full py-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm"
              >
                Back to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ----------------------------- Main Screen (White UI) ------------------------------ */

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT: Auth form (Responsive: full width on mobile, half on large screens) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-sm">
          
          {/* BUSEASILY LOGO AND NAME */}
          <div className="mb-8 flex flex-col items-center">
            <div className="p-3 bg-slate-50 rounded-2xl shadow-lg border border-slate-100">
                <img 
                    src={BusImage} 
                    alt="Buseasily Logo" 
                    className="w-10 h-10" 
                />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-3 tracking-tight">
                Buseasily
            </h1>
          </div>

          <Card className="shadow-xl border border-slate-100 rounded-3xl">
            <CardHeader className="pt-6 pb-4 text-center space-y-1">
              <CardTitle className="text-xl font-semibold text-slate-900">
                {isLogin ? "Login" : "Create your account"}
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Use your college email to sign in and reserve bus seats in seconds.
              </CardDescription>
            </CardHeader>

            {/* Form Content - Using key change for smooth fade transition */}
            <CardContent 
                key={isLogin ? 'login' : 'signup'} 
                className="space-y-5 pb-6 px-6 transition-opacity duration-300 ease-in-out"
            >
              {/* Google button with processing indicator */}
              <Button
                onClick={handleGoogleAuth}
                disabled={googleLoading}
                variant="outline"
                className="w-full h-11 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-sm text-slate-700 flex items-center justify-center shadow-sm"
              >
                <div className="flex items-center gap-2">
                  {googleLoading && (
                    <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  <GoogleLogo />
                  <span>{isLogin ? "Sign in with Google" : "Sign up with Google"}</span>
                </div>
              </Button>

              {/* OR separator */}
              <div className="relative my-4">
                <Separator className="bg-slate-200" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[11px] text-slate-400">
                  Or sign in with email
                </span>
              </div>

              {/* EMAIL / PASSWORD FORM */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs text-slate-600"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 text-sm placeholder:text-slate-400"
                  />
                </div>

                {loginMethod === "password" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-xs text-slate-600"
                      >
                        Password
                      </Label>
                      {isLogin && (
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-[11px] text-violet-500 hover:text-violet-600"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 rounded-xl bg-slate-50 border-slate-200 text-sm pr-10 placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {isLogin && loginMethod === "password" && (
                  <div className="flex items-center justify-between mt-1">
                    <label className="flex items-center gap-2 text-[11px] text-slate-500">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-slate-300 text-violet-500"
                      />
                      Keep me logged in
                    </label>
                  </div>
                )}

                {loginMethod === "otp" && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    We&apos;ll send a secure magic link to{" "}
                    <span className="font-mono text-violet-500">
                      {email || "your email"}
                    </span>.
                  </p>
                )}
              </div>

              {/* MAIN BUTTON */}
              <Button
                onClick={
                  loginMethod === "password" ? handleAuth : handleEmailOtp
                }
                disabled={loading}
                className="w-full h-11 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold shadow-md"
              >
                {loading
                  ? loginMethod === "password"
                    ? isLogin
                      ? "Logging in..."
                      : "Creating account..."
                    : "Sending magic link..."
                  : loginMethod === "password"
                  ? isLogin
                    ? "Login"
                    : "Create account"
                  : "Send magic link"}
              </Button>

              {/* BOTTOM LINKS */}
              <div className="flex flex-col gap-1 text-center text-[12px] text-slate-500">
                <button
                  type="button"
                  onClick={() =>
                    setLoginMethod((m) => (m === "password" ? "otp" : "password"))
                  }
                  className="text-violet-500 hover:text-violet-600"
                >
                  {loginMethod === "password"
                    ? "Login with magic link"
                    : "Login with password"}
                </button>

                <p>
                  {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin((v) => !v);
                      setPassword("");
                      setShowPassword(false);
                    }}
                    className="text-violet-500 font-medium hover:text-violet-600"
                  >
                    {isLogin ? "Sign up" : "Login"}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RIGHT: Hero Section - Professional & Branded */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden bg-white border-l border-slate-100 shadow-inner">
        
        {/* Background Gradient/Subtle Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-[#f0f4f8]" />

        {/* Central Branding Element */}
        <div className="relative z-20 p-8 max-w-lg mx-auto text-center">
            
            {/* Prominent Logo Display */}
            <div className="mb-6 inline-block p-5 bg-violet-50 rounded-3xl shadow-2xl shadow-violet-200/50 transform hover:scale-[1.02] transition duration-500 ease-in-out">
                <img 
                    src={BusImage} 
                    alt="Buseasily Logo" 
                    className="w-20 h-20" 
                />
            </div>

            {/* Headline - Strong and Clear Branding */}
            <h2 className="text-6xl font-extrabold text-slate-900 leading-snug mb-3">
                Buseasily.
            </h2>
            <h2 className="text-4xl font-semibold text-slate-700 leading-snug mb-6">
                Your Campus Mobility, Simplified.
            </h2>
            
            {/* Descriptive Text */}
            <p className="text-xl text-slate-500 mb-10 max-w-xs mx-auto">
                Reserve seats, track routes, and manage all your campus transit needs from one secure dashboard.
            </p>
            
            {/* Subtle Decorative Element (Fade to White at bottom) */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/50 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default Auth;