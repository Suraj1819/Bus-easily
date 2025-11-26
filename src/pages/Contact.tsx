import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageSquare, 
  Clock, 
  Shield, 
  User, 
  Building2,
  Calendar,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Bus,
  Heart,
  Camera,
  ExternalLink,
  ChevronRight,
  LogIn // Import LogIn for the CTA button
} from "lucide-react";

const Contact = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    category: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Contact categories for better routing
  const categories = [
    { value: "booking", label: "Booking Help", icon: Calendar },
    { value: "technical", label: "Technical Issue", icon: AlertCircle },
    { value: "feedback", label: "Feedback", icon: MessageSquare },
    { value: "complaint", label: "Complaint", icon: AlertCircle },
    { value: "general", label: "General Inquiry", icon: HelpCircle },
    { value: "business", label: "Business Partnership", icon: Building2 },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }
    
    if (formData.phone && !/^[+]?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Phone number is invalid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("contacts").insert({
        user_id: user?.id || null,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: formData.subject,
        message: formData.message,
        category: formData.category,
        priority: getPriority(formData.category),
      });

      if (error) throw error;

      toast.success(
        "Message sent successfully! We'll get back to you soon.",
        {
          icon: <CheckCircle className="h-4 w-4" />,
          duration: 5000,
        }
      );
      
      // Reset form
      setFormData({ 
        name: "", 
        email: "", 
        phone: "", 
        subject: "", 
        message: "", 
        category: "" 
      });
      setErrors({});
      
      // Navigate to the thank you page after a successful message submission
      setTimeout(() => {
        navigate("/thankyou", { state: { name: formData.name, email: formData.email, subject: formData.subject } }); 
      }, 2000); // Delay navigation to allow toast to be seen
      
    } catch (error: any) {
      toast.error(error.message || "Failed to send message", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriority = (category: string) => {
    switch (category) {
      case 'technical':
      case 'complaint':
        return 'high';
      case 'booking':
        return 'medium';
      default:
        return 'low';
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
              <Bus className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Buseasily</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <MessageSquare className="h-4 w-4" />
              We're Here to Help
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Get in Touch With Us
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
              Have questions about bus bookings, need assistance, or want to share feedback? 
              Our team is ready to help you with prompt and personalized support.
            </p>
          </div>

          {/* Quick Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 border-primary/20">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full mb-2">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">Email Support</h3>
                  <p className="text-sm text-muted-foreground mb-2">support@buseasily.com</p>
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1 justify-center">
                    <CheckCircle className="h-3 w-3" />
                    24/7 Available
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 border-primary/20">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full mb-2">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">Phone Support</h3>
                  <p className="text-sm text-muted-foreground mb-2">+91 9507272341</p>
                  <p className="text-xs text-blue-600 font-medium flex items-center gap-1 justify-center">
                    <Clock className="h-3 w-3" />
                    9 AM - 6 PM
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 border-primary/20">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full mb-2">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">Office Address</h3>
                  <p className="text-sm text-muted-foreground mb-2">College Campus, Main Building</p>
                  <p className="text-xs text-purple-600 font-medium flex items-center gap-1 justify-center">
                    <Clock className="h-3 w-3" />
                    Mon - Fri
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 border-primary/20">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full mb-2">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">Emergency</h3>
                  <p className="text-sm text-muted-foreground mb-2">+91 9507272341</p>
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1 justify-center">
                    <CheckCircle className="h-3 w-3" />
                    24/7 Hotline
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Response Time Info */}
          <div className="bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 rounded-xl p-6 mb-12">
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-center sm:text-left">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-semibold">Fast Response Times</h4>
                  <p className="text-sm text-muted-foreground">We typically respond within 2-4 hours</p>
                </div>
              </div>
              <div className="hidden sm:block w-px bg-border" />
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-semibold">Secure & Private</h4>
                  <p className="text-sm text-muted-foreground">Your information is always protected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <Card className="p-8 shadow-xl border-border">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Send us a Message</h2>
                    <p className="text-muted-foreground text-sm">We'll get back to you within 2-4 hours</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-medium">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                          required
                        />
                      </div>
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-medium">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                          required
                        />
                      </div>
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-medium">
                        Phone Number (Optional)
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 9876543210"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="font-medium">
                        Issue Category
                      </Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="font-medium">
                      Subject <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subject"
                      placeholder="What is this regarding?"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className={errors.subject ? 'border-red-500' : ''}
                      required
                    />
                    {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="font-medium">
                      Message <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your inquiry... We'll read everything you write and respond accordingly."
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className={errors.message ? 'border-red-500' : ''}
                      rows={6}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <div>
                        {errors.message && <p className="text-red-500 text-xs">{errors.message}</p>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formData.message.length} characters
                      </p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full md:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/60 transition-all duration-300 transform hover:scale-105"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Message
                      </div>
                    )}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Help Section */}
            <div className="space-y-8">
              {/* FAQ Quick Links */}
              <Card className="p-6 border-primary/20">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Quick Help
                </h3>
                <div className="space-y-3">
                  {[
                    { q: "How to book a bus?", a: "Go to Browse Buses and select your preferred bus." },
                    { q: "Can I cancel my booking?", a: "Yes, you can cancel up to 2 hours before departure." },
                    { q: "Lost item on bus?", a: "Contact us immediately with bus details." },
                  ].map((faq, index) => (
                    <div key={index} className="border-b border-border pb-3 last:border-b-0">
                      <p className="font-medium text-sm mb-1">{faq.q}</p>
                      <p className="text-muted-foreground text-sm">{faq.a}</p>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-primary/20 text-primary hover:bg-primary/5"
                  onClick={() => navigate("/help")}
                >
                  View All FAQs
                </Button>
              </Card>

              {/* Live Chat */}
              <Card className="p-6 bg-gradient-to-r from-green-50/50 to-transparent border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-sm">Live Chat Available</span>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Chat with our support team in real-time during business hours.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full border-green-200 text-green-600 hover:bg-green-50"
                  onClick={() => toast.info("Live chat will be available soon!")}
                >
                  Start Chat
                </Button>
              </Card>
            </div>
          </div>

          {/* Footer Call to Action */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4">Still Need Help?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                If you can't find what you're looking for or need immediate assistance, 
                don't hesitate to reach out. We're always here to help you with your travel needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white"
                  onClick={() => navigate("/help")}
                >
                  Visit Help Center
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="border-t border-border py-8 sm:py-10 lg:py-12 mt-12 sm:mt-16">
              <style>{`
                @keyframes heart-beat {
                  0%, 100% { 
                    transform: scale(1) rotate(0deg);
                  }
                  25% { 
                    transform: scale(1.1) rotate(5deg);
                  }
                  50% { 
                    transform: scale(1) rotate(0deg);
                  }
                  75% { 
                    transform: scale(0.9) rotate(-5deg);
                  }
                }
      
                @keyframes heartbeat {
                  0%, 100% { 
                    transform: scale(1);
                  }
                  50% { 
                    transform: scale(1.2);
                  }
                }
      
                @keyframes slide-in-from-top-2 {
                  from {
                    opacity: 0;
                    transform: translateY(-10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
      
                .heart-bounce {
                  display: inline-block;
                  animation: heart-beat 2s ease-in-out infinite;
                }
      
                .animate-heartbeat {
                  animation: heartbeat 1.5s ease-in-out infinite;
                }
      
                .social-icon {
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 9999px;
                  padding: 0.5rem;
                  transition:
                    transform 0.2s ease,
                    box-shadow 0.2s ease,
                    background-color 0.2s ease,
                    color 0.2s ease;
                  background: rgba(148, 163, 184, 0.08);
                }
      
                .social-icon:hover {
                  transform: translateY(-2px) scale(1.08);
                  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);
                }
      
                .animate-in {
                  animation: slide-in-from-top-2 0.3s ease-out;
                }
              `}</style>
      
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8">
                  {/* Brand */}
                  <div className="col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-10 w-10 sm:h-14 sm:w-14 flex items-center justify-center bg-primary/10 rounded-full">
                        <img className="h-7 w-7 sm:h-10 sm:w-10" src="src/assets/bus.png" alt="" />
                      </div>
                      <span className="text-foreground font-bold text-base sm:text-lg">Buseasily</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Making college commute easier for students across India.
                    </p>
                  </div>
      
                  {/* Quick Links */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm sm:text-base">Quick Links</h4>
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                      <li>
                        <Link to="/browse" className="hover:text-foreground hover:underline transition-colors">
                          Browse Buses
                        </Link>
                      </li>
                      <li>
                        <Link to="/gallery" className="hover:text-foreground hover:underline transition-colors flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Gallery
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-1">New</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/auth" className="hover:text-foreground hover:underline transition-colors">
                          Sign Up
                        </Link>
                      </li>
                      <li>
                        <Link to="/dashboard" className="hover:text-foreground hover:underline transition-colors">
                          My Bookings
                        </Link>
                      </li>
                    </ul>
                  </div>
      
                  {/* Support */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm sm:text-base">Support</h4>
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                      <li>
                        <Link 
                          to="/help" 
                          className="hover:text-foreground hover:underline transition-colors flex items-center gap-1"
                        >
                          <Heart className="h-3 w-3" />
                          Help Center
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/contact" 
                          className="hover:text-foreground hover:underline transition-colors flex items-center gap-1"
                        >
                          <MapPin className="h-3 w-3" />
                          Contact Us
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/terms" 
                          className="hover:text-foreground hover:underline transition-colors"
                        >
                          Terms of Service
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/privacy" 
                          className="hover:text-foreground hover:underline transition-colors"
                        >
                          Privacy Policy
                        </Link>
                      </li>
                    </ul>
                  </div>
      
                  {/* Social */}
                  <div className="col-span-2 lg:col-span-1">
                    <h4 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm sm:text-base">Connect</h4>
                    <div className="flex gap-3 text-muted-foreground">
                      <a
                        href="https://www.linkedin.com/in/suraj-kumar-72847b30a/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                        className="social-icon hover:text-[#0A66C2]"
                      >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14C2.2 0 0 2.2 0 5v14c0 2.8 2.2 5 5 5h14c2.8 0 5-2.2 5-5V5c0-2.8-2.2-5-5-5zm-11 19H5V9h3v10zm-1.5-11.5C6.1 7.5 5 6.4 5 5s1.1-2.5 2.5-2.5S10 3.6 10 5 8.9 7.5 7.5 7.5zM20 19h-3v-5.5c0-1.3-.5-2.1-1.7-2.1-0.9 0-1.4 0.6-1.6 1.2-.1.2-.1.5-.1.8V19h-3V9h3v1.4c.4-.6 1.1-1.5 2.7-1.5 2 0 3.6 1.3 3.6 4.2V19z" />
                        </svg>
                      </a>
      
                      <a
                        href="https://x.com/SuraJzRt"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="X (Twitter)"
                        className="social-icon hover:text-black"
                      >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 3h3l5.1 6.7L15.8 3H21l-6.7 8.7L21 21h-3l-5.1-6.8L8.2 21H3l6.8-9.3L3 3z" />
                        </svg>
                      </a>
      
                      <a
                        href="https://www.instagram.com/risu2948/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        className="social-icon hover:text-[#E4405F]"
                      >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
      
                {/* Footer Bottom Links */}
                <div className="border-t border-border pt-6 mt-8">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-center sm:text-left">
                      <Link 
                        to="/contact" 
                        className="hover:text-foreground hover:underline transition-colors"
                      >
                        Contact Us
                      </Link>
                      <Link 
                        to="/about" 
                        className="hover:text-foreground hover:underline transition-colors"
                      >
                        About Us
                      </Link>
                      <Link 
                        to="/privacy" 
                        className="hover:text-foreground hover:underline transition-colors"
                      >
                        Privacy Policy
                      </Link>
                      <Link 
                        to="/terms" 
                        className="hover:text-foreground hover:underline transition-colors"
                      >
                        Terms of Service
                      </Link>
                      <Link 
                        to="/help" 
                        className="hover:text-foreground hover:underline transition-colors"
                      >
                        Help Center
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Made with</span>
                      <Heart className="h-3 w-3 animate-heartbeat text-red-500 fill-[#ef4444]" />
                      <span>by</span>
                      <a
                        href="https://surajzxrt.netlify.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group hover:text-primary transition-colors flex items-center gap-1 relative"
                      >
                        <span>SuraJz</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity absolute -right-4 top-1/2 -translate-y-1/2" />
                      </a>
                    </div>
                  </div>
                  
                  {/* Copyright */}
                  <div className="text-center text-[10px] sm:text-xs text-muted-foreground mt-4">
                    <p>
                      &copy; {new Date().getFullYear()}{" "}
                      <a
                        className="hover:text-foreground transition-colors"
                        href="https://buseasily.netlify.app"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        buseasily
                      </a>
                      . All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </footer>
    </div>
  );
};

export default Contact;