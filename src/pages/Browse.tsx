import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bus,
  Clock,
  MapPin,
  IndianRupee,
  LogOut,
  Wifi,
  Wind,
  Armchair,
  Coffee,
  Search,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
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

const BIHAR_COLLEGES: string[] = [
  "Muzaffarpur Institute of Technology",
  "Gaya College of Engineering",
  "Bhagalpur College of Engineering",
  "Motihari College of Engineering",
  "Darbhanga College of Engineering",
  "Nalanda College of Engineering",
  "Loknayak Jai Prakash Institute of Technology",
  "Sitamarhi Institute of Technology",
  "Bakhtiyarpur College of Engineering",
  "Rashtrakavi Ramdhari Singh Dinkar College of Engineering",
  "Katihar Engineering College",
  "Shershah College of Engineering",
  "BP Mandal College of Engineering",
  "Saharsa College of Engineering",
  "Supaul College of Engineering",
  "Purnea College of Engineering",
  "Government Engineering College, Vaishali",
  "Government Engineering College, Banka",
  "Government Engineering College, Jamui",
  "Government Engineering College, Bhojpur",
  "Government Engineering College, Siwan",
  "Government Engineering College, Madhubani",
  "Government Engineering College, Arwal",
  "Government Engineering College, Aurangabad",
  "Government Engineering College, Jehanabad",
  "Government Engineering College, Khagaria",
  "Government Engineering College, Buxar",
  "Government Engineering College, Sheikhpura",
  "Government Engineering College, Lakhisarai",
  "Government Engineering College, Kishanganj",
  "Government Engineering College, Sheohar",
  "Government Engineering College, Kaimur",
  "Government Engineering College, Gopalganj",
  "Government Engineering College, Munger",
  "Government Engineering College, West Champaran",
  "Government Engineering College, Nawada",
  "Government Engineering College, Samastipur",
  "Shri Phanishwar Nath Renu Engineering College",
];

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

  const [locLoading, setLocLoading] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);
  const [busSuggestions, setBusSuggestions] = useState<string[]>([]);

  const [activeField, setActiveField] = useState<"from" | "to" | "bus" | null>(null);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);

  // Refs for containers and inputs
  const fromRef = useRef<HTMLDivElement | null>(null);
  const toRef = useRef<HTMLDivElement | null>(null);
  const busSearchRef = useRef<HTMLDivElement | null>(null);
  
  // Refs for input fields (for Tab navigation)
  const busInputRef = useRef<HTMLInputElement | null>(null);
  const fromInputRef = useRef<HTMLInputElement | null>(null);
  const toInputRef = useRef<HTMLInputElement | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);

  // Refs for suggestion list containers (for scroll into view)
  const busSuggestionsRef = useRef<HTMLDivElement | null>(null);
  const fromSuggestionsRef = useRef<HTMLDivElement | null>(null);
  const toSuggestionsRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchBuses();
  }, []);

  useEffect(() => {
    setFilteredBuses(buses);
  }, [buses]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedSuggestionIndex < 0) return;

    const getListRef = () => {
      if (activeField === "bus") return busSuggestionsRef.current;
      if (activeField === "from") return fromSuggestionsRef.current;
      if (activeField === "to") return toSuggestionsRef.current;
      return null;
    };

    const listRef = getListRef();
    if (listRef) {
      const items = listRef.querySelectorAll("[data-suggestion-item]");
      const focusedItem = items[focusedSuggestionIndex] as HTMLElement;
      if (focusedItem) {
        focusedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [focusedSuggestionIndex, activeField]);

  // Keyboard Navigation Handler
  const handleKeyDownForSuggestions = (
    event: React.KeyboardEvent<HTMLInputElement>,
    currentField: "from" | "to" | "bus"
  ) => {
    const suggestions =
      currentField === "from"
        ? fromSuggestions
        : currentField === "to"
        ? toSuggestions
        : busSuggestions;

    // Tab key - move to next field
    if (event.key === "Tab" && !event.shiftKey) {
      setActiveField(null);
      setFocusedSuggestionIndex(-1);
      
      if (currentField === "bus") {
        event.preventDefault();
        fromInputRef.current?.focus();
      } else if (currentField === "from") {
        event.preventDefault();
        toInputRef.current?.focus();
      } else if (currentField === "to") {
        event.preventDefault();
        searchButtonRef.current?.focus();
      }
      return;
    }

    // Shift+Tab - move to previous field
    if (event.key === "Tab" && event.shiftKey) {
      setActiveField(null);
      setFocusedSuggestionIndex(-1);
      return; // Let default behavior work
    }

    // If no suggestions, Enter triggers search
    if (suggestions.length === 0) {
      if (event.key === "Enter") {
        event.preventDefault();
        filterBuses();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        event.preventDefault();
        setFocusedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case "Enter":
        event.preventDefault();
        if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < suggestions.length) {
          // Select the highlighted suggestion
          const selectedValue = suggestions[focusedSuggestionIndex];
          if (currentField === "from") {
            handleSelectSuggestion(selectedValue, "from");
            // Move focus to next field after selection
            setTimeout(() => toInputRef.current?.focus(), 50);
          } else if (currentField === "to") {
            handleSelectSuggestion(selectedValue, "to");
            // Move focus to search button after selection
            setTimeout(() => searchButtonRef.current?.focus(), 50);
          } else if (currentField === "bus") {
            handleSelectBusSuggestion(selectedValue);
            // Move focus to from field after selection
            setTimeout(() => fromInputRef.current?.focus(), 50);
          }
        } else {
          // No item highlighted - trigger search
          filterBuses();
        }
        break;

      case "Escape":
        event.preventDefault();
        setActiveField(null);
        setFocusedSuggestionIndex(-1);
        // Clear suggestions
        if (currentField === "from") setFromSuggestions([]);
        else if (currentField === "to") setToSuggestions([]);
        else setBusSuggestions([]);
        break;
    }
  };

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const isClickInsideFrom = fromRef.current?.contains(target);
      const isClickInsideTo = toRef.current?.contains(target);
      const isClickInsideBus = busSearchRef.current?.contains(target);

      if (!isClickInsideFrom && !isClickInsideTo && !isClickInsideBus) {
        setActiveField(null);
        setFromSuggestions([]);
        setToSuggestions([]);
        setBusSuggestions([]);
        setFocusedSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
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
    setFocusedSuggestionIndex(-1);
    setActiveField(null);
    setFromSuggestions([]);
    setToSuggestions([]);
    setBusSuggestions([]);

    let filtered = [...buses];

    if (branchFilter !== "all") {
      filtered = filtered.filter((bus) => bus.branch === branchFilter);
    }

    if (yearFilter !== "all") {
      filtered = filtered.filter((bus) => bus.year === yearFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((bus) => bus.bus_type === typeFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (bus) =>
          bus.bus_number.toLowerCase().includes(q) ||
          bus.route.toLowerCase().includes(q)
      );
    }

    if (fromFilter) {
      const q = fromFilter.toLowerCase();
      filtered = filtered.filter(
        (bus) =>
          bus.from_location?.toLowerCase().includes(q) ||
          bus.route.toLowerCase().includes(q)
      );
    }

    if (toFilter) {
      const q = toFilter.toLowerCase();
      filtered = filtered.filter(
        (bus) =>
          bus.to_location?.toLowerCase().includes(q) ||
          bus.route.toLowerCase().includes(q)
      );
    }

    if (sortBy === "fare-low") {
      filtered.sort((a, b) => Number(a.fare) - Number(b.fare));
    } else if (sortBy === "fare-high") {
      filtered.sort((a, b) => Number(b.fare) - Number(a.fare));
    } else if (sortBy === "seats") {
      filtered.sort(
        (a, b) => (b.available_seats || 0) - (a.available_seats || 0)
      );
    } else {
      filtered.sort(
        (a, b) =>
          new Date(`1970-01-01T${a.departure_time}`).getTime() -
          new Date(`1970-01-01T${b.departure_time}`).getTime()
      );
    }

    setFilteredBuses(filtered);
    toast.success(`${filtered.length} buses found`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getBusAmenities = (busType: string) => {
    const amenities = [
      { icon: Armchair, label: "Comfortable Seats" },
      { icon: Coffee, label: "Refreshments" },
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
        to: parts[1].trim(),
      };
    }
    return {
      from: route,
      to: "",
    };
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBusSuggestions = (query: string): string[] => {
    const q = query.trim().toLowerCase();
    const set = new Set<string>();

    if (!q) {
      buses.slice(0, 8).forEach((bus) => set.add(bus.bus_number));
      return Array.from(set);
    }

    buses.forEach((bus) => {
      if (bus.bus_number.toLowerCase().includes(q)) {
        set.add(bus.bus_number);
      }
      if (bus.route.toLowerCase().includes(q)) {
        set.add(bus.route);
      }
    });

    return Array.from(set).slice(0, 8);
  };

  const fetchSuggestions = async (
    query: string,
    field: "from" | "to",
    signal?: AbortSignal
  ) => {
    const q = query.trim().toLowerCase();

    let collegeMatches: string[];
    if (!q || q === "bihar") {
      collegeMatches = BIHAR_COLLEGES;
    } else {
      collegeMatches = BIHAR_COLLEGES.filter((name) =>
        name.toLowerCase().includes(q)
      );
    }

    let osmSuggestions: string[] = [];
    if (q) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&countrycodes=in&q=${encodeURIComponent(
          query + " Bihar"
        )}`;

        const res = await fetch(url, {
          signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (res.ok) {
          const data = (await res.json()) as any[];
          osmSuggestions = Array.from(
            new Set(
              data
                .filter((item) => {
                  const addr = item.address || {};
                  const state =
                    addr.state || addr.state_district || addr.county || "";
                  return state.toLowerCase().includes("bihar");
                })
                .map((item) => {
                  const addr = item.address || {};
                  const city =
                    addr.city ||
                    addr.town ||
                    addr.village ||
                    addr.hamlet ||
                    addr.suburb ||
                    item.display_name;
                  const state = addr.state || "Bihar";
                  return `${city}, ${state}`;
                })
                .filter(Boolean)
            )
          );
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      }
    }

    const merged = Array.from(new Set([...collegeMatches, ...osmSuggestions]));

    if (field === "from") {
      setFromSuggestions(merged);
    } else {
      setToSuggestions(merged);
    }
  };

  const reverseGeocodeWithBigDataCloud = async (
    lat: number,
    lon: number
  ): Promise<string | null> => {
    try {
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const res = await fetch(url);

      if (!res.ok) throw new Error("Reverse geocoding failed");

      const data = await res.json();
      const { city, locality, principalSubdivision, countryName } = data as any;

      const parts = [city || locality, principalSubdivision, countryName].filter(
        Boolean
      );

      return parts.join(", ") || null;
    } catch (err) {
      console.error(err);
      toast.error("Unable to detect your location");
      return null;
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const placeName = await reverseGeocodeWithBigDataCloud(
          latitude,
          longitude
        );

        if (placeName) {
          setFromFilter(placeName);
          setFromSuggestions([]);
          setActiveField(null);
          toast.success(`Location set to "${placeName}"`);
        }

        setLocLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error("Unable to access your location");
        setLocLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleSelectSuggestion = (value: string, field: "from" | "to") => {
    if (field === "from") {
      setFromFilter(value);
      setFromSuggestions([]);
    } else {
      setToFilter(value);
      setToSuggestions([]);
    }
    setActiveField(null);
    setFocusedSuggestionIndex(-1);
  };

  const handleSelectBusSuggestion = (value: string) => {
    setSearchQuery(value);
    setBusSuggestions([]);
    setActiveField(null);
    setFocusedSuggestionIndex(-1);
  };

  // Suggestion Item Component for better styling
  const SuggestionItem = ({
    text,
    isActive,
    onClick,
    onMouseEnter,
  }: {
    text: string;
    isActive: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
  }) => (
    <button
      type="button"
      data-suggestion-item
      className={`
        w-full text-left px-4 py-3 text-sm transition-all duration-150
        flex items-center gap-3 border-b border-border/50 last:border-b-0
        ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent/80 text-foreground"
        }
      `}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <MapPin className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
      <span className="truncate">{text}</span>
      {isActive && (
        <span className="ml-auto text-xs opacity-75">↵ Enter</span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      {/* Header */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 rounded-full flex items-center justify-center">
              <img
                src="/android-chrome-192x192.png"
                alt="Bus logo"
                className="h-7 w-7 md:h-9 md:w-9 lg:h-10 lg:w-10 object-contain"
              />
            </div>
            <span className="text-lg md:text-xl lg:text-2xl font-bold text-foreground">
              Buseasily
            </span>
          </div>

          <div className="flex gap-2 md:gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
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
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1 md:mb-2">
            Browse Available Buses
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Find and book your perfect ride • Use <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">↑</kbd> <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">↓</kbd> to navigate, <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Enter</kbd> to select
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="p-4 md:p-6 mb-6 md:mb-8 border-border shadow-lg">
          <div className="space-y-4">
            {/* Top row: Search + Origin + Destination */}
            <div className="grid gap-3 md:gap-4 md:grid-cols-[2fr,3fr,3fr] items-end">
              {/* Search Bar */}
              <div ref={busSearchRef} className="relative">
                <label className="text-xs md:text-sm text-muted-foreground mb-1 block font-medium">
                  Search Bus
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={busInputRef}
                    placeholder="Bus number or route..."
                    value={searchQuery}
                    onFocus={() => {
                      setActiveField("bus");
                      setBusSuggestions(getBusSuggestions(searchQuery));
                      setFocusedSuggestionIndex(-1);
                    }}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      setBusSuggestions(getBusSuggestions(value));
                      setFocusedSuggestionIndex(-1);
                    }}
                    onKeyDown={(e) => handleKeyDownForSuggestions(e, "bus")}
                    className="pl-10 pr-8 rounded-full h-11"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setBusSuggestions([]);
                        setActiveField(null);
                        setFocusedSuggestionIndex(-1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {busSuggestions.length > 0 && activeField === "bus" && (
                  <div
                    ref={busSuggestionsRef}
                    className="absolute z-40 mt-2 w-full rounded-xl border bg-card shadow-xl max-h-72 overflow-auto"
                  >
                    <div className="py-1">
                      {busSuggestions.map((s, idx) => (
                        <SuggestionItem
                          key={idx}
                          text={s}
                          isActive={idx === focusedSuggestionIndex}
                          onClick={() => handleSelectBusSuggestion(s)}
                          onMouseEnter={() => setFocusedSuggestionIndex(idx)}
                        />
                      ))}
                    </div>
                    <div className="px-3 py-2 bg-muted/50 text-xs text-muted-foreground border-t">
                      <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">↑↓</kbd> Navigate • <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">Enter</kbd> Select • <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">Esc</kbd> Close
                    </div>
                  </div>
                )}
              </div>

              {/* FROM */}
              <div>
                <label className="text-xs md:text-sm text-muted-foreground mb-1 block font-medium">
                  Origin
                </label>
                <div ref={fromRef} className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        ref={fromInputRef}
                        placeholder="From (city / area / college)"
                        value={fromFilter}
                        onFocus={() => {
                          setActiveField("from");
                          fetchSuggestions(fromFilter || "Bihar", "from");
                          setFocusedSuggestionIndex(-1);
                        }}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFromFilter(value);
                          setActiveField("from");
                          fetchSuggestions(value || "Bihar", "from");
                          setFocusedSuggestionIndex(-1);
                        }}
                        onKeyDown={(e) => handleKeyDownForSuggestions(e, "from")}
                        className="rounded-full pr-8 h-11"
                      />
                      {fromFilter && (
                        <button
                          type="button"
                          onClick={() => {
                            setFromFilter("");
                            setFromSuggestions([]);
                            setActiveField(null);
                            setFocusedSuggestionIndex(-1);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleUseCurrentLocation}
                      disabled={locLoading}
                      className="shrink-0 rounded-full h-11 w-11"
                      title="Use my current location"
                    >
                      {locLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {fromSuggestions.length > 0 && activeField === "from" && (
                    <div
                      ref={fromSuggestionsRef}
                      className="absolute z-40 mt-2 w-full rounded-xl border bg-card shadow-xl max-h-72 overflow-auto"
                    >
                      <div className="py-1">
                        {fromSuggestions.map((s, idx) => (
                          <SuggestionItem
                            key={idx}
                            text={s}
                            isActive={idx === focusedSuggestionIndex}
                            onClick={() => handleSelectSuggestion(s, "from")}
                            onMouseEnter={() => setFocusedSuggestionIndex(idx)}
                          />
                        ))}
                      </div>
                      <div className="px-3 py-2 bg-muted/50 text-xs text-muted-foreground border-t">
                        <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">↑↓</kbd> Navigate • <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">Enter</kbd> Select • <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">Esc</kbd> Close
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* TO */}
              <div>
                <label className="text-xs md:text-sm text-muted-foreground mb-1 block font-medium">
                  Destination
                </label>
                <div ref={toRef} className="relative">
                  <div className="relative">
                    <Input
                      ref={toInputRef}
                      placeholder="To (city / area / college)"
                      value={toFilter}
                      onFocus={() => {
                        setActiveField("to");
                        fetchSuggestions(toFilter || "Bihar", "to");
                        setFocusedSuggestionIndex(-1);
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        setToFilter(value);
                        setActiveField("to");
                        fetchSuggestions(value || "Bihar", "to");
                        setFocusedSuggestionIndex(-1);
                      }}
                      onKeyDown={(e) => handleKeyDownForSuggestions(e, "to")}
                      className="rounded-full pr-8 h-11"
                    />
                    {toFilter && (
                      <button
                        type="button"
                        onClick={() => {
                          setToFilter("");
                          setToSuggestions([]);
                          setActiveField(null);
                          setFocusedSuggestionIndex(-1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {toSuggestions.length > 0 && activeField === "to" && (
                    <div
                      ref={toSuggestionsRef}
                      className="absolute z-40 mt-2 w-full rounded-xl border bg-card shadow-xl max-h-72 overflow-auto"
                    >
                      <div className="py-1">
                        {toSuggestions.map((s, idx) => (
                          <SuggestionItem
                            key={idx}
                            text={s}
                            isActive={idx === focusedSuggestionIndex}
                            onClick={() => handleSelectSuggestion(s, "to")}
                            onMouseEnter={() => setFocusedSuggestionIndex(idx)}
                          />
                        ))}
                      </div>
                      <div className="px-3 py-2 bg-muted/50 text-xs text-muted-foreground border-t">
                        <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">↑↓</kbd> Navigate • <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">Enter</kbd> Select • <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">Esc</kbd> Close
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 pt-2">
              <div>
                <label className="text-xs md:text-sm text-muted-foreground mb-1 block font-medium">
                  Branch
                </label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All Branches" />
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
                <label className="text-xs md:text-sm text-muted-foreground mb-1 block font-medium">
                  Year
                </label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="All Years" />
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
                <label className="text-xs md:text-sm text-muted-foreground mb-1 block font-medium">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Departure" />
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

            {/* Search button */}
            <div className="flex justify-end pt-2">
              <Button
                ref={searchButtonRef}
                type="button"
                onClick={filterBuses}
                className="gap-2 h-11 px-6"
                variant="default"
              >
                <Search className="h-4 w-4" />
                Search Buses
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-2">
          <p className="text-sm md:text-base text-muted-foreground">
            <span className="font-semibold text-foreground">
              {filteredBuses.length}
            </span>{" "}
            buses found
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
              setFromSuggestions([]);
              setToSuggestions([]);
              setBusSuggestions([]);
              setActiveField(null);
              setFilteredBuses(buses);
              setFocusedSuggestionIndex(-1);
            }}
          >
            Clear Filters
          </Button>
        </div>

        {/* Bus List */}
        {loading ? (
          <div className="text-center py-8 md:py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading buses...</p>
          </div>
        ) : filteredBuses.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <Bus className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-3 md:mb-4" />
            <p className="text-muted-foreground text-base md:text-lg">
              No buses found matching your filters
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {filteredBuses.map((bus) => {
              const { from, to } = parseRoute(bus.route);

              return (
                <Card
                  key={bus.id}
                  className="p-4 md:p-6 hover:shadow-lg transition-all border-border hover:border-primary/50"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4 md:gap-6">
                    {/* Bus Info */}
                    <div className="space-y-3 md:space-y-4 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bus className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg md:text-2xl font-bold text-foreground">
                            {bus.bus_number}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge
                              variant={
                                bus.bus_type === "AC" ? "default" : "outline"
                              }
                              className="text-xs"
                            >
                              {bus.bus_type}
                            </Badge>
                            <span className="text-xs md:text-sm text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs md:text-sm text-muted-foreground">
                              {bus.branch} - {bus.year} Year
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Route Details */}
                      <div className="bg-accent/50 p-3 md:p-4 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium text-foreground">
                              Route
                            </span>
                          </div>
                          <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatTime(bus.departure_time)} -{" "}
                              {formatTime(bus.arrival_time)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4 mt-2 md:mt-3">
                          <div>
                            <span className="font-semibold text-primary">
                              {from}
                            </span>
                            <span className="mx-2 text-muted-foreground">→</span>
                            <span className="font-semibold text-primary">
                              {to}
                            </span>
                          </div>
                          <span className="text-xs md:text-sm text-muted-foreground font-medium">
                            {bus.available_seats} seats available
                          </span>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-2 md:gap-3">
                        {getBusAmenities(bus.bus_type).map((amenity, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 md:gap-2 text-xs text-muted-foreground bg-accent px-2 md:px-3 py-1 md:py-1.5 rounded-full"
                          >
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
                        <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                          per seat
                        </p>
                        <div
                          className={`text-xs md:text-sm font-semibold ${
                            bus.available_seats && bus.available_seats > 10
                              ? "text-green-600"
                              : bus.available_seats && bus.available_seats > 0
                              ? "text-orange-600"
                              : "text-destructive"
                          }`}
                        >
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