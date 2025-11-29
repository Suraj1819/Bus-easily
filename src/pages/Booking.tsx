import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Bus,
  ArrowLeft,
  IndianRupee,
  Clock,
  Loader2,
  User,
  CreditCard,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";

interface LocationState {
  selectedSeats: string[];
  totalFare: number;
}

interface SeatInfo {
  id: string;
  seat_number: string;
}

const Booking = () => {
  const { busId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false); // NEW STATE

  const [bus, setBus] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [seatDetails, setSeatDetails] = useState<SeatInfo[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");

  const state = location.state as LocationState | null;
  const selectedSeats = state?.selectedSeats || [];
  const totalFare = state?.totalFare || 0;

  const bookingFee = 0;
  const finalTotal = totalFare + bookingFee;

  useEffect(() => {
    if (!busId || !state || selectedSeats.length === 0 || totalFare <= 0) {
      navigate("/browse", { replace: true });
      return;
    }
    fetchData();
  }, [busId]);

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      const { data: { user: userData } } = await supabase.auth.getUser();
      if (!userData) {
        navigate("/auth");
        return;
      }
      setUser(userData);
      const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", userData.id).single();
      setProfile(profileData);
      const { data: busData } = await supabase.from("buses").select("*").eq("id", busId).single();
      setBus(busData);
      if (selectedSeats.length > 0) {
        const { data: seatsData } = await supabase.from("seats").select("id, seat_number").in("id", selectedSeats);
        setSeatDetails((seatsData || []) as SeatInfo[]);
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load booking details");
      navigate("/browse", { replace: true });
    } finally {
      setInitialLoading(false);
    }
  };

  const sortedSeatDetails = [...seatDetails].sort((a, b) => {
    const an = parseInt(a.seat_number, 10);
    const bn = parseInt(b.seat_number, 10);
    if (!isNaN(an) && !isNaN(bn)) return an - bn;
    return a.seat_number.localeCompare(b.seat_number);
  });

  const handlePayment = async () => {
    if (!user || !bus || selectedSeats.length === 0) {
      toast.error("Booking details are incomplete.");
      return;
    }

    setLoading(true);
    try {
      const bookingId = `BKG${Date.now()}`;

      // 1. Insert Booking
      const { error: bookingError } = await supabase.from("bookings").insert({
        booking_id: bookingId,
        user_id: user.id,
        bus_id: busId,
        seat_ids: selectedSeats,
        total_fare: finalTotal,
        status: "confirmed",
        payment_status: "completed",
        booked_at: new Date().toISOString(),
        payment_method: paymentMethod,
      });
      if (bookingError) throw bookingError;

      // 2. Update Seats Status
      const { error: seatsError } = await supabase.from("seats").update({
        status: "booked",
        locked_by: null,
        locked_until: null,
      }).in("id", selectedSeats);
      if (seatsError) throw seatsError;

      // 3. Trigger Email (Non-blocking)
      if (user.email) {
        try {
          supabase.functions.invoke("send-booking-email", {
            body: {
              to: user.email,
              bookingId,
              bus: {
                bus_number: bus.bus_number,
                route: bus.route,
                departure_time: bus.departure_time,
                arrival_time: bus.arrival_time,
              },
              profile: { name: profile?.name, phone: profile?.phone },
              seats: sortedSeatDetails.map((s) => s.seat_number),
              totalAmount: finalTotal,
              paymentMethod,
              bookedAt: new Date().toISOString(),
            },
          });
        } catch (err) { console.error("Email error", err); }
      }

      // --- SUCCESS FLOW ---
      setLoading(false);
      setPaymentSuccess(true); // Show success screen
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 3000);

    } catch (error: any) {
      console.error("Booking Error:", error);
      toast.error(error.message || "Payment failed");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) navigate(-1);
  };

  // --- 1. Loading Screen ---
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-slate-500 font-medium">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  // --- 2. Payment Success Screen (NEW) ---
  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white animate-in fade-in duration-500">
        <div className="text-center space-y-6 p-8 max-w-sm w-full">
          {/* Animated Icon */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
             <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
             <div className="relative bg-green-100 w-24 h-24 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 animate-[zoom-in_0.5s_ease-out]" />
             </div>
          </div>

          <div className="space-y-2">
             <h2 className="text-2xl font-bold text-slate-900">Payment Successful!</h2>
             <p className="text-slate-500">Your booking has been confirmed.</p>
          </div>

          {/* Ticket Visual */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4 max-w-xs mx-auto animate-[slide-in-from-bottom_0.5s_ease-out_0.2s_both]">
             <div className="bg-violet-100 p-2.5 rounded-lg">
                <Ticket className="w-6 h-6 text-violet-600" />
             </div>
             <div className="text-left">
                <p className="text-xs text-slate-500 font-medium uppercase">Booking ID</p>
                <p className="text-sm font-bold text-slate-900">#BKG{Date.now().toString().slice(-6)}</p>
             </div>
          </div>

          <div className="pt-8">
             <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to dashboard...
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. Main Booking Screen ---
  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 sm:pb-12">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="rounded-full"
              disabled={loading || paymentSuccess}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold leading-none">Checkout</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Complete your booking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-medium">
            <ShieldCheck className="h-4 w-4" />
            100% Secure
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Details */}
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Bus className="h-5 w-5 text-primary" />
                    Trip Details
                  </CardTitle>
                  <Badge variant="outline" className="font-normal">
                    {bus?.bus_type || "Standard Bus"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  {/* Origin */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      From
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {bus?.route?.split("-")[0]?.trim() || "Origin"}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">
                      <Clock className="h-3.5 w-3.5" />
                      {bus?.departure_time || "--:--"}
                    </div>
                  </div>

                  {/* Route visual */}
                  <div className="hidden md:flex flex-1 flex-col items-center px-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      {bus?.bus_number}
                    </p>
                    <div className="w-full flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-slate-300" />
                      <div className="h-[2px] flex-1 bg-slate-300 border-t border-dashed border-slate-400" />
                      <Bus className="h-4 w-4 text-primary" />
                      <div className="h-[2px] flex-1 bg-slate-300 border-t border-dashed border-slate-400" />
                      <div className="h-2 w-2 rounded-full bg-slate-300" />
                    </div>
                    <p className="text-xs text-green-600 font-medium mt-2">
                      On Time
                    </p>
                  </div>

                  {/* Destination */}
                  <div className="space-y-1 text-left md:text-right">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      To
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {bus?.route?.split("-")[1]?.trim() || "Destination"}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit md:ml-auto">
                      <Clock className="h-3.5 w-3.5" />
                      {bus?.arrival_time || "--:--"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passenger Info */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Passenger Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Primary Passenger
                    </p>
                    <p className="font-semibold text-slate-900">
                      {profile?.name || "Guest User"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Contact Number
                    </p>
                    <p className="font-semibold text-slate-900">
                      {profile?.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Branch / Year
                    </p>
                    <p className="font-semibold text-slate-900">
                      {profile?.branch
                        ? `${profile.branch} / ${profile.year || ""}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Email Sent To
                    </p>
                    <p className="font-semibold text-slate-900 truncate">
                      {user?.email || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Select Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(val) =>
                    setPaymentMethod(val as "upi" | "card")
                  }
                  className="grid gap-4"
                >
                  {/* UPI Option */}
                  <div
                    className={`flex flex-col gap-2 border p-4 rounded-xl transition-all ${
                      paymentMethod === "upi"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="upi" id="upi" />
                        <Label
                          htmlFor="upi"
                          className="font-medium cursor-pointer flex items-center gap-2"
                        >
                          <Smartphone className="h-4 w-4 text-slate-500" />
                          UPI / Google Pay / PhonePe / Paytm
                        </Label>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Fastest
                      </Badge>
                    </div>
                    {/* Brand chips */}
                    <div className="flex items-center gap-2 pl-7">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: "#4285F4" }}
                      >
                        GPay
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                        style={{ backgroundColor: "#5F259F" }}
                      >
                        PhonePe
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-900"
                        style={{ backgroundColor: "#00BAF2" }}
                      >
                        Paytm
                      </span>
                    </div>
                  </div>

                  {/* Card Option */}
                  <div
                    className={`flex items-center space-x-2 border p-4 rounded-xl transition-all ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-slate-200"
                    }`}
                  >
                    <RadioGroupItem value="card" id="card" />
                    <Label
                      htmlFor="card"
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4 text-slate-500" />
                      Credit / Debit Card
                    </Label>
                  </div>
                </RadioGroup>

                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg border border-yellow-100 flex gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  This is a simulated payment environment. No real money will be
                  deducted, but a booking record will be created.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="shadow-md border-slate-200 overflow-hidden">
                <div className="bg-slate-900 text-white p-4 text-center">
                  <p className="text-xs opacity-80 uppercase tracking-widest">
                    Total Amount
                  </p>
                  <p className="text-3xl font-bold flex justify-center items-center gap-1 mt-1">
                    <IndianRupee className="h-6 w-6" />
                    {finalTotal}
                  </p>
                </div>

                <CardContent className="p-5 space-y-4">
                  {/* Seats */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Selected Seats
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {sortedSeatDetails.length > 0 ? (
                        sortedSeatDetails.map((seat) => (
                          <Badge
                            key={seat.id}
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 border-slate-200"
                          >
                            {seat.seat_number}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          Loading...
                        </span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Bill Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Base Fare ({selectedSeats.length} seats)</span>
                      <span>₹{totalFare}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Booking Fee</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <Separator className="my-2 border-dashed" />
                    <div className="flex justify-between font-bold text-lg text-slate-900">
                      <span>Total</span>
                      <span>₹{finalTotal}</span>
                    </div>
                  </div>

                  {/* Pay Button (desktop / tablet only) */}
                  <Button
                    size="lg"
                    className="w-full mt-4 font-bold text-md h-12 shadow-lg shadow-primary/20 hidden lg:flex items-center justify-center"
                    onClick={handlePayment}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      `Pay ₹${finalTotal}`
                    )}
                  </Button>

                  <p className="text-[10px] text-center text-muted-foreground">
                    By proceeding, you agree to Buseasily&apos;s Terms &
                    Conditions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 lg:hidden z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
          <div>
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="text-xl font-bold flex items-center text-slate-900">
              <IndianRupee className="h-4 w-4" />
              {finalTotal}
            </p>
          </div>
          <Button
            size="lg"
            className="flex-1 font-bold flex items-center justify-center"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              "Proceed to Pay"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Booking;