import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bus,
  ArrowLeft,
  Ticket as TicketIcon,
  IndianRupee,
  Clock,
  CalendarDays,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  X,
  Download,
  Trash2,
  Info,
  Loader2,
  Ban,
  AlertTriangle, 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- React-PDF Imports ---
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ==========================================
//  PROFESSIONAL MINIMAL TICKET PDF
// ==========================================

const theme = {
  primary: "#2563EB", 
  textDark: "#111827", 
  textGray: "#6B7280", 
  divider: "#E5E7EB", 
  bg: "#F3F4F6",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    backgroundColor: theme.bg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  ticketContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  accentStrip: {
    height: 6,
    backgroundColor: theme.primary,
    width: "100%",
  },
  header: {
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  headerTitle: {
    fontSize: 10,
    color: theme.textGray,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  bookingIdLabel: {
    fontSize: 8,
    color: theme.textGray,
    textAlign: "right",
  },
  bookingIdValue: {
    fontSize: 10,
    color: theme.textDark,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  body: {
    padding: 24,
  },
  routeBlock: {
    marginBottom: 20,
  },
  routeLabel: {
    fontSize: 8,
    color: theme.primary,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  routeValue: {
    fontSize: 18,
    color: theme.textDark,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 28,
    color: theme.textDark,
    fontFamily: "Helvetica-Bold",
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  colLeft: { alignItems: "flex-start", width: "60%" },
  colRight: { alignItems: "flex-end", width: "40%" },
  fieldGroup: { marginBottom: 12 },
  label: {
    fontSize: 8,
    color: theme.textGray,
    textTransform: "uppercase",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 12,
    color: theme.textDark,
    fontFamily: "Helvetica-Bold",
  },
  seatBox: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: theme.primary,
    borderRadius: 6,
  },
  seatText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
    overflow: "hidden",
    position: "relative",
  },
  cutCircleLeft: {
    position: "absolute",
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.bg,
  },
  cutCircleRight: {
    position: "absolute",
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.bg,
  },
  dashedLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
    borderStyle: "dashed",
    marginHorizontal: 10,
  },
  footer: {
    padding: 24,
    backgroundColor: "#FAFAFA",
  },
  passengerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  passengerName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: theme.textDark,
  },
  passengerSub: {
    fontSize: 9,
    color: theme.textGray,
  },
  barcodeContainer: {
    marginTop: 8,
    alignItems: "center",
    opacity: 0.6,
  },
  barcodeBars: {
    flexDirection: "row",
    height: 24,
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 2,
  },
  bar: { backgroundColor: "#000" },
  ticketNote: {
    fontSize: 8,
    color: theme.textGray,
    textAlign: "center",
    marginTop: 6,
  },
});

const TicketPdf = ({ booking, profile, seatsByBus }: { booking: any; profile: any; seatsByBus: any }) => {
  const bookingIdShort = booking.booking_id.slice(0, 8).toUpperCase();
  const bus = booking.bus || {};
  const busNumber = bus.bus_number || "BUS-000";
  const route = bus.route || "Campus Route";
  
  let departureTime = "00:00";
  const depDateRaw = bus.departure_time;
  const depDateObj = new Date(depDateRaw);
  if (!isNaN(depDateObj.getTime())) {
    departureTime = depDateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  } else if (typeof depDateRaw === 'string' && depDateRaw.includes(":")) {
     departureTime = depDateRaw;
  }

  const travelDateRaw = bus.travel_date || bus.date || booking.booked_at;
  const travelDate = new Date(travelDateRaw).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const seatsForBus = seatsByBus[booking.bus_id] || [];
  const seatNumbers = booking.seat_ids?.map((id: any) => {
      const s = seatsForBus.find((seat: any) => seat.id === id);
      return s?.seat_number || String(id);
    }) || [];
  const seatDisplay = seatNumbers.length > 0 ? seatNumbers.join(", ") : "N/A";
  const totalFare = `₹${booking.total_fare.toFixed(2)}`;

  const renderBarcode = () => {
    const bars = [];
    for (let i = 0; i < 40; i++) {
      const width = Math.random() > 0.5 ? 1 : 2.5;
      bars.push(
        <View key={i} style={[styles.bar, { width, height: "100%" }]} />
      );
    }
    return <View style={styles.barcodeBars}>{bars}</View>;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.ticketContainer}>
          <View style={styles.accentStrip} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>BOARDING PASS</Text>
            <View>
              <Text style={styles.bookingIdLabel}>BOOKING REF</Text>
              <Text style={styles.bookingIdValue}>{bookingIdShort}</Text>
            </View>
          </View>
          <View style={styles.body}>
            <View style={styles.routeBlock}>
              <Text style={styles.routeLabel}>Route / Destination</Text>
              <Text style={styles.timeValue}>{departureTime}</Text>
              <Text style={styles.routeValue}>{route}</Text>
            </View>
            <View style={styles.grid}>
              <View style={styles.colLeft}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>DATE</Text>
                  <Text style={styles.value}>{travelDate}</Text>
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>BUS NUMBER</Text>
                  <Text style={styles.value}>{busNumber}</Text>
                </View>
              </View>
              <View style={styles.colRight}>
                 <View style={styles.fieldGroup}>
                  <Text style={[styles.label, {textAlign: 'right'}]}>FARE</Text>
                  <Text style={[styles.value, {textAlign: 'right', color: theme.primary}]}>{totalFare}</Text>
                </View>
                <View style={{alignItems: 'flex-end', marginTop: 4}}>
                  <Text style={styles.label}>SEAT NO</Text>
                  <View style={styles.seatBox}>
                    <Text style={styles.seatText}>{seatDisplay}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.dividerContainer}>
            <View style={styles.cutCircleLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.cutCircleRight} />
          </View>
          <View style={styles.footer}>
            <View style={styles.passengerRow}>
               <View>
                 <Text style={styles.label}>PASSENGER</Text>
                 <Text style={styles.passengerName}>{profile.name}</Text>
                 <Text style={styles.passengerSub}>{profile.branch || "Student"} • {profile.phone || ""}</Text>
               </View>
               <View style={{alignItems: 'flex-end'}}>
                 <Text style={styles.label}>STATUS</Text>
                 <Text style={[styles.value, {color: theme.primary}]}>{booking.status.toUpperCase()}</Text>
               </View>
            </View>
            <View style={styles.barcodeContainer}>
               {renderBarcode()}
               <Text style={styles.ticketNote}>Please show this ticket to the bus conductor.</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ==========================================
//  MAIN DASHBOARD COMPONENT
// ==========================================

interface BusInfo {
  bus_number: string;
  route: string;
  departure_time: string;
}

interface Booking {
  id: string;
  booking_id: string;
  bus_id: string;
  total_fare: number;
  status: string;
  booked_at: string;
  seat_ids?: string[];
  bus: BusInfo;
}

interface Profile {
  name: string;
  phone: string;
  branch: string;
  year: string;
  [key: string]: any;
}

type NotificationKind = "success" | "error" | "info";

interface NotificationItem {
  id: number;
  kind: NotificationKind;
  title: string;
  message?: string;
}

interface SeatInfo {
  id: string;
  seat_number: string;
  bus_id: string;
}

const Dashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [unbooking, setUnbooking] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Dialog States
  const [confirmUnbookOpen, setConfirmUnbookOpen] = useState(false);
  const [bookingToUnbook, setBookingToUnbook] = useState<Booking | null>(null);
  
  // Delete History Dialog State
  const [deleteHistoryOpen, setDeleteHistoryOpen] = useState(false);
  const [historyItemToDelete, setHistoryItemToDelete] = useState<string | null>(null);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);

  const [seatsByBus, setSeatsByBus] = useState<Record<string, SeatInfo[]>>({});

  const navigate = useNavigate();

  const notify = (kind: NotificationKind, title: string, message?: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, kind, title, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error(profileError);
        notify("error", "Profile unavailable", "Some details may be missing.");
      }
      setProfile(profileData as Profile);

      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          bus:buses(bus_number, route, departure_time)
        `
        )
        .eq("user_id", user.id)
        .order("booked_at", { ascending: false });

      if (error) throw error;
      const safeBookings = (bookingsData || []) as Booking[];
      setBookings(safeBookings);

      const busIds = Array.from(new Set(safeBookings.map((b) => b.bus_id)));
      if (busIds.length > 0) {
        const { data: seatsData, error: seatsError } = await supabase
          .from("seats")
          .select("id, seat_number, bus_id")
          .in("bus_id", busIds);

        if (seatsError) throw seatsError;

        const map: Record<string, SeatInfo[]> = {};
        (seatsData || []).forEach((seat: any) => {
          const entry: SeatInfo = {
            id: seat.id,
            seat_number: seat.seat_number,
            bus_id: seat.bus_id,
          };
          if (!map[entry.bus_id]) map[entry.bus_id] = [];
          map[entry.bus_id].push(entry);
        });
        setSeatsByBus(map);
      } else {
        setSeatsByBus({});
      }
    } catch (error: any) {
      console.error(error);
      notify("error", "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const base = status.toLowerCase();
    const variants: Record<string, "default" | "destructive" | "outline"> = {
      confirmed: "default",
      pending: "outline",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[base] || "outline"} className="text-[0.7rem]">
        {base.charAt(0).toUpperCase() + base.slice(1)}
      </Badge>
    );
  };

  const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
  const now = new Date();

  const isOlderThanMonth = (dateStr: string) => {
    const dt = new Date(dateStr);
    return now.getTime() - dt.getTime() >= ONE_MONTH_MS;
  };

  const currentBookings = bookings.filter((b) => {
    if (b.status !== "confirmed") return false;
    return !isOlderThanMonth(b.booked_at);
  });

  const historyBookings = bookings.filter((b) => {
    if (b.status === "cancelled") return true;
    if (b.status === "confirmed" && isOlderThanMonth(b.booked_at)) return true;
    return false;
  });

  // Cancelled Count
  const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

  const totalSpent = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + (b.total_fare || 0), 0);

  const handleViewTicket = (booking: Booking) => {
    setSelectedBooking(booking);
    setTicketOpen(true);
  };

  const closeTicket = () => {
    setTicketOpen(false);
    setSelectedBooking(null);
  };

  const handleBackToBrowse = () => {
    navigate("/browse", { replace: true });
  };

  // --- DIALOG OPENERS ---
  const openUnbookDialog = (booking: Booking) => {
    setBookingToUnbook(booking);
    setConfirmUnbookOpen(true);
  };

  const openDeleteHistoryDialog = (bookingId: string) => {
    setHistoryItemToDelete(bookingId);
    setDeleteHistoryOpen(true);
  };

  // --- ACTIONS ---
  const handleUnbook = async (booking: Booking) => {
    if (booking.status !== "confirmed") {
      notify("error", "Only confirmed bookings can be cancelled");
      return;
    }

    try {
      setUnbooking(booking.id);
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", booking.id);

      if (bookingError) throw bookingError;

      if (booking.seat_ids && booking.seat_ids.length > 0) {
        const { error: seatError } = await supabase
          .from("seats")
          .update({
            status: "available",
            locked_by: null,
            locked_until: null,
          })
          .in("id", booking.seat_ids);

        if (seatError) throw seatError;
      }

      notify("success", "Booking cancelled", "Seats have been released.");
      await fetchData();

      if (selectedBooking?.id === booking.id) {
        closeTicket();
      }

      setConfirmUnbookOpen(false);
      setBookingToUnbook(null);
    } catch (error: any) {
      console.error(error);
      notify("error", "Failed to cancel booking");
    } finally {
      setUnbooking(null);
    }
  };

  const confirmDeleteHistory = async () => {
    if (!historyItemToDelete) return;
    setIsDeletingHistory(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", historyItemToDelete);

      if (error) throw error;

      // Update local state to instantly reflect changes in stats
      setBookings((prev) => prev.filter((b) => b.id !== historyItemToDelete));
      notify("success", "Deleted from history");
    } catch (error: any) {
      console.error(error);
      notify("error", "Failed to delete");
    } finally {
      setIsDeletingHistory(false);
      setDeleteHistoryOpen(false);
      setHistoryItemToDelete(null);
    }
  };

  // --- DOWNLOAD PDF ---
  const downloadTicketPdf = async (booking: Booking) => {
    if (!profile) {
      notify("error", "Profile not loaded");
      return;
    }
    try {
      const blob = await pdf(
        <TicketPdf
          booking={booking}
          profile={profile}
          seatsByBus={seatsByBus}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Ticket-${booking.booking_id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify("success", "Ticket PDF downloaded");
    } catch (err) {
      console.error(err);
      notify("error", "Failed to generate PDF");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent flex items-center justify-center">
        <NotificationStack notifications={notifications} />
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <NotificationStack notifications={notifications} />

      {confirmUnbookOpen && (
        <UnbookConfirmDialog
          open={confirmUnbookOpen}
          booking={bookingToUnbook}
          loading={!!(bookingToUnbook && unbooking === bookingToUnbook.id)}
          onCancel={() => {
            if (!unbooking) {
              setConfirmUnbookOpen(false);
              setBookingToUnbook(null);
            }
          }}
          onConfirm={() => {
            if (bookingToUnbook && !unbooking) {
              handleUnbook(bookingToUnbook);
            }
          }}
        />
      )}

      {deleteHistoryOpen && (
        <DeleteHistoryDialog
          open={deleteHistoryOpen}
          loading={isDeletingHistory}
          onCancel={() => setDeleteHistoryOpen(false)}
          onConfirm={confirmDeleteHistory}
        />
      )}

      {ticketOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-xl w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-accent/80">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <TicketIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Ticket Details
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Booking ID: {selectedBooking.booking_id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => downloadTicketPdf(selectedBooking)}
                >
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
                {selectedBooking.status === "confirmed" && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    disabled={unbooking === selectedBooking.id}
                    onClick={() => openUnbookDialog(selectedBooking)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={closeTicket}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedBooking.status)}
                  <span className="text-[0.75rem] text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Booked on:&nbsp;
                    {new Date(
                      selectedBooking.booked_at
                    ).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  E-Ticket Confirmed
                </div>
              </div>

              <Card className="p-4 bg-accent/40 border-border">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Bus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground text-sm">
                        {selectedBooking.bus?.bus_number || "Bus"}
                      </span>
                      <span className="text-[0.75rem] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Departure: {selectedBooking.bus?.departure_time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Route: {selectedBooking.bus?.route}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid sm:grid-cols-2 gap-3">
                <Card className="p-3 bg-accent/40 border-border space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Passenger Details
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {profile?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.branch} • {profile?.year}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />
                    {profile?.phone}
                  </p>
                </Card>

                <Card className="p-3 bg-accent/40 border-border space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Fare Summary
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total Fare</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {selectedBooking.total_fare}
                    </span>
                  </div>
                  {selectedBooking.seat_ids && (
                    <p className="text-[0.7rem] text-muted-foreground">
                      For {selectedBooking.seat_ids.length} seat
                      {selectedBooking.seat_ids.length > 1 ? "s" : ""}
                    </p>
                  )}
                </Card>
              </div>

              {selectedBooking.seat_ids &&
                selectedBooking.seat_ids.length > 0 && (
                  <Card className="p-3 bg-accent/40 border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      Seats
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.seat_ids.map((seatId) => {
                        const seatsForBus =
                          seatsByBus[selectedBooking.bus_id] || [];
                        const seatInfo = seatsForBus.find(
                          (s) => s.id === seatId
                        );
                        return (
                          <Badge
                            key={seatId}
                            variant="default"
                            className="text-[0.7rem] px-2 py-1"
                          >
                            {seatInfo?.seat_number || seatId}
                          </Badge>
                        );
                      })}
                    </div>
                  </Card>
                )}
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION BAR - UPDATED WITH CANCELLED STATUS */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBackToBrowse}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Bus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-lg font-bold text-foreground block">
                  My Dashboard
                </span>
                <span className="text-xs text-muted-foreground">
                  Trip history & E-Tickets
                </span>
              </div>
            </div>
          </div>

          {/* HERE IS THE TOP RIGHT STATS AREA */}
          <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
            <span className="px-3 py-1 rounded-full bg-accent/60 border border-border">
              Total bookings: <strong>{bookings.length}</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-accent/60 border border-border">
              Current: <strong>{currentBookings.length}</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-accent/60 border border-border">
              History: <strong>{historyBookings.length}</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-accent/60 border border-border">
              Cancelled: <strong>{cancelledCount}</strong>
            </span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Welcome, {profile?.name || "Guest"}!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Overview of your bus bookings.
              </p>
            </div>
            
            {/* CARDS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs w-full md:w-auto">
              <div className="bg-accent/50 p-3 rounded-lg border border-border">
                <p className="text-muted-foreground">Total Bookings</p>
                <p className="font-semibold text-foreground text-lg">
                  {bookings.length}
                </p>
              </div>
              <div className="bg-accent/50 p-3 rounded-lg border border-border">
                <p className="text-muted-foreground">Current</p>
                <p className="font-semibold text-foreground text-lg">
                  {currentBookings.length}
                </p>
              </div>
              <div className="bg-accent/50 p-3 rounded-lg border border-border">
                <p className="text-muted-foreground">Cancelled</p>
                <p className="font-semibold text-destructive text-lg">
                  {cancelledCount}
                </p>
              </div>
              <div className="bg-accent/50 p-3 rounded-lg border border-border">
                <p className="text-muted-foreground flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  Total Spent
                </p>
                <p className="font-semibold text-foreground text-lg flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {totalSpent}
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4 text-sm mt-6">
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-semibold text-foreground">{profile?.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Branch</p>
              <p className="font-semibold text-foreground">{profile?.branch}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Year</p>
              <p className="font-semibold text-foreground">{profile?.year}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Booking</p>
              <p className="font-semibold text-foreground">
                {bookings[0]
                  ? new Date(bookings[0].booked_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="current" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="current">
              Current ({currentBookings.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              History ({historyBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            {currentBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <TicketIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Current Bookings
                </h3>
                <Button onClick={handleBackToBrowse}>Browse Buses</Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {currentBookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className="p-6 border-border bg-card/90"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-foreground">
                            {booking.bus.bus_number}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ID: <span className="font-mono">{booking.booking_id}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Route: {booking.bus.route}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Departure: {booking.bus.departure_time}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center justify-end gap-1 text-2xl font-bold text-primary">
                          <IndianRupee className="h-5 w-5" />
                          {booking.total_fare}
                        </div>
                        <div className="flex justify-end gap-2 flex-wrap md:flex-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1 gap-1"
                            onClick={() => downloadTicketPdf(booking)}
                          >
                            <Download className="h-4 w-4" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1"
                            onClick={() => handleViewTicket(booking)}
                          >
                            View Ticket
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1 border-destructive text-destructive hover:bg-destructive/10 gap-1"
                            disabled={unbooking === booking.id}
                            onClick={() => openUnbookDialog(booking)}
                          >
                            <Trash2 className="h-4 w-4" />
                            {unbooking === booking.id
                              ? "Cancelling..."
                              : "Unbook"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {historyBookings.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No booking history yet.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {historyBookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className="p-6 opacity-80 border-border bg-card/80"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {booking.bus.bus_number}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Booking ID:{" "}
                          <span className="font-mono">
                            {booking.booking_id}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Route: {booking.bus.route}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Booked on:{" "}
                          {new Date(
                            booking.booked_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center justify-end gap-1 text-xl font-semibold text-muted-foreground">
                          <IndianRupee className="h-4 w-4" />
                          {booking.total_fare}
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
                          onClick={() => openDeleteHistoryDialog(booking.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// --- DIALOGS ---
const UnbookConfirmDialog = ({
  open,
  booking,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  booking: Booking | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  if (!open || !booking) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <Card className="w-full max-w-sm rounded-2xl border-border bg-card shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <Ban className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Cancel booking?
              </p>
              <p className="text-xs text-muted-foreground">
                This will release your reserved seat(s).
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={!loading ? onCancel : undefined} disabled={loading}><X className="h-4 w-4" /></Button>
        </div>
        <div className="px-5 pt-4 pb-5 space-y-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Bus: <span className="font-medium text-foreground">{booking.bus?.bus_number}</span></div>
            <div>Booking ID: <span className="font-mono text-foreground">{booking.booking_id}</span></div>
          </div>
          <div className="flex gap-3 mt-3">
            <Button variant="outline" className="flex-1" onClick={!loading ? onCancel : undefined} disabled={loading}>Keep booking</Button>
            <Button variant="destructive" className="flex-1 flex items-center justify-center gap-2" onClick={!loading ? onConfirm : undefined} disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? "Cancelling..." : "Yes, unbook"}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const DeleteHistoryDialog = ({
  open,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <Card className="w-full max-w-sm rounded-2xl border-border bg-card shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div><p className="text-sm font-semibold text-foreground">Delete from History?</p></div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={!loading ? onCancel : undefined} disabled={loading}><X className="h-4 w-4" /></Button>
        </div>
        <div className="px-5 py-5 text-center">
          <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this record permanently? This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={!loading ? onCancel : undefined} disabled={loading}>Cancel</Button>
            <Button variant="destructive" className="flex-1 flex items-center justify-center gap-2" onClick={!loading ? onConfirm : undefined} disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? "Deleting..." : "Delete"}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const NotificationStack = ({ notifications }: { notifications: NotificationItem[] }) => (
  <div className="fixed top-4 right-4 z-[90] space-y-2 w-72">
    {notifications.map((item) => (
      <div key={item.id} className={cn("rounded-xl border px-4 py-3 shadow-lg backdrop-blur bg-card/95 flex flex-col gap-1", item.kind === "success" && "border-emerald-500/70", item.kind === "error" && "border-destructive/70", item.kind === "info" && "border-primary/60")}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          {item.kind === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {item.kind === "error" && <X className="h-4 w-4 text-destructive" />}
          {item.kind === "info" && <Info className="h-4 w-4 text-primary" />}
          <span>{item.title}</span>
        </div>
        {item.message && <p className="text-xs text-muted-foreground">{item.message}</p>}
      </div>
    ))}
  </div>
);

export default Dashboard;