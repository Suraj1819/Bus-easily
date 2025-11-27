import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, GraduationCap, BookOpen, Phone, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CompleteProfile = () => {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if profile already exists
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profile && !error) {
        navigate("/browse");
        return;
      }

      // Pre-fill name from Google if available
      if (session.user.user_metadata?.full_name) {
        setName(session.user.user_metadata.full_name);
      }

      setInitialLoading(false);
    };

    checkAuthAndProfile();
  }, [navigate]);

  const createProfile = async () => {
    if (!name || !branch || !year) {
      toast.error("Please fill all required fields");
      return;
    }

    if (phone && phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Check if profile already exists (double check)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existingProfile) {
        navigate("/browse");
        return;
      }

      const { error } = await supabase.from("profiles").insert({
        user_id: user.id,
        phone: phone || null,
        name,
        branch: branch as Database["public"]["Enums"]["branch"],
        year: year as Database["public"]["Enums"]["year"],
        email: user.email || null,
      });

      if (error) throw error;

      // Assign default role as student
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: 'student'
      });

      if (roleError) throw roleError;

      setIsSubmitted(true);
      setTimeout(() => {
        toast.success("Profile created successfully!");
        navigate("/browse");
      }, 1500);
    } catch (error: any) {
      console.error("Profile creation error:", error);
      toast.error(error.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"
          />
          <p className="mt-4 text-gray-600 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Card className="max-w-md w-full shadow-xl">
            <CardHeader className="bg-blue-600 text-white pt-8 pb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Profile Created Successfully!</CardTitle>
              <CardDescription className="text-blue-100">
                Redirecting you to the dashboard...
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <motion.div
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 1.5 }}
                className="h-1 bg-blue-600 rounded-full"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl rounded-2xl overflow-hidden border border-gray-200">
          <CardHeader className="bg-white border-b border-gray-200 pt-8 pb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 text-center">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Let's get to know you better to personalize your experience
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 py-5 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch" className="text-gray-700 font-medium">Branch</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger className="pl-10 py-5 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select your branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSE">Computer Science (CSE)</SelectItem>
                    <SelectItem value="ECE">Electronics & Communication (ECE)</SelectItem>
                    <SelectItem value="EEE">Electrical & Electronics (EEE)</SelectItem>
                    <SelectItem value="MECH">Mechanical (MECH)</SelectItem>
                    <SelectItem value="CIVIL">Civil Engineering</SelectItem>
                    <SelectItem value="IT">Information Technology (IT)</SelectItem>
                    <SelectItem value="CHEMICAL">Chemical Engineering</SelectItem>
                    <SelectItem value="BIOTECH">Biotechnology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year" className="text-gray-700 font-medium">Year of Study</Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="pl-10 py-5 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select your year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st Year</SelectItem>
                    <SelectItem value="2nd">2nd Year</SelectItem>
                    <SelectItem value="3rd">3rd Year</SelectItem>
                    <SelectItem value="4th">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <div className="flex">
                  <span className="flex items-center px-4 bg-gray-100 rounded-l-md text-gray-600 border border-r-0 border-gray-300">+91</span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    className="py-5 rounded-l-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={createProfile}
              disabled={loading}
              className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Creating Profile...</span>
                </div>
              ) : (
                "Complete Registration"
              )}
            </Button>

            <div className="flex items-center gap-2 text-center text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span>Your information is secure and will not be shared with third parties</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;