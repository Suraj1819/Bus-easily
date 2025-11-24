import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bus, Mail } from "lucide-react";

const GoogleLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // Session check for existing users
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        
        if (profile) {
          navigate("/browse");
        } else {
          navigate("/profile");
        }
      }
    };
    
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check profile and redirect
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
    } catch (error) {
      navigate("/profile");
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`, // Callback to auth page
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Google authentication failed");
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
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });
      
      if (error) throw error;
      toast.success("Check your email for the login link!");
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
        redirectTo: `${window.location.origin}/auth`,
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
    if (!email || (!isLogin && !password)) {
      toast.error("Please enter email and password");
      return;
    }
    
    setLoading(true);
    try {
      if (isLogin && loginMethod === 'password') {
        // Login with password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // Check profile and redirect (handled by useEffect)
      } else if (!isLogin) {
        // Signup with email/password
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
          }
        });
        
        if (error) throw error;
        
        toast.success("Account created! Please check your email for verification.");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pt-8">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Reset Password</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="py-5"
              />
            </div>
            <Button onClick={handleForgotPassword} disabled={loading} className="w-full py-6">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowForgotPassword(false)} 
              className="w-full py-5 text-indigo-600 hover:text-indigo-800"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pt-8">
          <div className="flex justify-center mb-4">
            <Bus className="h-12 w-12 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">College Bus Booking</CardTitle>
          <CardDescription className="text-gray-600">
            {isLogin ? "Login to your account" : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <Button 
            onClick={handleGoogleAuth} 
            disabled={googleLoading} 
            variant="outline" 
            className="w-full py-5 border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-3"
          >
            <GoogleLogo />
            {googleLoading && (
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            )}
            <span className="text-gray-700">Continue with Google</span>
          </Button>
          
          <div className="relative">
            <Separator className="bg-gray-300" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-gray-500">
              OR
            </span>
          </div>

          {!isLogin ? (
            // Signup form - only email/password
            <>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-gray-700">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="py-5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-gray-700">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="py-5"
                />
              </div>
              <Button 
                onClick={handleAuth} 
                disabled={loading} 
                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </Button>
              
              <div className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Button 
                  variant="link" 
                  onClick={() => setIsLogin(true)} 
                  className="p-0 h-auto text-indigo-600 hover:text-indigo-800"
                >
                  Login
                </Button>
              </div>
            </>
          ) : (
            // Login form - with password and OTP options
            <>
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-gray-700">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="py-5"
                />
              </div>
              
              {loginMethod === 'password' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-gray-700">Password</Label>
                    <Button 
                      variant="link" 
                      onClick={() => setShowForgotPassword(true)}
                      className="p-0 h-auto text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Forgot Password?
                    </Button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="py-5"
                  />
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">
                    We'll send you a magic link to your email
                  </p>
                </div>
              )}
              
              <Button 
                onClick={loginMethod === 'password' ? handleAuth : handleEmailOtp} 
                disabled={loading} 
                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading 
                  ? (loginMethod === 'password' ? "Logging in..." : "Sending link...") 
                  : (loginMethod === 'password' ? "Login" : "Send Magic Link")}
              </Button>
              
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => setLoginMethod(loginMethod === 'password' ? 'otp' : 'password')} 
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  {loginMethod === 'password' 
                    ? "Login with Magic Link" 
                    : "Login with Password"}
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Button 
                  variant="link" 
                  onClick={() => setIsLogin(false)} 
                  className="p-0 h-auto text-indigo-600 hover:text-indigo-800"
                >
                  Sign Up
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;