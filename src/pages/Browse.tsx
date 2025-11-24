import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bus, Clock, MapPin, IndianRupee, LogOut, Wifi, Wind, Armchair, Coffee, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface BusData {
  id: string;
  bus_number: string;
  route: string;
  branch: string;
  year: string;
  bus_type: string;
  departure_time: string;
  arrival_time: string;
  total_seats: number;
  fare: number;
  available_seats?: number;
  from_location?: string;
  to_location?: string;
}

const Browse = () => {
  const [buses, setBuses] = useState<BusData[]>([]);
  const [filteredBuses, setFilteredBuses] = useState<BusData[]>([]);
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("departure");
  const [loading, setLoading] = useState(true);
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchBuses();
  }, []);

  useEffect(() => {
    filterBuses();
  }, [branchFilter, yearFilter, typeFilter, buses, searchQuery, sortBy, fromFilter, toFilter]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("buses")
        .select("*")
        .eq("is_active", true)
        .order("departure_time");

      if (error) throw error;

      const busesWithSeats = await Promise.all(
        (data || []).map(async (bus) => {
          const { count } = await supabase
            .from("seats")
            .select("*", { count: "exact", head: true })
            .eq("bus_id", bus.id)
            .eq("status", "available");
          
          return { ...bus, available_seats: count || 0 };
        })
      );

      setBuses(busesWithSeats);
      setFilteredBuses(busesWithSeats);
    } catch (error: any) {
      toast.error("Failed to load buses");
    } finally {
      setLoading(false);
    }
  };

  const filterBuses = () => {
    let filtered = [...buses];
    
    if (branchFilter !== "all") {
      filtered = filtered.filter(bus => bus.branch === branchFilter);
    }
    
    if (yearFilter !== "all") {
      filtered = filtered.filter(bus => bus.year === yearFilter);
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(bus => bus.bus_type === typeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(bus => 
        bus.bus_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bus.route.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (fromFilter) {
      filtered = filtered.filter(bus => 
        bus.from_location?.toLowerCase().includes(fromFilter.toLowerCase()) ||
        bus.route.toLowerCase().includes(fromFilter.toLowerCase())
      );
    }

    if (toFilter) {
      filtered = filtered.filter(bus => 
        bus.to_location?.toLowerCase().includes(toFilter.toLowerCase()) ||
        bus.route.toLowerCase().includes(toFilter.toLowerCase())
      );
    }

    // Sort
    if (sortBy === "fare-low") {
      filtered.sort((a, b) => Number(a.fare) - Number(b.fare));
    } else if (sortBy === "fare-high") {
      filtered.sort((a, b) => Number(b.fare) - Number(a.fare));
    } else if (sortBy === "seats") {
      filtered.sort((a, b) => (b.available_seats || 0) - (a.available_seats || 0));
    }
    
    setFilteredBuses(filtered);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getBusAmenities = (busType: string) => {
    const amenities = [
      { icon: Armchair, label: "Comfortable Seats" },
      { icon: Coffee, label: "Refreshments" }
    ];
    
    if (busType === "AC") {
      amenities.unshift(
        { icon: Wind, label: "Air Conditioned" },
        { icon: Wifi, label: "WiFi Available" }
      );
    }
    
    return amenities;
  };

  const parseRoute = (route: string) => {
    const parts = route.split(/[-→]/);
    if (parts.length >= 2) {
      return {
        from: parts[0].trim(),
        to: parts[1].trim()
      };
    }
    return {
      from: route,
      to: ""
    };
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      {/* Header */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary flex items-center justify-center">
              <Bus className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
            </div>
            <span className="text-lg md:text-xl font-bold text-foreground">College Bus Booking</span>
          </div>
          <div className="flex gap-2 md:gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              My Bookings
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1 md:mb-2">Browse Available Buses</h1>
          <p className="text-sm md:text-base text-muted-foreground">Find and book your perfect ride</p>
        </div>

        {/* Search & Filters */}
        <Card className="p-4 md:p-6 mb-6 md:mb-8 border-border">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by bus number or route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* From/To Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2 block font-medium">From</label>
                <Input
                  placeholder="Origin location"
                  value={fromFilter}
                  onChange={(e) => setFromFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2 block font-medium">To</label>
                <Input
                  placeholder="Destination location"
                  value={toFilter}
                  onChange={(e) => setToFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <div>
                <label className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2 block font-medium">Branch</label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    <SelectItem value="CSE">CSE</SelectItem>
                    <SelectItem value="ECE">ECE</SelectItem>
                    <SelectItem value="EEE">EEE</SelectItem>
                    <SelectItem value="MECH">MECH</SelectItem>
                    <SelectItem value="CIVIL">CIVIL</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="CHEMICAL">CHEMICAL</SelectItem>
                    <SelectItem value="BIOTECH">BIOTECH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2 block font-medium">Year</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="1st">1st</SelectItem>
                    <SelectItem value="2nd">2nd</SelectItem>
                    <SelectItem value="3rd">3rd</SelectItem>
                    <SelectItem value="4th">4th</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2 block font-medium">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="departure">Departure</SelectItem>
                    <SelectItem value="fare-low">Price: Low → High</SelectItem>
                    <SelectItem value="fare-high">Price: High → Low</SelectItem>
                    <SelectItem value="seats">Available Seats</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        {/* Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-2">
          <p className="text-sm md:text-base text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredBuses.length}</span> buses found
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setBranchFilter("all");
              setYearFilter("all");
              setTypeFilter("all");
              setSearchQuery("");
              setFromFilter("");
              setToFilter("");
            }}
          >
            Clear Filters
          </Button>
        </div>

        {/* Bus List */}
        {loading ? (
          <div className="text-center py-8 md:py-12">
            <p className="text-muted-foreground">Loading buses...</p>
          </div>
        ) : filteredBuses.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <Bus className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-3 md:mb-4" />
            <p className="text-muted-foreground text-base md:text-lg">No buses found matching your filters</p>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {filteredBuses.map((bus) => {
              const { from, to } = parseRoute(bus.route);
              
              return (
                <Card key={bus.id} className="p-4 md:p-6 hover:shadow-lg transition-all border-border hover:border-primary/50">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4 md:gap-6">
                    {/* Bus Info */}
                    <div className="space-y-3 md:space-y-4 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bus className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg md:text-2xl font-bold text-foreground">{bus.bus_number}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant={bus.bus_type === "AC" ? "default" : "outline"} className="text-xs">
                              {bus.bus_type}
                            </Badge>
                            <span className="text-xs md:text-sm text-muted-foreground">•</span>
                            <span className="text-xs md:text-sm text-muted-foreground">{bus.branch} - {bus.year} Year</span>
                          </div>
                        </div>
                      </div>

                      {/* Route Details */}
                      <div className="bg-accent/50 p-3 md:p-4 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium text-foreground">Route</span>
                          </div>
                          <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(bus.departure_time)} - {formatTime(bus.arrival_time)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4 mt-2 md:mt-3">
                          <div>
                            <span className="font-semibold text-primary">{from}</span>
                            <span className="mx-2 text-muted-foreground">→</span>
                            <span className="font-semibold text-primary">{to}</span>
                          </div>
                          <span className="text-xs md:text-sm text-muted-foreground font-medium">
                            {bus.available_seats} seats available
                          </span>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-2 md:gap-3">
                        {getBusAmenities(bus.bus_type).map((amenity, idx) => (
                          <div key={idx} className="flex items-center gap-1 md:gap-2 text-xs text-muted-foreground bg-accent px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                            <amenity.icon className="h-3 w-3 md:h-3 md:w-3" />
                            <span>{amenity.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Section */}
                    <div className="flex flex-col items-center gap-3 md:gap-4 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4 lg:pl-6 w-full lg:w-auto">
                      <div className="text-center lg:text-right w-full">
                        <div className="flex items-center justify-center lg:justify-end gap-1 text-xl md:text-3xl font-bold text-foreground mb-1 md:mb-3">
                          <IndianRupee className="h-5 w-5 md:h-6 md:w-6" />
                          {bus.fare}
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">per seat</p>
                        <div className={`text-xs md:text-sm font-semibold ${bus.available_seats && bus.available_seats > 10 ? 'text-green-600' : bus.available_seats && bus.available_seats > 0 ? 'text-orange-600' : 'text-destructive'}`}>
                          {bus.available_seats} / {bus.total_seats} seats
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate(`/seat-selection/${bus.id}`)}
                        disabled={bus.available_seats === 0}
                        size="lg"
                        className="w-full lg:w-auto px-6 py-3 rounded-lg text-base font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                      >
                        {bus.available_seats === 0 ? (
                          <div className="flex items-center justify-center gap-2">
                            <span>Fully Booked</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span>View Seats</span>
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;