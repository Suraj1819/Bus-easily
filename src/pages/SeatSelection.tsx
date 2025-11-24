import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bus,
  ArrowLeft,
  IndianRupee,
  Info,
  TicketIcon,
  X,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Lock,
  Unlock,
  Loader2,
  PhoneCall,
  User2,
  UserX,
  Calendar,
  Phone,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ===================== Types / Interfaces ===================== */
interface Seat {
  id: string;
  seat_number: string;
  row_number: number;
  column_number: number;
  status: "available" | "locked" | "booked";
  locked_by: string | null;
  locked_until: string | null;
  bus_id?: string;
}
interface BusData {
  id: string;
  bus_number: string;
  route: string;
  fare: number;
  total_seats: number;
  departure_time?: string | null;
  arrival_time?: string | null;
}
interface Booking {
  id: string;
  bus_id: string;
  user_id: string;
  seat_ids: string[];
  total_amount: number;
  status: string;
  booked_at: string;
}
type NotificationKind = "success" | "error" | "info";
interface NotificationItem {
  id: number;
  kind: NotificationKind;
  title: string;
  message?: string;
}

/* ===================== Helpers ===================== */
const normalizeSeatRecord = (seatLike: any): Seat => {
  if (!seatLike) return seatLike;
  const expires = seatLike.locked_until ? new Date(seatLike.locked_until) : null;
  const isExpired = expires && expires <= new Date();
  if (seatLike.status === "locked" && isExpired) {
    return {
      ...seatLike,
      status: "available",
      locked_by: null,
      locked_until: null,
    };
  }
  return seatLike as Seat;
};
const sortSeats = (seatList: Seat[]) =>
  seatList.slice().sort((a, b) =>
    a.row_number === b.row_number
      ? a.column_number - b.column_number
      : a.row_number - b.row_number
  );

/* ===================== Main Component ===================== */
const SeatSelection = () => {
  const { busId } = useParams();
  const navigate = useNavigate();
  const [bus, setBus] = useState<BusData | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string>("");
  const [bookingDetailsOpen, setBookingDetailsOpen] = useState<boolean>(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any>(null);
  
  // ---- tickets drawer/modal states ----
  const [viewTicketsOpen, setViewTicketsOpen] = useState<boolean>(false);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [actionSeat, setActionSeat] = useState<Seat | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<boolean>(false);
  const [driverDetailsOpen, setDriverDetailsOpen] = useState<boolean>(false);
  const [bookedBy, setBookedBy] = useState<{ [key: string]: string }>({});

  // ---- New Status Popup State ----
  const [statusPopupOpen, setStatusPopupOpen] = useState<boolean>(false);
  const [statusPopupType, setStatusPopupType] = useState<"locked" | "booked">("locked");
  const [statusPopupSeat, setStatusPopupSeat] = useState<Seat | null>(null);

  const notify = (kind: NotificationKind, title: string, message?: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, kind, title, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  };

  /* ------------------------------ Effects ------------------------------ */
  useEffect(() => {
    checkAuth();
    fetchBusAndSeats();
    // eslint-disable-next-line
  }, [busId]);

  useEffect(() => {
    if (!seats.length) return;
    const now = new Date();
    const expired = seats.filter(
      (seat) =>
        seat.status === "locked" &&
        seat.locked_until &&
        new Date(seat.locked_until) <= now
    );
    if (expired.length) {
      releaseExpiredSeatLocks(expired.map((seat) => seat.id));
    }
    // eslint-disable-next-line
  }, [seats]);

  useEffect(() => {
    if (!busId) return;
    const channel = supabase
      .channel(`public:seats-bus-${busId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "seats",
          filter: `bus_id=eq.${busId}`,
        },
        (payload) => {
          setSeats((prev) => {
            const nextList = [...prev];
            const incoming = normalizeSeatRecord(payload.new || payload.old);
            const idx = nextList.findIndex((seat) => seat.id === incoming.id);
            if (payload.eventType === "DELETE") {
              if (idx === -1) return prev;
              nextList.splice(idx, 1);
              return sortSeats(nextList);
            }
            if (idx === -1) {
              nextList.push(incoming);
              return sortSeats(nextList);
            }
            nextList[idx] = incoming;
            return sortSeats(nextList);
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [busId]);

  useEffect(() => {
    if (!busId) return;
    const channel = supabase
      .channel(`public:bookings-bus-${busId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `bus_id=eq.${busId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new.status === "confirmed") {
            setBookedBy((prev) => {
              const next = { ...prev };
              payload.new.seat_ids.forEach((id: string) => {
                next[id] = payload.new.user_id;
              });
              return next;
            });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [busId]);

  /* ------------------------------ Data / Auth ------------------------------ */
  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
  };

  const fetchBusAndSeats = async () => {
    try {
      setLoading(true);
      const { data: busData, error: busError } = await supabase
        .from("buses")
        .select("*")
        .eq("id", busId)
        .single();
      if (busError) throw busError;
      setBus(busData as BusData);
      const { data: seatsData, error: seatsError } = await supabase
        .from("seats")
        .select("*")
        .eq("bus_id", busId)
        .order("row_number")
        .order("column_number");
      if (seatsError) throw seatsError;
      setSeats(sortSeats(((seatsData || []) as Seat[]).map(normalizeSeatRecord)));
      // Fetch bookings to build bookedBy map
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("bus_id", busId)
        .eq("status", "confirmed");
      if (bookingsError) throw bookingsError;
      const bookedMap: { [key: string]: string } = {};
      (bookingsData || []).forEach((booking: Booking) => {
        booking.seat_ids.forEach((seatId: string) => {
          bookedMap[seatId] = booking.user_id;
        });
      });
      setBookedBy(bookedMap);
    } catch {
      notify("error", "Bus details unavailable", "Please try a different ride.");
      navigate("/browse");
    } finally {
      setLoading(false);
    }
  };

  const releaseExpiredSeatLocks = async (seatIds: string[]) => {
    try {
      await supabase
        .from("seats")
        .update({
          status: "available",
          locked_by: null,
          locked_until: null,
        })
        .in("id", seatIds);
      setSeats((prev) =>
        sortSeats(
          prev.map((seat) =>
            seatIds.includes(seat.id)
              ? {
                  ...seat,
                  status: "available",
                  locked_by: null,
                  locked_until: null,
                }
              : seat
          )
        )
      );
    } catch {
      notify(
        "error",
        "Could not refresh seat locks",
        "Reload if you continue to see stale locks."
      );
    }
  };

  // Keep this function for when the Current User clicks their OWN booking
   const fetchBookingDetails = async (seatId: string) => {
    try {
      // CHANGE 1: .single() hata kar .limit(1) lagaya
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .contains("seat_ids", [seatId])
        .eq("status", "confirmed")
        .limit(1); // <--- Ye important hai

      if (error) {
        console.error("Booking fetch error:", error);
        throw error;
      }

      // CHANGE 2: Array me se pehla item nikalna manually
      const booking = data?.[0];

      if (!booking) {
        console.log("No booking found");
        return;
      }

      // Check current user
      if (booking.user_id !== userId) {
        notify("info", "Seat already booked", "Someone else grabbed this one.");
        // Agar aap chahte hain ki dusre user ki details dikhe, to 'return' hata dein
        // return; 
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("name, branch, year, phone")
        .eq("user_id", booking.user_id)
        .maybeSingle(); // Yahan maybeSingle safe hai kyunki user ek hi hoga

      if (profileError) throw profileError;

      const seat = seats.find((s) => s.id === seatId);
      
      // ... baaki aapka logic same rahega
      setSelectedBookingDetails({
        seatNumber: seat?.seat_number,
        userName: profile?.name,
        userBranch: profile?.branch,
        userYear: profile?.year,
        userPhone: profile?.phone,
        bookedAt: booking.booked_at,
      });
      setBookingDetailsOpen(true);

    } catch (err) {
      console.error(err);
      notify("error", "Booking details unavailable");
    }
  };

  /* ------------------------------ Seat Actions ------------------------------ */
  const handleSeatClick = (seat: Seat) => {
    // 1. Handle BOOKED seats
    if (seat.status === "booked") {
      // If current user booked it -> Show detailed info
      if (bookedBy[seat.id] === userId) {
        fetchBookingDetails(seat.id);
      } else {
        // If someone else booked it -> Show the "Seat Booked" popup
        setStatusPopupSeat(seat);
        setStatusPopupType("booked");
        setStatusPopupOpen(true);
      }
      return;
    }

    const isExpiredLock =
      seat.status === "locked" &&
      seat.locked_until &&
      new Date(seat.locked_until) <= new Date();

    // 2. Handle LOCKED seats (by others)
    if (seat.status === "locked" && !isExpiredLock && seat.locked_by !== userId) {
      setStatusPopupSeat(seat);
      setStatusPopupType("locked");
      setStatusPopupOpen(true);
      return;
    }

    if (isExpiredLock) {
      releaseExpiredSeatLocks([seat.id]);
      return;
    }

    // 3. Available or Locked by Me -> Open Action Menu
    setActionSeat(seat);
    setActionMenuOpen(true);
  };

  const lockSeatForDay = async (seat: Seat) => {
    try {
      const lockUntil = new Date();
      lockUntil.setDate(lockUntil.getDate() + 1);
      const { error } = await supabase
        .from("seats")
        .update({
          status: "locked",
          locked_by: userId,
          locked_until: lockUntil.toISOString(),
        })
        .eq("id", seat.id)
        .eq("status", "available");
      if (error) throw error;
      setSeats((prev) =>
        sortSeats(
          prev.map((item) =>
            item.id === seat.id
              ? {
                  ...item,
                  status: "locked",
                  locked_by: userId,
                  locked_until: lockUntil.toISOString(),
                }
              : item
          )
        )
      );
      setActionMenuOpen(false);
      notify(
        "success",
        "Seat locked for 24 hours",
        "Complete payment before the lock expires."
      );
    } catch {
      notify("error", "Unable to lock seat", "Please try again.");
    }
  };

  const bookSeat = async (seat: Seat) => {
    try {
      const { error: insertError } = await supabase
        .from("bookings")
        .insert([
          {
            bus_id: busId,
            user_id: userId,
            seat_ids: [seat.id],
            total_amount: bus?.fare || 0,
            status: "confirmed",
            booked_at: new Date().toISOString(),
          },
        ]);
      if (insertError) throw insertError;
      
      const { error: updateError } = await supabase
        .from("seats")
        .update({
          status: "booked",
          locked_by: null,
          locked_until: null,
        })
        .eq("id", seat.id);
      if (updateError) throw updateError;

      setSeats((prev) =>
        sortSeats(
          prev.map((item) =>
            item.id === seat.id
              ? { ...item, status: "booked", locked_by: null, locked_until: null }
              : item
          )
        )
      );
      setBookedBy((prev) => ({ ...prev, [seat.id]: userId }));
      setActionMenuOpen(false);
      notify("success", "Seat booked successfully");
    } catch {
      notify("error", "Unable to book seat", "Please try again.");
    }
  };

  const releaseSeatLock = async (seat: Seat) => {
    try {
      const { error } = await supabase
        .from("seats")
        .update({
          status: "available",
          locked_by: null,
          locked_until: null,
        })
        .eq("id", seat.id)
        .eq("locked_by", userId);
      if (error) throw error;
      setSeats((prev) =>
        sortSeats(
          prev.map((item) =>
            item.id === seat.id
              ? { ...item, status: "available", locked_by: null, locked_until: null }
              : item
          )
        )
      );
      setActionMenuOpen(false);
      notify("success", "Seat lock released");
    } catch {
      notify("error", "Unable to release lock");
    }
  };

  const toggleSeatSelection = (seat: Seat) => {
    setSelectedSeats((prev) =>
      prev.includes(seat.id)
        ? prev.filter((id) => id !== seat.id)
        : [...prev, seat.id]
    );
    setActionMenuOpen(false);
  };

  /* ------------------------------ Bookings / Tickets ------------------------------ */
  const fetchUserBookings = async () => {
    if (!userId) return;
    try {
      setLoadingTickets(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", userId)
        .order("booked_at", { ascending: false });
      if (error) throw error;
      setUserBookings((data || []) as Booking[]);
    } catch {
      notify("error", "Unable to load your tickets");
    } finally {
      setLoadingTickets(false);
    }
  };
  const handleOpenTickets = async () => {
    setViewTicketsOpen(true);
    await fetchUserBookings();
  };

  /* ------------------------------ Derived values ------------------------------ */
  const maxRow = useMemo(
    () => Math.max(...seats.map((s) => s.row_number), 0),
    [seats]
  );
  const normalRows = useMemo(
    () => (maxRow > 0 ? Array.from({ length: maxRow - 1 }, (_, i) => i + 1) : []),
    [maxRow]
  );
  const currentSeatIds = selectedSeats.filter((id) =>
    seats.some((seat) => seat.id === id)
  );
  const totalFare = bus ? currentSeatIds.length * Number(bus.fare) : 0;
  const availableSeatsCount = seats.filter((s) => s.status === "available").length;
  const bookedSeatsCount = seats.filter((s) => s.status === "booked").length;

  const proceedToBooking = () => {
    if (currentSeatIds.length === 0) {
      notify("info", "Pick at least one seat to continue");
      return;
    }
    navigate(`/booking/${busId}`, {
      state: { selectedSeats: currentSeatIds, totalFare },
    });
  };

  const getSeatColor = (seat: Seat) => {
    if (seat.status === "booked") {
      const isOwnBooking = bookedBy[seat.id] === userId;
      return isOwnBooking
        ? "bg-emerald-500/30 hover:bg-emerald-500/40 cursor-pointer border-emerald-500"
        : "bg-destructive/30 hover:bg-destructive/40 cursor-pointer border-destructive";
    }
    if (selectedSeats.includes(seat.id))
      return "bg-primary text-primary-foreground hover:bg-primary/90 border-primary";
    if (seat.status === "locked" && seat.locked_by !== userId)
      return "bg-muted cursor-not-allowed border-muted-foreground";
    if (seat.status === "locked" && seat.locked_by === userId)
      return "bg-primary/20 border-primary/60 hover:bg-primary/30";
    return "bg-accent hover:bg-primary/10 cursor-pointer border-border hover:border-primary/50";
  };

  const actionSeatIsLockedByUser =
    actionSeat?.status === "locked" && actionSeat.locked_by === userId;

  /* ------------------------------ Loading Screen ------------------------------ */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-accent p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Loading bus details and seats...
        </p>
      </div>
    );
  }

  /* ------------------------------ Render ------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent relative">
      {/* Notifications */}
      <NotificationStack notifications={notifications} />
      
      {/* Booking details dialog (For Own Bookings) */}
      <BookingDetailsDialog
        open={bookingDetailsOpen}
        onOpenChange={setBookingDetailsOpen}
        booking={selectedBookingDetails}
      />

      {/* Seat Action Dialog (For Available/Self-Locked) */}
      {actionMenuOpen && actionSeat && (
        <SeatActionDialog
          seat={actionSeat}
          isLockedByUser={actionSeatIsLockedByUser}
          isSelected={selectedSeats.includes(actionSeat.id)}
          onClose={() => setActionMenuOpen(false)}
          onLock={() => lockSeatForDay(actionSeat)}
          onReleaseLock={() => releaseSeatLock(actionSeat)}
          onToggleSelect={() => toggleSeatSelection(actionSeat)}
          onBook={() => bookSeat(actionSeat)}
        />
      )}

      {/* NEW: Status Popup (For Locked/Booked by Others) */}
      {statusPopupOpen && statusPopupSeat && (
        <SeatStatusPopup
          open={statusPopupOpen}
          onClose={() => setStatusPopupOpen(false)}
          type={statusPopupType}
          seat={statusPopupSeat}
        />
      )}

      {/* Driver Details Modal */}
      {driverDetailsOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <Card className="w-full max-w-sm border-border bg-card/95">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bus className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  Driver Details
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDriverDetailsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center">
                  <User2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-semibold text-foreground">
                    Hello John
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center">
                  <PhoneCall className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-semibold text-foreground">
                    8888888888
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                You can contact the driver shortly before departure if needed.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* View Tickets Modal */}
      {viewTicketsOpen && (
        <BookingTicketsModal
          open={viewTicketsOpen}
          onClose={() => setViewTicketsOpen(false)}
          bookings={userBookings}
          loading={loadingTickets}
          bus={bus}
          seats={seats}
        />
      )}

      {/* NAVBAR */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/browse")}
              className="px-2 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm hidden xs:inline">Back</span>
            </Button>
            <div className="flex items-center gap-3 flex-1 sm:flex-initial">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Bus className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm sm:text-lg font-bold text-foreground block truncate">
                  {bus?.bus_number}
                </span>
                <span className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  {bus?.route}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground w-full sm:w-auto justify-end">
            <span className="px-3 py-1 rounded-full bg-accent/60 border border-border">
              Total: <strong>{bus?.total_seats ?? "-"}</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-accent/60 border border-border">
              Available: <strong>{availableSeatsCount}</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-accent/60 border border-border">
              Booked: <strong>{bookedSeatsCount}</strong>
            </span>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT: Seat Selection */}
          <div className="lg:col-span-2">
            <Card className="p-4 sm:p-6 border-border">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    Select Your Seats
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Tap a seat to lock it for 24 hours or add it to your booking.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="gap-2 self-start sm:self-center text-[11px] sm:text-xs"
                >
                  <Info className="h-3 w-3" />
                  Booked seats still show who’s travelling
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 sm:mb-6 text-xs sm:text-sm">
                <div className="bg-accent/60 rounded-lg p-3 border border-border">
                  <p className="text-muted-foreground">Fare per seat</p>
                  <p className="mt-1 font-semibold text-foreground flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {bus?.fare}
                  </p>
                </div>
                <div className="bg-accent/60 rounded-lg p-3 border border-border">
                  <p className="text-muted-foreground">Available seats</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {availableSeatsCount}
                  </p>
                </div>
                <div className="bg-accent/60 rounded-lg p-3 border border-border">
                  <p className="text-muted-foreground">Total seats</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {bus?.total_seats ?? "-"}
                  </p>
                </div>
              </div>
              <div className="mb-4 sm:mb-6 flex justify-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDriverDetailsOpen(true)}
                  className="flex items-center gap-2 bg-accent px-3 sm:px-4 py-2 rounded-lg border-2 border-border hover:border-primary/60 hover:bg-accent/80 transition"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bus className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    Driver details
                  </span>
                </button>
              </div>
              <div className="bg-gradient-to-b from-accent/20 to-transparent p-4 sm:p-6 rounded-xl overflow-x-auto">
                <div className="flex flex-col gap-3 min-w-[260px] sm:min-w-[340px] mx-auto">
                  {normalRows.map((row) => (
                    <div
                      key={row}
                      className="flex items-center justify-center gap-4 sm:gap-6"
                    >
                      <span className="w-6 text-[10px] sm:text-xs font-semibold text-muted-foreground text-center bg-accent px-2 py-1 rounded">
                        {row}
                      </span>
                      <div className="flex gap-4 sm:gap-6 items-center">
                        {/* Left pair */}
                        <div className="flex gap-2 sm:gap-3">
                          {[1, 2].map((col) => {
                            const seat = seats.find(
                              (s) =>
                                s.row_number === row && s.column_number === col
                            );
                            return seat ? (
                              <button
                                key={seat.id}
                                onClick={() => handleSeatClick(seat)}
                                className={cn(
                                  "w-10 h-10 sm:w-14 sm:h-14 rounded-lg border-2 flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all shadow-sm hover:shadow-md hover:scale-105",
                                  getSeatColor(seat),
                                  selectedSeats.includes(seat.id)
                                    ? "ring-2 ring-primary/40"
                                    : ""
                                )}
                              >
                                {seat.seat_number}
                              </button>
                            ) : (
                              <div
                                key={`${row}-${col}`}
                                className="w-10 h-10 sm:w-14 sm:h-14"
                              />
                            );
                          })}
                        </div>
                        {/* Aisle */}
                        <div className="w-6 sm:w-10 border-l-2 border-dashed border-border/40 h-full" />
                        <div className="flex gap-2 sm:gap-3">
                          {[3, 4].map((col) => {
                            const seat = seats.find(
                              (s) =>
                                s.row_number === row && s.column_number === col
                            );
                            return seat ? (
                              <button
                                key={seat.id}
                                onClick={() => handleSeatClick(seat)}
                                className={cn(
                                  "w-10 h-10 sm:w-14 sm:h-14 rounded-lg border-2 flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all shadow-sm hover:shadow-md hover:scale-105",
                                  getSeatColor(seat),
                                  selectedSeats.includes(seat.id)
                                    ? "ring-2 ring-primary/40"
                                    : ""
                                )}
                              >
                                {seat.seat_number}
                              </button>
                            ) : (
                              <div
                                key={`${row}-${col}`}
                                className="w-10 h-10 sm:w-14 sm:h-14"
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Last row – 5 seats */}
                  {maxRow > 0 && (
                    <div className="flex items-center justify-center gap-4 sm:gap-6">
                      <span className="w-6 text-[10px] sm:text-xs font-semibold text-muted-foreground text-center bg-accent px-2 py-1 rounded">
                        {maxRow}
                      </span>
                      <div className="flex gap-2 sm:gap-3">
                        {[1, 2, 3, 4, 5].map((col) => {
                          const seat = seats.find(
                            (s) =>
                              s.row_number === maxRow &&
                              s.column_number === col
                          );
                          return seat ? (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              className={cn(
                                "w-10 h-10 sm:w-14 sm:h-14 rounded-lg border-2 flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all shadow-sm hover:shadow-md hover:scale-105",
                                getSeatColor(seat),
                                selectedSeats.includes(seat.id)
                                  ? "ring-2 ring-primary/40"
                                  : ""
                              )}
                            >
                              {seat.seat_number}
                            </button>
                          ) : (
                            <div
                              key={`${maxRow}-${col}`}
                              className="w-10 h-10 sm:w-14 sm:h-14"
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
          {/* RIGHT: Booking Summary */}
          <div className="lg:col-span-1 mt-6 lg:mt-0 lg:relative">
            <div className="lg:sticky lg:top-[100px]">
              <Card className="p-4 sm:p-6 border-border space-y-4 h-fit">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-primary" />
                    Booking Summary
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs sm:text-sm"
                    onClick={handleOpenTickets}
                  >
                    <TicketIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">View Tickets</span>
                    <span className="sm:hidden">Tickets</span>
                  </Button>
                </div>
                <div className="bg-accent p-3 sm:p-4 rounded-lg space-y-1">
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Bus
                  </p>
                  <p className="font-semibold text-foreground text-sm sm:text-base">
                    {bus?.bus_number} • {bus?.route}
                  </p>
                </div>
                <div className="bg-accent p-3 sm:p-4 rounded-lg">
                  <p className="text-[11px] sm:text-xs text-muted-foreground mb-2">
                    Selected Seats
                  </p>
                  {currentSeatIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {seats
                        .filter((s) => currentSeatIds.includes(s.id))
                        .map((s) => (
                          <Badge
                            key={s.id}
                            variant="default"
                            className="text-xs sm:text-sm"
                          >
                            {s.seat_number}
                          </Badge>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground italic">
                      No seats selected yet
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1 bg-accent p-3 rounded-lg">
                    <span className="text-[11px] sm:text-xs text-muted-foreground">
                      Number of Seats
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {currentSeatIds.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 bg-accent p-3 rounded-lg">
                    <span className="text-[11px] sm:text-xs text-muted-foreground">
                      Fare per Seat
                    </span>
                    <span className="text-lg font-bold text-foreground flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {bus?.fare ?? "-"}
                    </span>
                  </div>
                </div>
                <div className="border-t-2 border-border pt-4 mt-2">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    Total Amount
                  </p>
                  <div className="flex items-center gap-1 text-3xl sm:text-4xl font-bold text-primary">
                    <IndianRupee className="h-6 w-6 sm:h-8 sm:w-8" />
                    {totalFare}
                  </div>
                  {currentSeatIds.length > 0 && (
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-2">
                      ₹{bus?.fare} × {currentSeatIds.length} seat
                      {currentSeatIds.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <Button
                  onClick={proceedToBooking}
                  disabled={currentSeatIds.length === 0}
                  className="w-full shadow-lg text-sm sm:text-base"
                  size="lg"
                >
                  {currentSeatIds.length === 0
                    ? "Select Seats to Continue"
                    : "Proceed to Payment"}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===================== New Seat Status Popup Component ===================== */
const SeatStatusPopup = ({
  open,
  onClose,
  type,
  seat,
}: {
  open: boolean;
  onClose: () => void;
  type: "locked" | "booked";
  seat: Seat;
}) => {
  if (!open || !seat) return null;

  const isLocked = type === "locked";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <Card className="w-full max-w-xs bg-card border-border shadow-2xl overflow-hidden rounded-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 flex flex-col items-center text-center">
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center mb-4 shadow-sm",
            isLocked ? "bg-secondary/50 text-secondary-foreground" : "bg-destructive/10 text-destructive"
          )}>
            {isLocked ? (
              <Lock className="h-6 w-6" />
            ) : (
              <UserX className="h-6 w-6" />
            )}
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">
            {isLocked ? "Seat Locked" : "Seat Booked"}
          </h2>

          <Badge variant="secondary" className="mb-3 text-sm px-3 py-0.5 font-semibold bg-secondary/60">
            Seat {seat.seat_number}
          </Badge>

          <p className="text-sm text-muted-foreground mb-1">
            {isLocked ? "Locked by another user" : "Booked by another user"}
          </p>

          {isLocked && seat.locked_until && (
            <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-muted-foreground font-medium">
              <Clock className="h-3 w-3" />
              <span>Expires: {new Date(seat.locked_until).toLocaleTimeString()}</span>
            </div>
          )}

          <Button
            variant="default"
            className="w-full mt-6 font-semibold"
            onClick={onClose}
          >
            Got it
          </Button>
        </div>
      </Card>
    </div>
  );
};

// ... Keeping existing modals ...
const BookingTicketsModal = ({
  open,
  onClose,
  bookings,
  loading,
  bus,
  seats,
}: {
  open: boolean;
  onClose: () => void;
  bookings: Booking[];
  loading: boolean;
  bus: BusData | null;
  seats: Seat[];
}) => {
  return open ? (
    <div className="fixed inset-0 z-[520] bg-black/40 backdrop-blur-sm flex items-center justify-center px-2 py-2">
      <div className="relative w-full max-w-2xl bg-white rounded-xl border border-border shadow-2xl overflow-y-auto max-h-[80vh] p-4 sm:p-8">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
          <TicketIcon className="h-5 w-5 text-primary" />
          Your Tickets
        </h2>
        {loading ? (
          <div className="w-full flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">
            You have no bookings yet.
          </p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className="p-4 border border-muted bg-muted/40 rounded-lg"
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                  <div>
                    <div className="text-[12px] text-muted-foreground mb-1">
                      Booked At
                    </div>
                    <div className="text-[15px] font-semibold">
                      {new Date(booking.booked_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-muted-foreground mb-1">
                      Booking Status
                    </div>
                    <Badge
                      variant={
                        booking.status === "confirmed"
                          ? "default"
                          : (booking.status === "pending"
                              ? "secondary"
                              : "destructive")
                      }
                      className="px-3 py-1 rounded-full text-xs"
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </div>
                <hr className="my-3" />
                <div className="flex flex-wrap gap-3 mb-2">
                  <span className="text-xs text-muted-foreground mr-2">
                    Seats:
                  </span>
                  {booking.seat_ids.map((sid) => {
                    const seat = seats.find((s) => s.id === sid);
                    return (
                      <Badge key={sid} variant="outline" className="text-xs">
                        {seat?.seat_number || sid}
                      </Badge>
                    );
                  })}
                </div>
                <div className="mt-3 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-3">
                  <span>
                    Fare per seat:{" "}
                    <strong className="text-foreground">
                      ₹{bus?.fare || "?"}
                    </strong>
                  </span>
                  <span>
                    × Seats:{" "}
                    <strong className="text-foreground">{booking.seat_ids.length}</strong>
                  </span>
                  <span>
                    = Total:{" "}
                    <strong className="text-foreground">
                      ₹{booking.total_amount !== undefined && booking.total_amount !== null
                        ? booking.total_amount
                        : (bus?.fare ? booking.seat_ids.length * bus.fare : "?")}
                    </strong>
                  </span>
                </div>
                {bus && (
                  <>
                    <div className="flex gap-2 text-xs mt-2">
                      <div className="bg-accent px-2 rounded font-semibold">
                        Bus: {bus.bus_number}
                      </div>
                      <div className="bg-accent px-2 rounded">{bus.route}</div>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  ) : null;
};
const NotificationStack = ({
  notifications,
}: {
  notifications: NotificationItem[];
}) => (
  <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[90] space-y-2 w-64 sm:w-72">
    {notifications.map((item) => (
      <div
        key={item.id}
        className={cn(
          "rounded-xl border px-3 py-2 sm:px-4 sm:py-3 shadow-lg backdrop-blur bg-card/95 flex flex-col gap-1 text-xs sm:text-sm",
          item.kind === "success" && "border-emerald-500/70",
          item.kind === "error" && "border-destructive/70",
          item.kind === "info" && "border-primary/60"
        )}
      >
        <div className="flex items-center gap-2 font-semibold">
          {item.kind === "success" && (
            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
          )}
          {item.kind === "error" && (
            <X className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
          )}
          {item.kind === "info" && (
            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          )}
          <span className="truncate">{item.title}</span>
        </div>
        {item.message && (
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            {item.message}
          </p>
        )}
      </div>
    ))}
  </div>
);
const SeatActionDialog = ({
  seat,
  isLockedByUser,
  isSelected,
  onClose,
  onLock,
  onReleaseLock,
  onToggleSelect,
  onBook,
}: {
  seat: Seat;
  isLockedByUser: boolean;
  isSelected: boolean;
  onClose: () => void;
  onLock: () => void;
  onReleaseLock: () => void;
  onToggleSelect: () => void;
  onBook: () => void;
}) => (
  <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
    <Card className="w-full max-w-sm border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border/60">
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground">
            Seat
          </span>
          <span className="text-lg sm:text-xl font-semibold text-foreground">
            {seat.seat_number}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 sm:p-5 space-y-4">
        <div className="bg-accent/60 border border-border rounded-lg p-3 sm:p-4 space-y-2">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Choose what to do with this seat
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Lock it for 24 hours or add it to your booking cart.
              </p>
            </div>
          </div>
        </div>
        {!isLockedByUser && (
          <Button
            variant="default"
            className="w-full justify-start gap-3 text-sm"
            onClick={onLock}
          >
            <Lock className="h-4 w-4" />
            Lock seat for 24 hours
          </Button>
        )}
        {isLockedByUser && (
          <Button
            variant="secondary"
            className="w-full justify-start gap-3 text-sm"
            onClick={onReleaseLock}
          >
            <Unlock className="h-4 w-4" />
            Release seat lock
          </Button>
        )}
        <Button
          variant={isSelected ? "destructive" : "outline"}
          className="w-full justify-start gap-3 text-sm"
          onClick={onToggleSelect}
        >
          <CheckCircle2 className="h-4 w-4" />
          {isSelected ? "Remove from booking" : "Select for booking"}
        </Button>
        {/* <Button
          variant="outline"
          className="w-full justify-start gap-3 text-sm"
          onClick={onBook}
        >
          <CheckCircle2 className="h-4 w-4" />
          Book this seat
        </Button> */}
        {seat.locked_until && (
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground mt-2">
            <Clock className="h-3 w-3" />
            Lock ends: {new Date(seat.locked_until).toLocaleString()}
          </div>
        )}
      </div>
    </Card>
  </div>
);
const BookingDetailsDialog = ({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
}) => {
  if (!open || !booking) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6">
      <Card className="w-full max-w-md bg-card border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="relative p-6 bg-gradient-to-br from-primary/5 to-accent/5">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <TicketIcon className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Booking Details</h2>
            <p className="text-sm text-muted-foreground">Seat {booking.seatNumber}</p>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 text-primary flex-shrink-0">
                <User2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Passenger Name</p>
                <p className="text-sm font-medium text-foreground">{booking.userName || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 text-primary flex-shrink-0">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Branch & Year</p>
                <p className="text-sm font-medium text-foreground">
                  {booking.userBranch || 'N/A'} - {booking.userYear || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 text-primary flex-shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contact Number</p>
                <p className="text-sm font-medium text-foreground">{booking.userPhone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 text-primary flex-shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Booked At</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(booking.bookedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="default"
            className="w-full mt-4"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SeatSelection;