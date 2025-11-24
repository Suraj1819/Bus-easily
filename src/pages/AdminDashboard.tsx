import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, LogOut, Users, Bus as BusIcon, Ticket, IndianRupee, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  totalBuses: number;
  todayBookings: number;
  todayRevenue: number;
}

interface BookingDetail {
  id: string;
  booking_id: string;
  user_id: string;
  bus_id: string;
  total_fare: number;
  status: string;
  booked_at: string;
  profile: {
    name: string;
    branch: string;
    year: string;
    phone: string;
  };
  bus: {
    bus_number: string;
    route: string;
    bus_type: string;
  };
  seat_ids: string[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalBuses: 0,
    todayBookings: 0,
    todayRevenue: 0,
  });
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAuth();
    fetchDashboardData();

    const channel = supabase
      .channel('admin-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAdminAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin");
      return;
    }

    // --- FIX: Check specifically for your email to bypass DB role check ---
    if (session.user.email === "surajkumarraj8888@gmail.com") {
      // Agar ye main admin hai, to role check skip karein
      // Optionally default name set kar sakte hain agar profile na ho
      if (!adminName) setAdminName("Main Admin");
    } else {
      // Baaki sabke liye database check karein
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();
      
      if (!roles) {
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }
    }
    // -------------------------------------------------------------------

    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("user_id", session.user.id)
      .single();
    
    if (profile) {
      setAdminName(profile.name);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: bookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true });

      const { data: revenueData } = await supabase
        .from("bookings")
        .select("total_fare")
        .eq("status", "confirmed");

      const totalRevenue = revenueData?.reduce((sum, b) => sum + Number(b.total_fare), 0) || 0;

      const { count: busesCount } = await supabase
        .from("buses")
        .select("*", { count: "exact", head: true });

      const today = new Date().toISOString().split('T')[0];
      const { count: todayBookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("booked_at", today);

      const { data: todayRevenueData } = await supabase
        .from("bookings")
        .select("total_fare")
        .eq("status", "confirmed")
        .gte("booked_at", today);

      const todayRevenue = todayRevenueData?.reduce((sum, b) => sum + Number(b.total_fare), 0) || 0;

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          *,
          profile:profiles!bookings_user_id_fkey(name, branch, year, phone),
          bus:buses(bus_number, route, bus_type)
        `)
        .order("booked_at", { ascending: false })
        .limit(50);

      setStats({
        totalUsers: usersCount || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue,
        totalBuses: busesCount || 0,
        todayBookings: todayBookingsCount || 0,
        todayRevenue,
      });

      setBookings(bookingsData as any || []);
    } catch (error: any) {
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const branchData = bookings.reduce((acc: any, booking) => {
    const branch = booking.profile?.branch || "Unknown";
    const existing = acc.find((item: any) => item.name === branch);
    if (existing) {
      existing.value += 1;
      existing.revenue += Number(booking.total_fare);
    } else {
      acc.push({ name: branch, value: 1, revenue: Number(booking.total_fare) });
    }
    return acc;
  }, []);

  const busTypeData = bookings.reduce((acc: any, booking) => {
    const type = booking.bus?.bus_type || "Unknown";
    const existing = acc.find((item: any) => item.name === type);
    if (existing) {
      existing.bookings += 1;
      existing.revenue += Number(booking.total_fare);
    } else {
      acc.push({ name: type, bookings: 1, revenue: Number(booking.total_fare) });
    }
    return acc;
  }, []);

  const dailyBookings = bookings.reduce((acc: any, booking) => {
    const date = new Date(booking.booked_at).toLocaleDateString();
    const existing = acc.find((item: any) => item.date === date);
    if (existing) {
      existing.bookings += 1;
      existing.revenue += Number(booking.total_fare);
    } else {
      acc.push({ date, bookings: 1, revenue: Number(booking.total_fare) });
    }
    return acc;
  }, []).reverse();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome, {adminName}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Buses</CardTitle>
              <BusIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBuses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
              <Ticket className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today Bookings</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.todayRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="bookings">All Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bookings by Branch</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={branchData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {branchData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Bus Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={busTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (₹)" />
                      <Bar dataKey="bookings" fill="hsl(var(--secondary))" name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Daily Bookings & Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyBookings.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" name="Bookings" />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--secondary))" name="Revenue (₹)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No bookings yet</p>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking.id} className="border border-border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{booking.profile?.name}</p>
                            <p className="text-sm text-muted-foreground">{booking.booking_id}</p>
                          </div>
                          <Badge variant={booking.status === 'confirmed' ? 'default' : 'outline'}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Bus</p>
                            <p className="font-medium">{booking.bus?.bus_number}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Branch/Year</p>
                            <p className="font-medium">{booking.profile?.branch} - {booking.profile?.year}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Seats</p>
                            <p className="font-medium">{booking.seat_ids?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fare</p>
                            <p className="font-medium text-primary">₹{Number(booking.total_fare).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Booked: {new Date(booking.booked_at).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;