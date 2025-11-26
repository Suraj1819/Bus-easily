import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  CheckCircle, 
  Home, 
  Mail, 
  Clock, 
  ArrowRight,
  Bus,
  Heart,
  ExternalLink,
  LogIn
} from "lucide-react";
import { Link } from "react-router-dom";

const ContactSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, email } = location.state || {};

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // If no state, redirect to contact page
    if (!location.state) {
      navigate("/contact");
    }
  }, [location.state, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
              <Bus className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Buseasily
            </span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Animation */}
          <div className="mb-8">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
              <div className="relative bg-green-100 p-6 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Message Sent Successfully!
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Thank you{name ? `, ${name}` : ""}! We've received your message and will get back to you soon.
          </p>

          {/* Info Card */}
          <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Confirmation sent to</p>
                  <p className="text-muted-foreground">{email || "your email"}</p>
                </div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-border"></div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Expected response</p>
                  <p className="text-muted-foreground">Within 2-4 hours</p>
                </div>
              </div>
            </div>
          </Card>

          {/* What's Next */}
          <div className="mb-10">
            <h3 className="font-semibold text-lg mb-4">What happens next?</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">1</span>
                <span>We review your message</span>
              </div>
              <ArrowRight className="h-4 w-4 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">2</span>
                <span>Our team responds via email</span>
              </div>
              <ArrowRight className="h-4 w-4 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">3</span>
                <span>Issue resolved!</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/browse")}
              className="gap-2"
            >
              <Bus className="h-4 w-4" />
              Browse Buses
            </Button>
          </div>

          {/* Additional Help */}
          <p className="mt-8 text-sm text-muted-foreground">
            Need urgent help?{" "}
            <a href="tel:+919507272341" className="text-primary font-medium hover:underline">
              Call us at +91 9507272341
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-auto">
        <style>{`
          @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
          .animate-heartbeat {
            animation: heartbeat 1.2s ease-in-out infinite;
          }
          .footer-link {
            transition: color 0.2s ease;
          }
          .footer-link:hover {
            color: hsl(var(--primary));
          }
        `}</style>

        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()}{" "}
              <a href="https://buseasily.netlify.app" target="_blank" rel="noopener noreferrer" className="footer-link font-medium">
                Buseasily
              </a>
              . All rights reserved.
            </p>
            
            <div className="flex items-center gap-1.5">
              <span>Made with</span>
              <Heart className="h-3.5 w-3.5 animate-heartbeat text-red-500 fill-red-500" />
              <span>by</span>
              <a 
                href="https://surajzxrt.netlify.app" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-link font-medium text-primary inline-flex items-center gap-1 group"
              >
                SuraJz
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactSuccess;