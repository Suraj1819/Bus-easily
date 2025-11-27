import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Bus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/50 px-4 py-12">
      {/* Animated Bus Icon */}
      <div className="relative mb-8">
        <div className="animate-pulse">
          <Bus className="h-24 w-24 text-primary/20" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <AlertTriangle className="h-12 w-12 text-destructive animate-bounce" />
        </div>
      </div>

      {/* Main Content */}
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-6xl md:text-7xl font-extrabold text-primary mb-4 animate-fade-in">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          Oops! This page got lost
        </h2>
        <p className="text-lg text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
          Don't worry, our buses are still running on schedule!
        </p>

        {/* Suggestions */}
        <div className="space-y-3 mb-8 text-sm text-muted-foreground">
          <p>You might want to try:</p>
          <ul className="space-y-1">
            <li>• Checking the URL for typos</li>
            <li>• Returning to the homepage</li>
            <li>• Searching for available buses</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/browse">
              <Bus className="h-4 w-4" />
              Browse Buses
            </Link>
          </Button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 opacity-20">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>

      {/* Footer Note */}
      <p className="absolute bottom-4 text-xs text-muted-foreground/50">
        Error code: 404 | Route: {location.pathname}
      </p>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotFound;