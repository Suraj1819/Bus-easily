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

interface DriverInfo {
  name: string | null;
  phone: string | null;
}

interface ConductorInfo {
  name: string | null;
  phone: string | null;
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
  const [viewTicketsOpen, setViewTicketsOpen] = useState<boolean>(false);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [actionSeat, setActionSeat] = useState<Seat | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<boolean>(false);
  const [driverDetailsOpen, setDriverDetailsOpen] = useState<boolean>(false);
  const [bookedBy, setBookedBy] = useState<{ [key: string]: string }>({});
  const [statusPopupOpen, setStatusPopupOpen] = useState<boolean>(false);
  const [statusPopupType, setStatusPopupType] = useState<"locked" | "booked">("locked");
  const [statusPopupSeat, setStatusPopupSeat] = useState<Seat | null>(null);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [conductor, setConductor] = useState<ConductorInfo | null>(null);

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
  }, [seats]);

  // Realtime seat changes
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

  // Realtime bookings (for bookedBy map)
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

  // Realtime bus updates
  useEffect(() => {
    if (!busId) return;

    const channel = supabase
      .channel(`public:buses-${busId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "buses",
          filter: `id=eq.${busId}`,
        },
        (payload) => {
          const newBus = payload.new as any;

          setBus((prev) => ({
            ...(prev || {}),
            ...newBus,
          }));

          setDriver({
            name: newBus.driver_name ?? null,
            phone: newBus.driver_phone ?? null,
          });

          setConductor({
            name: newBus.conductor_name ?? null,
            phone: newBus.conductor_phone ?? null,
          });
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
        .select(
          `
          *,
          driver_name,
          driver_phone,
          conductor_name,
          conductor_phone
        `
        )
        .eq("id", busId)
        .single();

      if (busError) throw busError;

      setBus(busData as BusData);

      setDriver({
        name: (busData as any).driver_name ?? null,
        phone: (busData as any).driver_phone ?? null,
      });

      setConductor({
        name: (busData as any).conductor_name ?? null,
        phone: (busData as any).conductor_phone ?? null,
      });

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

  const fetchBookingDetails = async (seatId: string) => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .contains("seat_ids", [seatId])
        .eq("status", "confirmed")
        .limit(1);

      if (error) {
        console.error("Booking fetch error:", error);
        throw error;
      }

      const booking = data?.[0];

      if (!booking) {
        console.log("No booking found");
        return;
      }

      if (booking.user_id !== userId) {
        notify("info", "Seat already booked", "Someone else grabbed this one.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("name, branch, year, phone")
        .eq("user_id", booking.user_id)
        .maybeSingle();

      if (profileError) throw profileError;

      const seat = seats.find((s) => s.id === seatId);

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
    if (seat.status === "booked") {
      if (bookedBy[seat.id] === userId) {
        fetchBookingDetails(seat.id);
      } else {
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
        ? "bg-emerald-500/30 hover:bg-emerald-500/40 cursor-pointer border-emerald-500 text-emerald-900"
        : "bg-destructive/30 hover:bg-destructive/40 cursor-pointer border-destructive text-destructive-foreground";
    }
    if (selectedSeats.includes(seat.id))
      return "bg-primary text-primary-foreground hover:bg-primary/90 border-primary";
    if (seat.status === "locked" && seat.locked_by !== userId)
      return "bg-muted cursor-not-allowed border-muted-foreground text-muted-foreground";
    if (seat.status === "locked" && seat.locked_by === userId)
      return "bg-primary/20 border-primary/60 hover:bg-primary/30 text-primary";
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
    <div className="min-h-screen bg-gradient-to-b from-background to-accent relative pb-24 lg:pb-8">
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

      {/* Status Popup (For Locked/Booked by Others) */}
      {statusPopupOpen && statusPopupSeat && (
        <SeatStatusPopup
          open={statusPopupOpen}
          onClose={() => setStatusPopupOpen(false)}
          type={statusPopupType}
          seat={statusPopupSeat}
        />
      )}

      {/* Driver & Conductor Details Modal */}
      {driverDetailsOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm border-border bg-card/95">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bus className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  Driver & Conductor Details
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

            <div className="p-4 space-y-4">
              {/* DRIVER */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Driver
                </h3>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center">
                    <User2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Name</p>
                    <p className="text-sm font-semibold text-foreground">
                      {driver?.name || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center">
                    <PhoneCall className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Phone</p>
                    <p className="text-sm font-semibold text-foreground">
                      {driver?.phone || "Not available"}
                    </p>
                  </div>
                </div>
              </div>

              <hr className="border-border/60" />

              {/* CONDUCTOR */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Conductor
                </h3>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center">
                    <User2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Name</p>
                    <p className="text-sm font-semibold text-foreground">
                      {conductor?.name || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center">
                    <PhoneCall className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Phone</p>
                    <p className="text-sm font-semibold text-foreground">
                      {conductor?.phone || "Not available"}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground mt-2">
                You can contact the driver or conductor shortly before departure if
                needed.
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
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/browse")}
              className="px-2 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </Button>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Bus className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-bold text-foreground block truncate">
                  {bus?.bus_number}
                </span>
                <span className="text-[10px] text-muted-foreground truncate block">
                  {bus?.route}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground w-full sm:w-auto justify-end flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-accent/60 border border-border">
              Total: <strong>{bus?.total_seats ?? "-"}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-accent/60 border border-border">
              Available: <strong>{availableSeatsCount}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-accent/60 border border-border">
              Booked: <strong>{bookedSeatsCount}</strong>
            </span>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
          {/* LEFT: Seat Selection */}
          <div className="lg:col-span-2">
            <Card className="p-4 sm:p-6 border-border">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
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
                  Booked seats still show who's travelling
                </Badge>
              </div>

              {/* --- SEAT COLOR LEGEND --- */}
              <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 p-3 bg-accent/40 rounded-lg border border-border/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border bg-emerald-500/30 border-emerald-500"></div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    Your Booking
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border bg-destructive/30 border-destructive"></div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    Booked
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border bg-primary/20 border-primary/60"></div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    Your Lock
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border bg-muted border-muted-foreground"></div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    Locked
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border bg-primary border-primary"></div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    Selected
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border bg-accent border-border"></div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    Available
                  </span>
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
              <div className="bg-gradient-to-b from-accent/20 to-transparent p-3 sm:p-6 rounded-xl overflow-x-auto">
                <div className="flex flex-col gap-2 min-w-[240px] sm:min-w-[340px] mx-auto">
                  {normalRows.map((row) => (
                    <div
                      key={row}
                      className="flex items-center justify-center gap-3 sm:gap-6"
                    >
                      <span className="w-5 sm:w-6 text-[10px] sm:text-xs font-semibold text-muted-foreground text-center bg-accent px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                        {row}
                      </span>
                      <div className="flex gap-3 sm:gap-6 items-center">
                        {/* Left pair */}
                        <div className="flex gap-1.5 sm:gap-3">
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
                                  "w-8 h-8 sm:w-12 sm:h-12 rounded-lg border-2 flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all shadow-sm hover:shadow-md hover:scale-105",
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
                                className="w-8 h-8 sm:w-12 sm:h-12"
                              />
                            );
                          })}
                        </div>
                        {/* Aisle */}
                        <div className="w-4 sm:w-8 border-l-2 border-dashed border-border/40 h-full" />
                        <div className="flex gap-1.5 sm:gap-3">
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
                                  "w-8 h-8 sm:w-12 sm:h-12 rounded-lg border-2 flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all shadow-sm hover:shadow-md hover:scale-105",
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
                                className="w-8 h-8 sm:w-12 sm:h-12"
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Last row – 5 seats */}
                  {maxRow > 0 && (
                    <div className="flex items-center justify-center gap-3 sm:gap-6">
                      <span className="w-5 sm:w-6 text-[10px] sm:text-xs font-semibold text-muted-foreground text-center bg-accent px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                        {maxRow}
                      </span>
                      <div className="flex gap-1.5 sm:gap-3">
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
                                "w-8 h-8 sm:w-12 sm:h-12 rounded-lg border-2 flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all shadow-sm hover:shadow-md hover:scale-105",
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
                              className="w-8 h-8 sm:w-12 sm:h-12"
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
          <div className="lg:col-span-1 mt-4 lg:mt-0">
            <div className="lg:sticky lg:top-[80px]">
              <Card className="p-3 sm:p-4 lg:p-5 border-border/80 shadow-lg space-y-3 h-fit bg-gradient-to-b from-card to-accent/30">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <IndianRupee className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight">
                        Booking Summary
                      </h3>
                      <span className="text-[10px] text-muted-foreground">
                        Review your bus, selected & locked seats
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-[10px] sm:text-xs rounded-full px-2 py-1 h-7"
                    onClick={handleOpenTickets}
                  >
                    <TicketIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">Tickets</span>
                  </Button>
                </div>

                {/* Bus Info */}
                <div className="rounded-xl border border-border/60 bg-background/70 p-3 space-y-1">
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-wide">
                    Bus
                  </p>
                  <p className="font-semibold text-foreground text-sm sm:text-base">
                    {bus?.bus_number ?? "—"}{" "}
                    {bus?.route && (
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        • {bus.route}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 text-[10px] sm:text-[11px] text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-full bg-accent/60 border border-border/70">
                      Total: <strong>{bus?.total_seats ?? "-"}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-accent/60 border border-border/70">
                      Available: <strong>{availableSeatsCount}</strong>
                    </span>
                  </div>
                </div>

                {/* Selected Seats */}
                <div className="rounded-xl border border-border/60 bg-background/70 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-wide">
                      Selected Seats
                    </p>
                    {currentSeatIds.length > 0 && (
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                        {currentSeatIds.length} selected
                      </span>
                    )}
                  </div>

                  {currentSeatIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {seats
                        .filter((s) => currentSeatIds.includes(s.id))
                        .map((s) => (
                          <Badge
                            key={s.id}
                            variant="outline"
                            className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer hover:border-primary/60"
                            onClick={() => toggleSeatSelection(s)}
                          >
                            <span>{s.seat_number}</span>
                            <X className="h-3 w-3 opacity-70" />
                          </Badge>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground italic">
                      No seats selected yet. Tap a seat in the bus layout to add it here.
                    </p>
                  )}
                </div>

                {/* Locked Seats (by you) */}
                <div className="rounded-xl border border-border/60 bg-background/70 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      Locked Seats
                      <Lock className="h-3 w-3 text-primary" />
                    </p>
                  </div>

                  {seats.some(
                    (s) => s.status === "locked" && s.locked_by === userId
                  ) ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {seats
                        .filter(
                          (s) => s.status === "locked" && s.locked_by === userId
                        )
                        .map((s) => (
                          <Badge
                            key={s.id}
                            variant="secondary"
                            className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                          >
                            <span>{s.seat_number}</span>
                            {s.locked_until && (
                              <span className="text-[9px] opacity-70">
                                until{" "}
                                {new Date(s.locked_until).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </Badge>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground italic">
                      You haven't locked any seats yet.
                    </p>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Number of Seats */}
                    <div className="flex flex-col gap-1 rounded-xl bg-background/80 border border-border/70 p-3">
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-wide">
                        Seats Selected
                      </span>
                      <div className="flex items-end justify-between">
                        <span className="text-2xl font-extrabold text-foreground leading-none">
                          {currentSeatIds.length}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                          out of {bus?.total_seats ?? "-"}
                        </span>
                      </div>
                    </div>

                    {/* Fare per Seat */}
                    <div className="flex flex-col gap-1 rounded-xl bg-background/80 border border-border/70 p-3">
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-wide">
                        Fare per Seat
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-extrabold text-foreground flex items-center gap-1 leading-none">
                          <IndianRupee className="h-4 w-4 text-primary" />
                          {bus?.fare ?? "-"}
                        </span>
                        {currentSeatIds.length > 0 && (
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                            x {currentSeatIds.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-border/70 pt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Total Amount
                    </p>
                    {currentSeatIds.length > 0 && (
                      <p className="text-[11px] sm:text-xs text-muted-foreground">
                        ₹{bus?.fare} × {currentSeatIds.length} seat
                        {currentSeatIds.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-1 text-3xl sm:text-4xl font-extrabold text-primary">
                      <IndianRupee className="h-6 w-6 sm:h-7 sm:w-7" />
                      <span>{totalFare}</span>
                    </div>
                    {currentSeatIds.length > 0 && (
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                        Taxes / extra charges: Included
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA (Hidden on Mobile to use Fixed Footer instead) */}
                <Button
                  onClick={proceedToBooking}
                  disabled={currentSeatIds.length === 0}
                  className={cn(
                    "w-full shadow-lg text-sm sm:text-base rounded-xl transition-all py-6 hidden lg:flex",
                    currentSeatIds.length === 0
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  )}
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

      {/* FIXED MOBILE FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 lg:hidden z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
          <div>
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="text-xl font-bold flex items-center text-foreground">
              <IndianRupee className="h-4 w-4" />
              {totalFare}
            </p>
          </div>
          <Button
            size="lg"
            className="flex-1 font-bold"
            onClick={proceedToBooking}
            disabled={currentSeatIds.length === 0}
          >
            Proceed to Pay
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ===================== Component Definitions ===================== */
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-xs bg-card border-border shadow-2xl overflow-hidden rounded-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 flex flex-col items-center text-center">
          <div
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center mb-4 shadow-sm",
              isLocked
                ? "bg-secondary/50 text-secondary-foreground"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {isLocked ? (
              <Lock className="h-6 w-6" />
            ) : (
              <UserX className="h-6 w-6" />
            )}
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">
            {isLocked ? "Seat Locked" : "Seat Booked"}
          </h2>

          <Badge
            variant="secondary"
            className="mb-3 text-sm px-3 py-0.5 font-semibold bg-secondary/60"
          >
            Seat {seat.seat_number}
          </Badge>

          <p className="text-sm text-muted-foreground mb-1">
            {isLocked ? "Locked by another user" : "Booked by another user"}
          </p>

          {isLocked && seat.locked_until && (
            <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-muted-foreground font-medium">
              <Clock className="h-3 w-3" />
              <span>
                Expires: {new Date(seat.locked_until).toLocaleTimeString()}
              </span>
            </div>
          )}

          <Button
            variant="default"
            className="w-full mt-6 font-semibold py-6"
            onClick={onClose}
          >
            Got it
          </Button>
        </div>
      </Card>
    </div>
  );
};

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[520] bg-black/40 backdrop-blur-sm flex items-center justify-center p-2">
      <div className="relative w-full max-w-3xl bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/70 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <TicketIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                Your Tickets
              </h2>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                All your bookings for this bus
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[75vh] overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 pt-3 space-y-4">
          {loading ? (
            <div className="w-full flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Fetching your tickets...
              </p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-16 space-y-2">
              <p className="text-sm sm:text-base text-foreground font-semibold">
                You have not booked any tickets
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground text-center max-w-xs">
                Once you book seats from this bus layout, they will appear here
                as your tickets.
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {bookings.map((booking) => {
                const bookedSeats =
                  booking.seat_ids
                    ?.map((sid) => seats.find((s) => s.id === sid))
                    .filter((s): s is Seat => Boolean(s)) ?? [];

                if (bookedSeats.length === 0) return null;

                return (
                  <Card
                    key={booking.id}
                    className="border border-border/70 bg-card/90 rounded-xl overflow-hidden"
                  >
                    {/* Top strip: booked time + status */}
                    <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-3 border-b border-border/60 bg-gradient-to-r from-accent/40 to-card">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                            Booked At
                          </span>
                          <span className="text-sm sm:text-[15px] font-semibold text-foreground">
                            {new Date(booking.booked_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-1">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                            Status
                          </span>
                          <Badge
                            variant={
                              booking.status === "confirmed"
                                ? "default"
                                : booking.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                            className="px-3 py-1 rounded-full text-[11px] sm:text-xs"
                          >
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Middle: bus info + seats */}
                    <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
                      {/* Bus info (current bus) */}
                      {bus && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                              Bus
                            </p>
                            <p className="text-sm sm:text-base font-semibold text-foreground">
                              {bus.bus_number}{" "}
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                • {bus.route}
                              </span>
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
                            <span className="px-2 py-0.5 rounded-full bg-accent/60 border border-border/70">
                              Total seats: <strong>{bus.total_seats}</strong>
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-accent/60 border border-border/70">
                              Seats in this booking:{" "}
                              <strong>{bookedSeats.length}</strong>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Seats list */}
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          Seats in this booking
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {bookedSeats.map((seat) => (
                            <Badge
                              key={seat.id}
                              variant="outline"
                              className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full"
                            >
                              {seat.seat_number}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: price breakdown */}
                    <div className="px-4 sm:px-5 pb-3 sm:pb-4 pt-2 border-t border-dashed border-border/60 bg-accent/30">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>
                            Fare per seat:{" "}
                            <strong className="text-foreground">
                              ₹{bus?.fare || "?"}
                            </strong>
                          </span>
                          <span>
                            × Seats:{" "}
                            <strong className="text-foreground">
                              {bookedSeats.length}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span>= Total:</span>
                          <span className="flex items-center gap-1 text-sm sm:text-base font-semibold text-primary">
                            <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4" />
                            {booking.total_amount ??
                              (bus?.fare
                                ? bookedSeats.length * bus.fare
                                : "?")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
  <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
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
      <div className="p-4 sm:p-5 space-y-3">
        <div className="bg-accent/60 border border-border rounded-lg p-3 space-y-2">
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
            className="w-full justify-start gap-3 text-sm py-6"
            onClick={onLock}
          >
            <Lock className="h-4 w-4" />
            Lock seat for 24 hours
          </Button>
        )}
        {isLockedByUser && (
          <Button
            variant="secondary"
            className="w-full justify-start gap-3 text-sm py-6"
            onClick={onReleaseLock}
          >
            <Unlock className="h-4 w-4" />
            Release seat lock
          </Button>
        )}
        <Button
          variant={isSelected ? "destructive" : "outline"}
          className="w-full justify-start gap-3 text-sm py-6"
          onClick={onToggleSelect}
        >
          <CheckCircle2 className="h-4 w-4" />
          {isSelected ? "Remove from booking" : "Select for booking"}
        </Button>
        {seat.locked_until && (
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground mt-2 pt-2 border-t border-border/20">
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md bg-card border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="relative p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-accent/5">
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
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Booking Details
            </h2>
            <p className="text-sm text-muted-foreground">
              Seat {booking.seatNumber}
            </p>
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 text-primary flex-shrink-0">
                <User2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Passenger Name</p>
                <p className="text-sm font-medium text-foreground">
                  {booking.userName || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 text-primary flex-shrink-0">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Branch & Year</p>
                <p className="text-sm font-medium text-foreground">
                  {booking.userBranch || "N/A"} - {booking.userYear || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-5 w-5 text-primary flex-shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contact Number</p>
                <p className="text-sm font-medium text-foreground">
                  {booking.userPhone || "N/A"}
                </p>
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
            className="w-full mt-4 py-6"
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