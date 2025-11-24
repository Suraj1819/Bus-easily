import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Bus,
  Clock,
  Shield,
  Smartphone,
  Star,
  Users,
  Zap,
  CheckCircle2,
  TrendingUp,
  Award,
  Heart,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import busHero from "@/assets/bus-hero.jpg";
import busInterior from "@/assets/bus-interior.jpg";
import studentsBus from "@/assets/students-bus.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Bus className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">College Bus Booking</span>
          </div>
          <Link to="/auth">
            <Button variant="default" size="lg">Login / Sign Up</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent z-10"></div>
        <img src={busHero} alt="Modern college bus" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative z-20 container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold text-sm mb-6">
              🚀 Bihar's #1 College Transport Platform
            </div>
            <h1 className="text-4xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Book Your College Bus <span className="text-primary">Seat Online</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
              Say goodbye to long queues and uncertainty. Book your bus seat in seconds with real-time availability, secure payments, and instant confirmation.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button size="lg" className="font-semibold text-lg px-8 h-14">
                  Book Now - It's Free
                </Button>
              </Link>
              <Link to="/browse">
                <Button size="lg" variant="outline" className="font-semibold text-lg px-8 h-14">
                  View Available Buses
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 max-w-2xl">
              <div>
                <div className="text-3xl font-bold text-primary">2</div>
                <div className="text-sm text-muted-foreground">Students Active</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">5+</div>
                <div className="text-sm text-muted-foreground">Buses Daily</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">99%</div>
                <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose Us?</h2>
          <p className="text-muted-foreground text-lg">Everything you need for hassle-free college commute</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow border-border">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Quick Login</h3>
            <p className="text-muted-foreground">Sign up in seconds with email. No complicated forms.</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow border-border">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Real-time Updates</h3>
            <p className="text-muted-foreground">Live seat availability and booking confirmations instantly</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow border-border">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">100% Secure</h3>
            <p className="text-muted-foreground">Your data and payments are encrypted and protected</p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow border-border">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Book Anytime</h3>
            <p className="text-muted-foreground">24/7 booking available from anywhere, anytime</p>
          </Card>
        </div>
      </section>

      {/* Bus Gallery */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Fleet</h2>
          <p className="text-muted-foreground text-lg">Modern, comfortable, and well-maintained buses</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="overflow-hidden group">
            <div className="relative h-64 overflow-hidden">
              <img src={busHero} alt="Modern bus exterior" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold">Modern Exterior</h3>
                <p className="text-sm">Sleek & comfortable buses</p>
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden group">
            <div className="relative h-64 overflow-hidden">
              <img src={busInterior} alt="Comfortable bus interior" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold">Comfortable Interior</h3>
                <p className="text-sm">AC & spacious seating</p>
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden group">
            <div className="relative h-64 overflow-hidden">
              <img src={studentsBus} alt="Happy students" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold">Happy Students</h3>
                <p className="text-sm">Safe & reliable service</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-card rounded-2xl p-8 md:p-12 border border-border">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Book your seat in 4 simple steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">1</div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">Create Account</h3>
              <p className="text-sm text-muted-foreground">Sign up with your email in seconds</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">2</div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">Choose Bus</h3>
              <p className="text-sm text-muted-foreground">Filter by branch, year, and bus type</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">3</div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">Select Seat</h3>
              <p className="text-sm text-muted-foreground">Pick your preferred seat from live chart</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">4</div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">Confirm & Go</h3>
              <p className="text-sm text-muted-foreground">Get instant confirmation ticket</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Everything You Need in One Place</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Live Seat Tracking</h3>
                  <p className="text-muted-foreground">See available seats in real-time with automatic updates</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Flexible Booking</h3>
                  <p className="text-muted-foreground">Book multiple seats for friends or cancel anytime</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Smart Dashboard</h3>
                  <p className="text-muted-foreground">Manage all bookings and view history in one place</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Digital Tickets</h3>
                  <p className="text-muted-foreground">Instant e-tickets sent to your email</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-2xl"></div>
            <Card className="relative p-8 border-border">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-accent rounded-xl">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">2+</div>
                  <div className="text-sm text-muted-foreground">Bookings/Month</div>
                </div>
                <div className="text-center p-6 bg-accent rounded-xl">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">98%</div>
                  <div className="text-sm text-muted-foreground">On-Time Rate</div>
                </div>
                <div className="text-center p-6 bg-accent rounded-xl">
                  <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">4.8/5</div>
                  <div className="text-sm text-muted-foreground">User Rating</div>
                </div>
                <div className="text-center p-6 bg-accent rounded-xl">
                  <Star className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">24/7</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="relative overflow-hidden border-border">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"></div>
          <div className="relative p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Ready to Start Your Journey?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of students who book their bus seats online every day
            </p>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 h-14 font-semibold">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </Card>
      </section>
      
      {/* Footer */}
<footer className="border-t border-border py-10 md:py-12 mt-16">
  <style>{`
    @keyframes heart-beat {
      0%, 100% { transform: scale(1); }
      50%      { transform: scale(1.25); }
    }
    .heart-bounce {
      display: inline-block;
      animation: heart-beat 1s infinite;
    }
  `}</style>

  <div className="container mx-auto px-4">
    {/* Top row – stacks on small screens */}
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8">
      {/* Brand */}
      <div className="col-span-2 sm:col-span-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <Bus className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">College Bus</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Making college commute easier for students across India.
        </p>
      </div>

      {/* Quick Links */}
      <div>
        <h4 className="font-semibold text-foreground mb-3">Quick Links</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <Link to="/browse" className="hover:text-foreground transition-colors">Browse Buses</Link>
          </li>
          <li>
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign Up</Link>
          </li>
          <li>
            <Link to="/dashboard" className="hover:text-foreground transition-colors">My Bookings</Link>
          </li>
        </ul>
      </div>

      {/* Support */}
      <div>
        <h4 className="font-semibold text-foreground mb-3">Support</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Help Center</li>
          <li>Contact Us</li>
          <li>Terms of Service</li>
        </ul>
      </div>

      {/* Social */}
      <div>
        <h4 className="font-semibold text-foreground mb-3">Connect</h4>
        <div className="flex gap-4 text-muted-foreground">
          {/* Facebook */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#1877F2] transition-colors"
            aria-label="Facebook"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>

          {/* Twitter */}
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#1DA1F2] transition-colors"
            aria-label="Twitter"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#E4405F] transition-colors"
            aria-label="Instagram"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>
      </div>
    </div>

    {/* Bottom line – copyright & made-with-heart */}
    <div className="text-center text-muted-foreground text-xs sm:text-sm border-t border-border pt-6">
      <p>
        Made with{" "}
        <Heart className="inline-block h-4 w-4 align-middle text-red-500 fill-[#ef4444] animate-bounce" />{" "}
        by{" "}
        <a
          href="https://surajzxrt.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
          className="group text-primary hover:underline inline-flex items-center"
        >
          SuraJz
          {/* External link icon appears on hover */}
          <ExternalLink className="ml-1 h-4 w-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        </a>{" "}
        for students
      </p>
      <p className="mt-2">&copy; 2025 College Bus Booking System. All rights reserved.</p>
    </div>
  </div>
</footer>
    </div>
  );
};

export default Index;