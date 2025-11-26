import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  ArrowLeft,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import BusImage from '@/assets/bus.png';

/* ----------------------------- Google Logo ----------------------------- */
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const SITE_URL = "https://buseasily.netlify.app";

type AuthStep = "email" | "otp";
type AuthMode = "signin" | "signup";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authStep, setAuthStep] = useState<AuthStep>("email");
  const [loginMethod, setLoginMethod] = useState<"otp" | "password">("otp");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ------------------------ Resend Cooldown Timer ------------------------ */
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  /* ------------------------ Session / Auth listener ------------------------ */
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        checkUserProfile(session.user.id);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        toast.success("Login successful!");
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

  /* ----------------------------- OTP Input Handlers ---------------------------- */
  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    const focusIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  /* ----------------------------- Auth Handlers ---------------------------- */

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${SITE_URL}/auth` },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Google authentication failed");
      setGoogleLoading(false);
    }
  };

  // Send OTP using Supabase built-in
  const handleSendOtp = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // Supabase ka built-in signInWithOtp use karo
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Ye true karoge toh new user create hoga agar exist nahi karta
          shouldCreateUser: authMode === "signup",
        },
      });

      if (error) throw error;

      setAuthStep("otp");
      setResendCooldown(60);
      toast.success("6-digit code sent to your email!");
      
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);

    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: authMode === "signup",
        },
      });

      if (error) throw error;

      setOtp(["", "", "", "", "", ""]);
      setResendCooldown(60);
      toast.success("New code sent!");
      otpInputRefs.current[0]?.focus();

    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  // Verify OTP using Supabase built-in
  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpString,
        type: "email", // or 'magiclink' depending on your setup
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Verification successful!");
        // Auth state change listener will handle navigation
      }

    } catch (error: any) {
      toast.error(error.message || "Invalid code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${SITE_URL}/auth` },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to verify.");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
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
      toast.success("Password reset link sent!");
      setShowForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const goBackToEmail = () => {
    setAuthStep("email");
    setOtp(["", "", "", "", "", ""]);
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === "signin" ? "signup" : "signin");
    setAuthStep("email");
    setOtp(["", "", "", "", "", ""]);
    setPassword("");
  };

  /* ----------------------------- Forgot Password Screen ---------------------------- */
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm">
          <Card className="border-none shadow-xl rounded-2xl">
            <CardHeader className="pt-8 text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center mb-1">
                <Mail className="h-6 w-6 text-violet-500" />
              </div>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Reset your password
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Enter your email and we'll send you a reset link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8 px-6">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-slate-700 text-sm">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
              <Button
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-violet-500 hover:bg-violet-600"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-slate-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ----------------------------- OTP Screen ---------------------------- */
  if (authStep === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center">
            <div className="p-3 bg-slate-50 rounded-2xl shadow-lg border border-slate-100">
              <img src={BusImage} alt="Buseasily" className="w-10 h-10" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Buseasily</h1>
          </div>

          <Card className="shadow-xl border border-slate-100 rounded-3xl">
            <CardHeader className="pt-6 pb-2 text-center space-y-1">
              <div className="mx-auto h-14 w-14 rounded-full bg-violet-100 flex items-center justify-center mb-2">
                <Mail className="h-7 w-7 text-violet-500" />
              </div>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Enter verification code
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm px-4">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-slate-700 break-all">{email}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pb-6 px-6">
              {/* OTP Inputs */}
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all duration-200 outline-none
                      ${digit 
                        ? "border-violet-500 bg-violet-50 text-violet-700" 
                        : "border-slate-200 bg-slate-50 text-slate-900"
                      }
                      focus:border-violet-500 focus:ring-2 focus:ring-violet-100
                    `}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerifyOtp}
                disabled={loading || otp.join("").length !== 6}
                className="w-full h-11 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Verify & Continue
                  </>
                )}
              </Button>

              {/* Resend */}
              <div className="text-center space-y-2">
                <p className="text-sm text-slate-500">Didn't receive the code?</p>
                <button
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resendLoading}
                  className={`text-sm font-medium flex items-center justify-center gap-1 mx-auto
                    ${resendCooldown > 0 ? "text-slate-400" : "text-violet-500 hover:text-violet-600"}
                  `}
                >
                  {resendLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>

              {/* Back */}
              <Button
                variant="ghost"
                onClick={goBackToEmail}
                className="w-full text-slate-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Change email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ----------------------------- Main Screen ---------------------------- */
  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm">
          
          {/* Logo */}
          <div className="mb-6 sm:mb-8 flex flex-col items-center">
            <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl sm:rounded-2xl shadow-lg border border-slate-100">
              <img src={BusImage} alt="Buseasily" className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 sm:mt-3">
              Buseasily
            </h1>
          </div>

          <Card className="shadow-xl border border-slate-100 rounded-2xl sm:rounded-3xl">
            <CardHeader className="pt-5 sm:pt-6 pb-3 sm:pb-4 text-center space-y-1">
              <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900">
                {authMode === "signin" ? "Welcome back" : "Create account"}
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs sm:text-sm">
                {authMode === "signin" 
                  ? "Sign in to book your bus seats" 
                  : "Join Buseasily to start booking"
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-5 pb-5 sm:pb-6 px-4 sm:px-6">
              {/* Google */}
              <Button
                onClick={handleGoogleAuth}
                disabled={googleLoading}
                variant="outline"
                className="w-full h-10 sm:h-11 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <span className="mr-2"><GoogleLogo /></span>
                )}
                Continue with Google
              </Button>

              {/* Separator */}
              <div className="relative my-3">
                <Separator className="bg-slate-200" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[10px] sm:text-[11px] text-slate-400">
                  Or with email
                </span>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-slate-600">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 text-sm"
                />
              </div>

              {/* Password (if password method) */}
              {loginMethod === "password" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs text-slate-600">Password</Label>
                    {authMode === "signin" && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-[10px] sm:text-[11px] text-violet-500 hover:text-violet-600"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Main Button */}
              <Button
                onClick={loginMethod === "otp" ? handleSendOtp : handlePasswordAuth}
                disabled={loading}
                className="w-full h-10 sm:h-11 rounded-xl bg-violet-500 hover:bg-violet-600 text-sm font-semibold"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : loginMethod === "otp" ? (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send verification code
                  </>
                ) : (
                  authMode === "signin" ? "Sign in" : "Create account"
                )}
              </Button>

              {/* Toggle Method & Mode */}
              <div className="flex flex-col gap-1 text-center text-[11px] sm:text-[12px] text-slate-500">
                <button
                  type="button"
                  onClick={() => setLoginMethod(loginMethod === "otp" ? "password" : "otp")}
                  className="text-violet-500 hover:text-violet-600"
                >
                  {loginMethod === "otp" ? "Use password instead" : "Use email code instead"}
                </button>

                <p className="mt-1">
                  {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={switchAuthMode}
                    className="text-violet-500 font-medium hover:text-violet-600"
                  >
                    {authMode === "signin" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-4 px-4">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-violet-500 hover:underline">Terms</a>
            {" "}and{" "}
            <a href="/privacy" className="text-violet-500 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* RIGHT: Hero (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-gradient-to-br from-white via-slate-50 to-violet-50 border-l border-slate-100">
        <div className="text-center p-8 max-w-lg">
          <div className="mb-6 inline-block p-5 bg-violet-50 rounded-3xl shadow-2xl shadow-violet-200/50">
            <img src={BusImage} alt="Buseasily" className="w-20 h-20" />
          </div>
          <h2 className="text-5xl xl:text-6xl font-extrabold text-slate-900 mb-3">Buseasily.</h2>
          <h3 className="text-2xl xl:text-3xl font-semibold text-slate-700 mb-6">
            Campus Mobility, Simplified.
          </h3>
          <p className="text-lg text-slate-500 max-w-sm mx-auto">
            Reserve seats, track routes, and manage your campus transit from one dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;