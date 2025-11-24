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
import { User } from "lucide-react";

const CompleteProfile = () => {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
        phone: phone || user.user_metadata?.phone || "",
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
      
      toast.success("Profile created successfully!");
      navigate("/browse");
    } catch (error: any) {
      console.error("Profile creation error:", error);
      toast.error(error.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pt-8">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-100 p-3 rounded-full">
              <User className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Complete Your Profile</CardTitle>
          <CardDescription className="text-gray-600">
            Please provide your details to complete registration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700">Full Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="py-5"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="branch" className="text-gray-700">Branch *</Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="py-5">
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
          
          <div className="space-y-2">
            <Label htmlFor="year" className="text-gray-700">Year of Study *</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="py-5">
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
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-700">Phone Number (Optional)</Label>
            <div className="flex gap-2">
              <span className="flex items-center px-4 bg-gray-100 rounded-md text-gray-600 border border-gray-300">+91</span>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                className="py-5"
              />
            </div>
          </div>
          
          <Button 
            onClick={createProfile} 
            disabled={loading} 
            className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 mt-4"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Profile...</span>
              </div>
            ) : (
              "Complete Registration"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;