import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Bus,
  Clock,
  Shield,
  Smartphone,
  Star,
  Zap,
  CheckCircle2,
  TrendingUp,
  Award,
  Heart,
  ExternalLink,
  Menu,
  X,
  Camera,
  Image as ImageIcon,
  MapPin,
  Users as UsersIcon,
  Home,
  LogIn,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import busHero from "@/assets/bus-hero.jpg";
import busInterior from "@/assets/bus-interior.jpg";
import studentsBus from "@/assets/students-bus.jpg";
import busIcon from "@/assets/android-chrome-512x512.png";

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      {/* Navigation - Mobile Optimized */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img className="w-8 h-8 sm:w-10 sm:h-10" src={busIcon} alt="Buseasily" />
              <span className="text-lg sm:text-xl font-bold text-foreground">Buseasily</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-3">
              <Link to="/gallery">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Gallery
                </Button>
              </Link>
              <Link to="/browse">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Bus className="h-4 w-4" />
                  Browse Buses
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="default" size="default" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Login / Sign Up
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-accent active:bg-accent/80 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-3 pt-3 border-t border-border space-y-1 animate-in slide-in-from-top-2 duration-200">
              <Link
                to="/"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent active:bg-accent/80 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5 text-primary" />
                <span className="font-medium">Home</span>
              </Link>
              <Link
                to="/gallery"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent active:bg-accent/80 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Camera className="h-5 w-5 text-primary" />
                <span className="font-medium">Gallery</span>
                <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">New</span>
              </Link>
              <Link
                to="/browse"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent active:bg-accent/80 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bus className="h-5 w-5 text-primary" />
                <span className="font-medium">Browse Buses</span>
              </Link>
              <Link
                to="/contact"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent active:bg-accent/80 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Contact Us</span>
              </Link>
              <Link
                to="/about"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent active:bg-accent/80 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart className="h-5 w-5 text-primary" />
                <span className="font-medium">About Us</span>
              </Link>
              <div className="pt-2">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="default" size="lg" className="w-full gap-2">
                    <LogIn className="h-4 w-4" />
                    Login / Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Mobile Optimized */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent z-10"></div>
        <img
          src={busHero}
          alt="Modern college bus"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-20 container mx-auto px-4 py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="max-w-3xl mx-auto lg:mx-0 text-center lg:text-left">
            <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/10 rounded-full text-primary font-semibold text-xs sm:text-sm mb-4 sm:mb-6 justify-center lg:justify-start">
              <span className="mr-1.5">🚀</span> Bihar's #1 College Transport Platform
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              Book Your College Bus <span className="text-primary">Seat Online</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl">
              Say goodbye to long queues and uncertainty. Book your bus seat in seconds with real-time availability, secure payments, and instant confirmation.
            </p>

            {/* CTA Buttons - Stacked on mobile, row on sm+, left-aligned on lg */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto font-semibold text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14">
                  Book Now - It's Free
                </Button>
              </Link>
              <Link to="/browse" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14">
                  View Available Buses
                </Button>
              </Link>
            </div>

            {/* Gallery Quick Link - Mobile Featured */}
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 mt-4 sm:mt-6 px-4 py-2 bg-accent/80 hover:bg-accent rounded-full transition-colors group justify-center lg:justify-start"
            >
              <Camera className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Explore our Photo Gallery</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Stats - Mobile Grid, left-aligned on all sizes now */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 max-w-md sm:max-w-2xl lg:max-w-lg justify-center lg:justify-start">
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-bold text-primary">2</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Students Active</div>
              </div>
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-bold text-primary">5+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Buses Daily</div>
              </div>
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-bold text-primary">99%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Mobile Optimized */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-4">Why Choose Us?</h2>
          <p className="text-sm sm:text-lg text-muted-foreground">Everything you need for hassle-free college commute</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow border-border group">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
              <Smartphone className="h-5 w-5 sm:h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base sm:text-xl font-semibold text-foreground mb-1 sm:mb-2 text-center">Quick Login</h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Sign up in seconds with email. No complicated forms.
            </p>
          </Card>
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow border-border group">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
              <Zap className="h-5 w-5 sm:h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base sm:text-xl font-semibold text-foreground mb-1 sm:mb-2 text-center">Real-time Updates</h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Live seat availability and booking confirmations instantly
            </p>
          </Card>
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow border-border group">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
              <Shield className="h-5 w-5 sm:h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base sm:text-xl font-semibold text-foreground mb-1 sm:mb-2 text-center">100% Secure</h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Your data and payments are encrypted and protected
            </p>
          </Card>
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow border-border group">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
              <Clock className="h-5 w-5 sm:h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base sm:text-xl font-semibold text-foreground mb-1 sm:mb-2 text-center">Book Anytime</h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              24/7 booking available from anywhere, anytime
            </p>
          </Card>
        </div>
      </section>

      {/* Bus Gallery Section - Mobile Optimized with Gallery Link */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-4">Our Fleet</h2>
            <p className="text-sm sm:text-lg text-muted-foreground">Modern, comfortable, and well-maintained buses</p>
          </div>
          <Link to="/gallery" className="self-center sm:self-auto">
            <Button variant="outline" className="gap-2">
              <Camera className="h-4 w-4" />
              View Full Gallery
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="overflow-hidden group cursor-pointer" onClick={() => window.location.href = '/gallery'}>
            <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
              <img
                src={busHero}
                alt="Modern bus exterior"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 sm:p-2">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 text-white">
                <h3 className="text-lg sm:text-xl font-bold">Modern Exterior</h3>
                <p className="text-xs sm:text-sm text-white/80">Sleek & comfortable buses</p>
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden group cursor-pointer" onClick={() => window.location.href = '/gallery'}>
            <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
              <img
                src={busInterior}
                alt="Comfortable bus interior"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 sm:p-2">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 text-white">
                <h3 className="text-lg sm:text-xl font-bold">Comfortable Interior</h3>
                <p className="text-xs sm:text-sm text-white/80">AC & spacious seating</p>
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden group cursor-pointer sm:col-span-2 lg:col-span-1" onClick={() => window.location.href = '/gallery'}>
            <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
              <img
                src={studentsBus}
                alt="Happy students"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 sm:p-2">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 text-white">
                <h3 className="text-lg sm:text-xl font-bold">Happy Students</h3>
                <p className="text-xs sm:text-sm text-white/80">Safe & reliable service</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Mobile Gallery CTA */}
        <div className="mt-6 sm:hidden text-center">
          <Link to="/gallery">
            <Button variant="default" className="gap-2 w-full">
              <Camera className="h-4 w-4" />
              Explore Full Photo Gallery
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works - Mobile Optimized */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="bg-card rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 border border-border">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-4">How It Works</h2>
            <p className="text-sm sm:text-lg text-muted-foreground">Book your seat in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-3 sm:mb-4 shadow-lg">1</div>
              <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-lg">Create Account</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Sign up with your email in seconds</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-3 sm:mb-4 shadow-lg">2</div>
              <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-lg">Choose Bus</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Filter by branch, year, and bus type</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-3 sm:mb-4 shadow-lg">3</div>
              <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-lg">Select Seat</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Pick your preferred seat from live chart</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-3 sm:mb-4 shadow-lg">4</div>
              <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-lg">Confirm & Go</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Get instant confirmation ticket</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits - Mobile Optimized */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6 text-center md:text-left">Everything You Need in One Place</h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-0.5 sm:mb-1 text-sm sm:text-base">Live Seat Tracking</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">See available seats in real-time with automatic updates</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-0.5 sm:mb-1 text-sm sm:text-base">Flexible Booking</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Book multiple seats for friends or cancel anytime</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-0.5 sm:mb-1 text-sm sm:text-base">Smart Dashboard</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Manage all bookings and view history in one place</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-0.5 sm:mb-1 text-sm sm:text-base">Digital Tickets</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Instant e-tickets sent to your email</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-2xl"></div>
            <Card className="relative p-4 sm:p-6 lg:p-8 border-border">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <div className="text-center p-3 sm:p-4 lg:p-6 bg-accent rounded-lg sm:rounded-xl">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-1 sm:mb-2" />
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">2+</div>
                  <div className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Bookings/Month</div>
                </div>
                <div className="text-center p-3 sm:p-4 lg:p-6 bg-accent rounded-lg sm:rounded-xl">
                  <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-1 sm:mb-2" />
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">98%</div>
                  <div className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">On-Time Rate</div>
                </div>
                <div className="text-center p-3 sm:p-4 lg:p-6 bg-accent rounded-lg sm:rounded-xl">
                  <Award className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-1 sm:mb-2" />
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">4.8/5</div>
                  <div className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">User Rating</div>
                </div>
                <div className="text-center p-3 sm:p-4 lg:p-6 bg-accent rounded-lg sm:rounded-xl">
                  <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-1 sm:mb-2" />
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">24/7</div>
                  <div className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Support</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile Optimized */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <Card className="relative overflow-hidden border-border">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"></div>
          <div className="relative p-6 sm:p-10 lg:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-3 sm:mb-4">Ready to Start Your Journey?</h2>
            <p className="text-sm sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join hundreds of students who book their bus seats online every day
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 font-semibold">
                  Get Started for Free
                </Button>
              </Link>
              <Link to="/gallery" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 font-semibold gap-2">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                  View Gallery
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer - Mobile Optimized with Complete Links */}
      <footer className="border-t border-border py-8 sm:py-10 lg:py-12 mt-12 sm:mt-16">
  <style>{`
    @keyframes heartbeat {
       }
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
    .social-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      padding: 0.5rem;
      transition: all 0.2s ease;
      background: hsl(var(--accent));
    }
    .social-icon:hover {
      transform: translateY(-2px);
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
    }
  `}</style>

  <div className="container mx-auto px-4 sm:px-6">
    {/* Main Grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8">
      
      {/* Brand */}
      <div className="col-span-2 lg:col-span-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 flex items-center justify-center  rounded-xl">
            <img className="h-8 w-8" src={busIcon} alt="Buseasily" />
          </div>
          <div>
            <span className="text-foreground font-bold text-xl block">Buseasily</span>
            <span className="text-xs text-primary">Bihar's #1 College Transport</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          Making college commutes effortless for students across India.
        </p>
        
        {/* Social Icons */}
        <div className="flex gap-2">
          <a href="https://www.linkedin.com/in/suraj-kumar-72847b30a/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="social-icon text-muted-foreground">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <a href="https://x.com/SuraJzRt" target="_blank" rel="noopener noreferrer" aria-label="X" className="social-icon text-muted-foreground">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="https://www.instagram.com/risu2948/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-icon text-muted-foreground">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="social-icon text-muted-foreground">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Links */}
      <div>
        <h4 className="font-semibold text-foreground mb-3 text-sm">Quick Links</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/browse" className="footer-link">Browse Buses</Link></li>
          <li><Link to="/gallery" className="footer-link">Gallery</Link></li>
          <li><Link to="/auth" className="footer-link">Sign Up</Link></li>
          <li><Link to="/dashboard" className="footer-link">My Bookings</Link></li>
        </ul>
      </div>

      {/* Support */}
      <div>
        <h4 className="font-semibold text-foreground mb-3 text-sm">Support</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/help" className="footer-link">Help Center</Link></li>
          <li><Link to="/contact" className="footer-link">Contact Us</Link></li>
          <li><Link to="/terms" className="footer-link">Terms</Link></li>
          <li><Link to="/privacy" className="footer-link">Privacy</Link></li>
        </ul>
      </div>

      {/* CTA */}
      <div className="col-span-2 lg:col-span-1">
        <h4 className="font-semibold text-foreground mb-3 text-sm">Get Started</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Book your seat in seconds.
        </p>
        <Link to="/auth">
          <Button className="w-full sm:w-auto gap-2">
            <LogIn className="h-4 w-4" />
            Book Now
          </Button>
        </Link>
      </div>
    </div>

    {/* Bottom - Centered Layout */}
    <div className="border-t border-border pt-6 flex flex-col items-center gap-3 text-sm text-muted-foreground">
      {/* Copyright - Center */}
      <p>
        © {new Date().getFullYear()}{" "}
        <a href="https://buseasily.netlify.app" target="_blank" rel="noopener noreferrer" className="footer-link font-medium">
          Buseasily
        </a>
        . All rights reserved.
      </p>
      
      {/* Made with love - Below Copyright */}
      <div className="flex items-center gap-1.5">
        <span>Made with</span>
        <Heart className="h-3.5 w-3.5 animate-heartbeat text-red-500 fill-red-500 animate-bounce" />
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

export default Index;