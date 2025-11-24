import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  IndianRupee,
  Loader2,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Wallet,
  Bus,
} from "lucide-react";
import { toast } from "sonner";

interface LocationState {
  busId: string;
  selectedSeats: string[];
  totalFare: number;
}

type PaymentMethod = "upi" | "card" | "cash";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [user, setUser] = useState<any>(null);
  const [bus, setBus] = useState<any>(null);
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [processing, setProcessing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // If user came here directly without state, send them back
    if (!state || !state.busId || !state.selectedSeats?.length) {
      navigate("/browse", { replace: true });
      return;
    }

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

        const { data: busData } = await supabase
          .from("buses")
          .select("*")
          .eq("id", state.busId)
          .single();

        setBus(busData);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load payment details");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [navigate, state]);

  const handleBack = () => {
    if (!processing) navigate(-1);
  };

  const handlePayNow = async () => {
    if (!state || !user || !bus) {
      toast.error("Payment details are incomplete");
      return;
    }

    setProcessing(true);
    try {
      // Simulate payment success (here you can integrate real gateway later)
      const bookingId = `BKG${Date.now()}`;

      const { error: bookingError } = await supabase.from("bookings").insert({
        booking_id: bookingId,
        user_id: user.id,
        bus_id: state.busId,
        seat_ids: state.selectedSeats,
        total_fare: state.totalFare,
        status: "confirmed",
        payment_status: "completed",
        payment_method: method,
      });

      if (bookingError) throw bookingError;

      const { error: seatsError } = await supabase
        .from("seats")
        .update({
          status: "booked",
          locked_by: null,
          locked_until: null,
        })
        .in("id", state.selectedSeats);

      if (seatsError) throw seatsError;

      toast.success("Payment successful! Booking confirmed.");
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Preparing secure payment...
          </p>
        </div>
      </div>
    );
  }

  const totalSeats = state?.selectedSeats.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent flex flex-col">
      {/* Header */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack} disabled={processing}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">
                Payment
              </span>
              <span className="text-xs text-muted-foreground">
                100% secure payment, demo flow with Supabase
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="flex-1 container mx-auto px-4 py-6 pb-24 sm:pb-10">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Trip + Amount summary */}
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Bus className="h-8 w-8 text-primary mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    You are paying for
                  </p>
                  <h2 className="text-lg font-bold text-foreground">
                    {bus?.route || "Bus Booking"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Bus {bus?.bus_number || "—"} • {totalSeats} seat
                    {totalSeats > 1 ? "s" : ""} •{" "}
                    {bus?.departure_time && bus?.arrival_time
                      ? `${bus.departure_time} – ${bus.arrival_time}`
                      : "Timing —"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">
                  Amount to pay
                </p>
                <p className="text-2xl font-bold text-primary flex items-center justify-end gap-1">
                  <IndianRupee className="h-5 w-5" />
                  {state?.totalFare}
                </p>
              </div>
            </div>
          </Card>

          {/* Payment methods */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-2">
              Select payment method
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              This is a demo screen. You can plug in Razorpay / Stripe / Paytm
              later at this step.
            </p>

            <RadioGroup
              value={method}
              onValueChange={(value) => setMethod(value as PaymentMethod)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="upi" id="upi" />
                <Label
                  htmlFor="upi"
                  className="flex-1 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">UPI (QR)</p>
                      <p className="text-xs text-muted-foreground">
                        Scan QR using PhonePe, GPay, Paytm, etc.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    Recommended
                  </span>
                </Label>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="card" id="card" />
                <Label
                  htmlFor="card"
                  className="flex-1 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Debit / Credit Card</p>
                      <p className="text-xs text-muted-foreground">
                        Pay using any Visa, Mastercard, RuPay card.
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="cash" id="cash" />
                <Label
                  htmlFor="cash"
                  className="flex-1 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Cash / Offline</p>
                      <p className="text-xs text-muted-foreground">
                        Pay cash to the bus coordinator (for demo/testing).
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </Card>

          {/* QR section when UPI is selected */}
          {method === "upi" && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Scan & Pay (Demo QR)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Scan this QR with any UPI app. After completing the payment,
                press the button below to confirm and generate your ticket.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="rounded-xl border border-dashed border-border p-3 bg-card">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {/* 
                      Replace "/payment-qr.png" with the actual path to your payment QR image.
                      e.g. put qr in /public/qr.png and use src="/qr.png"
                    */}
                    <img
                      src="./public/payment-qr.png"
                      alt="UPI Payment QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    1. Open any UPI app (GPay, PhonePe, Paytm, BHIM, etc.) on
                    your phone.
                  </p>
                  <p>2. Scan the QR code shown here.</p>
                  <p>
                    3. Verify the name / UPI ID and complete the payment for{" "}
                    <span className="font-semibold text-foreground">
                      ₹{state?.totalFare}
                    </span>
                    .
                  </p>
                  <p>
                    4. Once the payment is done, come back to this screen and
                    click{" "}
                    <span className="font-semibold text-foreground">
                      Pay ₹{state?.totalFare}
                    </span>{" "}
                    to confirm and generate your ticket.
                  </p>
                  <p className="italic text-[11px] mt-1">
                    (In a real integration, this step can be automated via
                    payment gateway webhooks.)
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Optional info blocks for other methods (if you want) */}
          {method === "card" && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Card Payment (Demo)
              </h3>
              <p className="text-xs text-muted-foreground">
                In a real app, you would show a card form here or redirect to a
                bank / payment gateway window. For this demo, clicking{" "}
                <span className="font-semibold text-foreground">
                  Pay ₹{state?.totalFare}
                </span>{" "}
                will directly confirm your booking.
              </p>
            </Card>
          )}

          {method === "cash" && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Cash / Offline Payment
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                Please pay the amount to your bus coordinator or transport
                office. After they confirm payment, they can mark your booking
                as paid in the system.
              </p>
              <p className="text-xs text-muted-foreground">
                For demo purposes, pressing{" "}
                <span className="font-semibold text-foreground">
                  Pay ₹{state?.totalFare}
                </span>{" "}
                below will still create a confirmed booking.
              </p>
            </Card>
          )}

          {/* Desktop buttons (scroll with page) */}
          <div className="hidden sm:flex gap-4 mt-2">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayNow}
              disabled={processing}
              className="flex-1"
              size="lg"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                `Pay ${state?.totalFare}`
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
            onClick={handleBack}
            className="flex-1"
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayNow}
            disabled={processing}
            className="flex-1"
            size="lg"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              `Pay ${state?.totalFare}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Payment;