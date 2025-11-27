import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Icons
import {
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  Lock,
} from "lucide-react";

// UI Components
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

// Assets
import BusImage from "@/assets/bus.png";

/* ----------------------------- Google Logo ----------------------------- */
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

/* ----------------------------- Constants ----------------------------- */
const SITE_URL = import.meta.env.VITE_SITE_URL || "https://buseasily.netlify.app";

/* ----------------------------- Types ----------------------------- */
type AuthStep = "email" | "otp" | "phone-otp" | "reset-password";
type AuthMode = "signin" | "signup";
type OtpType = "email" | "phone";

/* ----------------------------- Component ----------------------------- */
const Auth = () => {
  /* ---------- Form State ---------- */
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetPassword, setResetPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* ---------- Auth Flow State ---------- */
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authStep, setAuthStep] = useState<AuthStep>("email");
  const [loginMethod, setLoginMethod] = useState<"otp" | "password">("otp");
  const [otpType, setOtpType] = useState<OtpType>("email");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  /* ---------- UI State ---------- */
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

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
      const { data } = await supabase.auth.getSession();
      if (data.session) checkUserProfile(data.session.user.id);
    };

    checkSession();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        toast.success("Login successful!");
        checkUserProfile(session.user.id);
      }
    });

    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const checkUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      navigate(profile ? "/browse" : "/profile");
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

    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  /* ----------------------------- Edge Function Handlers ---------------------------- */
  const handleSendOtp = async () => {
    if (otpType === "email") {
      if (!email) return toast.error("Email required");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return toast.error("Invalid email");
    } else {
      if (!phone) return toast.error("Phone required");
      if (!/^\+?[0-9]{10,15}$/.test(phone))
        return toast.error("Invalid phone");
    }

    setLoading(true);
    try {
      const payload = {
        [otpType === "email" ? "email" : "phone"]: otpType === "email" ? email : phone,
        type: authMode === "signup" ? "signup" : "signin",
      };

      const { data, error } = await supabase.functions.invoke("send-email-otp", {
        body: JSON.stringify(payload),
      });

      if (error) throw error;

      if (data.success) {
        setAuthStep(otpType === "email" ? "otp" : "phone-otp");
        setResendCooldown(60);
        toast.success(`6-digit code sent to your ${otpType}!`);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      } else throw new Error(data.message || "Failed to send OTP");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phone) return toast.error("Phone required");
    if (!/^\+?[0-9]{10,15}$/.test(phone)) return toast.error("Invalid phone");

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-phone-otp", {
        body: JSON.stringify({ phone, type: authMode === "signup" ? "signup" : "signin" }),
      });

      if (error) throw error;

      if (data.success) {
        setAuthStep("phone-otp");
        setResendCooldown(60);
        toast.success("6-digit code sent to your phone!");
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      } else throw new Error(data.message || "Failed to send OTP");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) return toast.error("Enter full 6-digit code");

    setLoading(true);
    try {
      const payload = {
        [otpType === "email" ? "email" : "phone"]: otpType === "email" ? email : phone,
        token: code,
        type: authMode,
      };

      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: JSON.stringify(payload),
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Verification successful!");
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) checkUserProfile(userData.user.id);
      } else throw new Error(data.message || "Invalid code");
    } catch (err: any) {
      toast.error(err.message || "Invalid code");
      setOtp(Array(6).fill(""));
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) return toast.error("Email required");

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-password", {
        body: JSON.stringify({ email }),
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Password reset link sent to your email!");
        setShowForgotPassword(false);
        setAuthStep("reset-password");
      } else throw new Error(data.message || "Failed to send reset link");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!resetPassword) return toast.error("New password required");
    if (resetPassword !== confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-password", {
        body: JSON.stringify({
          email,
          new_password: resetPassword,
          token: otp.join(""),
        }),
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Password updated successfully!");
        setAuthStep("email");
        setAuthMode("signin");
      } else throw new Error(data.message || "Failed to update password");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${SITE_URL}/auth` },
      });
    } catch (err: any) {
      toast.error(err.message || "Google auth failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordAuth = async () => {
    if (!email || !password) return toast.error("Email & password required");

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
    } catch (err: any) {
      toast.error(err.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  const goBackToEmail = () => {
    setAuthStep("email");
    setOtp(Array(6).fill(""));
    setOtpType("email");
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === "signin" ? "signup" : "signin");
    setAuthStep("email");
    setOtp(Array(6).fill(""));
    setPassword("");
    setOtpType("email");
  };

  /* ----------------------------- Render Logic ----------------------------- */
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
                <Label htmlFor="reset-email" className="text-slate-700 text-sm">
                  Email
                </Label>
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
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-violet-500 hover:bg-violet-600"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send reset link"
                )}
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

  if (authStep === "reset-password") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center">
            <div className="p-3 bg-slate-50 rounded-2xl shadow-lg border border-slate-100">
              <Lock className="w-10 h-10 text-violet-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Reset Password</h1>
          </div>

          <Card className="shadow-xl border border-slate-100 rounded-3xl">
            <CardHeader className="pt-6 pb-2 text-center space-y-1">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Create new password
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm px-4">
                Enter your new password below
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pb-6 px-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-slate-700 text-sm">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showResetPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="h-11 rounded-xl bg-slate-50 border-slate-200 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
                    >
                      {showResetPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-password"
                    className="text-slate-700 text-sm"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 rounded-xl bg-slate-50 border-slate-200 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleUpdatePassword}
                disabled={loading || !resetPassword || resetPassword !== confirmPassword}
                className="w-full h-11 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setAuthStep("email");
                  setAuthMode("signin");
                }}
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

  if (authStep === "otp" || authStep === "phone-otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center">
            <div className="p-3 bg-slate-50 rounded-2xl shadow-lg border border-slate-100">
              {otpType === "email" ? (
                <Mail className="w-10 h-10 text-violet-500" />
              ) : (
                <Smartphone className="w-10 h-10 text-violet-500" />
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Buseasily</h1>
          </div>

          <Card className="shadow-xl border border-slate-100 rounded-3xl">
            <CardHeader className="pt-6 pb-2 text-center space-y-1">
              <div className="mx-auto h-14 w-14 rounded-full bg-violet-100 flex items-center justify-center mb-2">
                {otpType === "email" ? (
                  <Mail className="h-7 w-7 text-violet-500" />
                ) : (
                  <Smartphone className="h-7 w-7 text-violet-500" />
                )}
              </div>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Enter verification code
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm px-4">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-slate-700 break-all">
                  {otpType === "email" ? email : phone}
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pb-6 px-6">
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
                    className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all duration-200 outline-none ${
                      digit
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-200 bg-slate-50 text-slate-900"
                    } focus:border-violet-500 focus:ring-2 focus:ring-violet-100`}
                  />
                ))}
              </div>

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

              <div className="text-center space-y-2">
                <p className="text-sm text-slate-500">Didn't receive the code?</p>
                <button
                  onClick={
                    otpType === "email" ? handleSendOtp : handleSendPhoneOtp
                  }
                  disabled={resendCooldown > 0 || resendLoading}
                  className={`text-sm font-medium flex items-center justify-center gap-1 mx-auto ${
                    resendCooldown > 0
                      ? "text-slate-400"
                      : "text-violet-500 hover:text-violet-600"
                  }`}
                >
                  {resendLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend code"}
                </button>
              </div>

              <Button
                variant="ghost"
                onClick={goBackToEmail}
                className="w-full text-slate-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Change {otpType === "email" ? "email" : "phone"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 sm:mb-8 flex flex-col items-center">
            <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl sm:rounded-2xl shadow-lg border border-slate-100">
              <img
                src={BusImage}
                alt="Buseasily"
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
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
                  : "Join Buseasily to start booking"}
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
                  <span className="mr-2">
                    <GoogleLogo />
                  </span>
                )}
                Continue with Google
              </Button>

              {/* Separator */}
              <div className="relative my-3">
                <Separator className="bg-slate-200" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[10px] sm:text-[11px] text-slate-400">
                  Or with {otpType === "email" ? "email" : "phone"}
                </span>
              </div>

              {/* Email/Phone Toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={otpType === "email" ? "default" : "outline"}
                  className={`flex-1 h-9 text-sm ${
                    otpType === "email"
                      ? "bg-violet-500 hover:bg-violet-600"
                      : "bg-white border-slate-200"
                  }`}
                  onClick={() => setOtpType("email")}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={otpType === "phone" ? "default" : "outline"}
                  className={`flex-1 h-9 text-sm ${
                    otpType === "phone"
                      ? "bg-violet-500 hover:bg-violet-600"
                      : "bg-white border-slate-200"
                  }`}
                  onClick={() => setOtpType("phone")}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Phone
                </Button>
              </div>

              {/* Email or Phone Input */}
              <div className="space-y-1.5">
                <Label htmlFor={otpType} className="text-xs text-slate-600">
                  {otpType === "email" ? "Email" : "Phone Number"}
                </Label>
                <Input
                  id={otpType}
                  type={otpType === "email" ? "email" : "tel"}
                  placeholder={
                    otpType === "email"
                      ? ""
                      : ""
                  }
                  value={otpType === "email" ? email : phone}
                  onChange={(e) =>
                    otpType === "email"
                      ? setEmail(e.target.value)
                      : setPhone(e.target.value)
                  }
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 text-sm"
                />
              </div>

              {/* Password (if password method) */}
              {loginMethod === "password" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-xs text-slate-600"
                    >
                      Password
                    </Label>
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
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Main Button */}
              <Button
                onClick={
                  loginMethod === "otp" ? handleSendOtp : handlePasswordAuth
                }
                disabled={loading}
                className="w-full h-10 sm:h-11 rounded-xl bg-violet-500 hover:bg-violet-600 text-sm font-semibold"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : loginMethod === "otp" ? (
                  <>
                    {otpType === "email" ? (
                      <Mail className="h-4 w-4 mr-2" />
                    ) : (
                      <Smartphone className="h-4 w-4 mr-2" />
                    )}
                    Send verification code
                  </>
                ) : authMode === "signin" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </Button>

              {/* Toggle Method & Mode */}
              <div className="flex flex-col gap-1 text-center text-[11px] sm:text-[12px] text-slate-500">
                <button
                  type="button"
                  onClick={() =>
                    setLoginMethod(loginMethod === "otp" ? "password" : "otp")
                  }
                  className="text-violet-500 hover:text-violet-600"
                >
                  {loginMethod === "otp"
                    ? "Use password instead"
                    : "Use verification code instead"}
                </button>

                <p className="mt-1">
                  {authMode === "signin"
                    ? "Don't have an account?"
                    : "Already have an account?"}{" "}
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
        </div>
      </div>

      {/* RIGHT: Hero Image (hidden on small screens) */}
      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1600&q=80')",
        }}
      >
       <div className="h-full w-full flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center text-white px-8 max-w-md">
            <h2 className="text-3xl font-bold mb-4 drop-shadow-lg">
              Book Bus Tickets With Ease
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Explore, book, and travel hassle-free with Buseasily.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;