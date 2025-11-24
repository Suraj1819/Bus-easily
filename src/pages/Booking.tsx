import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bus,
  ArrowLeft,
  IndianRupee,
  CheckCircle2,
  Loader2,
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
  const [bus, setBus] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [seatDetails, setSeatDetails] = useState<SeatInfo[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const state = location.state as LocationState;
  const selectedSeats = state?.selectedSeats || [];
  const totalFare = state?.totalFare || 0;

  useEffect(() => {
    if (!state || selectedSeats.length === 0) {
      navigate("/browse");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busId]);

  const fetchData = async () => {
    try {
      const {
        data: { user: userData },
      } = await supabase.auth.getUser();

      if (!userData) {
        navigate("/auth");
        return;
      }

      setUser(userData);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userData.id)
        .single();
      setProfile(profileData);

      const { data: busData } = await supabase
        .from("buses")
        .select("*")
        .eq("id", busId)
        .single();
      setBus(busData);

      if (selectedSeats.length > 0) {
        const { data: seatsData } = await supabase
          .from("seats")
          .select("id, seat_number")
          .in("id", selectedSeats);

        setSeatDetails((seatsData || []) as SeatInfo[]);
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load booking details");
    } finally {
      setInitialLoading(false);
    }
  };

  // --- HELPER FUNCTION FOR DOWNLOADING TICKET ---
  const downloadTicket = (bookingId: string) => {
    // ---------------------------------------------------------
    // 👇 FIX FOR PWA NOTIFICATION 👇
    // ---------------------------------------------------------
    // Yahan apne backend ka URL dalein jahan se PDF generate hoti hai.
    // window.open('_blank') use karne se Android System ka Download Manager trigger hota hai
    // jisse notification bar me "Downloading..." dikhta hai.
    
    const pdfUrl = `https://your-api-domain.com/api/generate-ticket?bookingId=${bookingId}`;
    
    // Agar file local hai ya public bucket me hai to seedha URL dalein
    window.open(pdfUrl, '_blank');
  };

  const handlePayment = async () => {
    if (!user || !bus || selectedSeats.length === 0) {
      toast.error("Booking details are incomplete. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const bookingId = `BKG${Date.now()}`;

      const { error: bookingError } = await supabase
        .from("bookings")
        .insert({
          booking_id: bookingId,
          user_id: user.id,
          bus_id: busId,
          seat_ids: selectedSeats,
          total_fare: totalFare,
          status: "confirmed",
          payment_status: "completed",
        });

      if (bookingError) throw bookingError;

      const { error: seatsError } = await supabase
        .from("seats")
        .update({
          status: "booked",
          locked_by: null,
          locked_until: null,
        })
        .in("id", selectedSeats);

      if (seatsError) throw seatsError;

      toast.success("Booking confirmed successfully!");

      // 👇 Booking confirm hote hi download start karein
      // Note: Kuch browsers me async request ke baad popup block ho sakta hai.
      // Agar ye kaam na kare, to 'Download' button Dashboard page par lagana behtar hoga.
      downloadTicket(bookingId);

      // Thoda wait karke dashboard par bhejein taaki download start ho sake
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1000);

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) navigate(-1);
  };

  const sortedSeatDetails = [...seatDetails].sort((a, b) => {
    const an = parseInt(a.seat_number, 10);
    const bn = parseInt(b.seat_number, 10);
    if (!isNaN(an) && !isNaN(bn)) return an - bn;
    return a.seat_number.localeCompare(b.seat_number);
  });

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Preparing your booking summary...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent flex flex-col">
      {/* Header */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Bus className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">
                Confirm Booking
              </span>
              <span className="text-xs text-muted-foreground">
                Review your journey and seats before payment
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="flex-1 container mx-auto px-4 py-6 pb-24 sm:pb-10">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Trip Overview */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-3">
              Trip Overview
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Quick summary of your bus, timing, and seats selected from the
              seat matrix.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Bus</p>
                <p className="font-semibold text-foreground">
                  {bus?.bus_number || "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bus?.route || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Timing</p>
                <p className="font-semibold text-foreground">
                  {bus?.departure_time && bus?.arrival_time
                    ? `${bus.departure_time} – ${bus.arrival_time}`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Please arrive 10–15 minutes before departure.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">
                  Number of Seats
                </p>
                <p className="font-semibold text-foreground">
                  {selectedSeats.length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Total Fare</p>
                <p className="font-semibold text-primary flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {totalFare}
                </p>
              </div>
            </div>
          </Card>

          {/* Passenger Details */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Passenger Details
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              These details will appear on your ticket and may be shared with
              transport staff if needed.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-semibold text-foreground">
                  {profile?.name || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-semibold text-foreground">
                  {profile?.phone || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Branch:</span>
                <span className="font-semibold text-foreground">
                  {profile?.branch || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Year:</span>
                <span className="font-semibold text-foreground">
                  {profile?.year || "—"}
                </span>
              </div>
            </div>
          </Card>

          {/* Bus Details */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Bus Details
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Confirm you are booking the correct bus and route.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bus Number:</span>
                <span className="font-semibold text-foreground">
                  {bus?.bus_number || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route:</span>
                <span className="font-semibold text-foreground">
                  {bus?.route || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-semibold text-foreground">
                  {bus?.bus_type || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timing:</span>
                <span className="font-semibold text-foreground">
                  {bus?.departure_time && bus?.arrival_time
                    ? `${bus.departure_time} - ${bus.arrival_time}`
                    : "—"}
                </span>
              </div>
            </div>
          </Card>

          {/* Selected Seats Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Selected Seats
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              These are the exact seat boxes you clicked in the seat matrix.
            </p>

            {sortedSeatDetails.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  {sortedSeatDetails.map((seat) => (
                    <Badge
                      key={seat.id}
                      variant="default"
                      className="px-3 py-1 text-xs font-semibold"
                    >
                      Seat {seat.seat_number}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  You have selected{" "}
                  <span className="font-semibold text-foreground">
                    {sortedSeatDetails.length}
                  </span>{" "}
                  seat
                  {sortedSeatDetails.length > 1 ? "s" : ""}. You can still go
                  back to change them before payment.
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Loading selected seats...
              </p>
            )}
          </Card>

          {/* Fare Breakup */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Fare Breakup
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Final fare based on bus fare and number of seats.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Fare per Seat:</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {bus?.fare ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number of Seats:</span>
                <span className="font-semibold text-foreground">
                  {selectedSeats.length}
                </span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between">
                <span className="font-bold text-foreground">Total Amount:</span>
                <span className="font-bold text-primary text-xl flex items-center gap-1">
                  <IndianRupee className="h-5 w-5" />
                  {totalFare}
                </span>
              </div>
            </div>
          </Card>

          {/* Payment Options Info */}
          <Card className="p-6 bg-primary/5 border-primary">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Payment Gateway
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  In a production environment, this would integrate with a
                  secure payment provider (Razorpay, Stripe, Paytm, etc.).
                </p>
                <p className="text-xs text-muted-foreground">
                  Right now, clicking{" "}
                  <span className="font-semibold text-foreground">
                    &quot;Confirm &amp; Pay&quot;
                  </span>{" "}
                  will simulate a successful payment, create your booking, and
                  show it on your Dashboard.
                </p>
              </div>
            </div>
          </Card>

          {/* Desktop / tablet buttons (scroll with page) */}
          <div className="hidden sm:flex gap-4 mt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="flex-1"
              size="lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Confirm & Pay"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-card/95 border-t border-border px-4 py-3 sm:hidden">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1"
            size="lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              "Confirm & Pay"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Booking;