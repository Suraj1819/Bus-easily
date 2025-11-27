import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Camera,
  Bus,
  Users,
  MapPin,
  Calendar,
  Heart,
  ExternalLink,
  ArrowLeft,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Menu,
  Home,
  Check,
  LogIn
} from "lucide-react";

// Import your images here
import busHero from "@/assets/bus-hero.jpg";
import busInterior from "@/assets/bus-interior.jpg";
import studentsBus from "@/assets/students-bus.jpg";

const galleryImages = [
  {
    id: 1,
    src: busHero,
    title: "Modern Fleet",
    description: "Our brand new buses with latest amenities",
    category: "Buses",
  },
  {
    id: 2,
    src: busInterior,
    title: "Comfortable Interiors",
    description: "AC seats with ample legroom",
    category: "Interior",
  },
  {
    id: 3,
    src: studentsBus,
    title: "Happy Students",
    description: "Students enjoying their daily commute",
    category: "Students",
  },
  {
    id: 4,
    src: busHero,
    title: "Campus Pickup",
    description: "Convenient pickup points across campus",
    category: "Routes",
  },
  {
    id: 5,
    src: busInterior,
    title: "Safety First",
    description: "Well-maintained and regularly serviced",
    category: "Safety",
  },
  {
    id: 6,
    src: studentsBus,
    title: "Group Travel",
    description: "Perfect for college events and trips",
    category: "Events",
  },
  {
    id: 7,
    src: busHero,
    title: "Evening Routes",
    description: "Safe evening commute for late classes",
    category: "Routes",
  },
  {
    id: 8,
    src: busInterior,
    title: "Premium Seating",
    description: "Ergonomic seats for comfortable journey",
    category: "Interior",
  },
  {
    id: 9,
    src: studentsBus,
    title: "Festival Special",
    description: "Special buses during festival seasons",
    category: "Events",
  },
];

const categories = ["All", "Buses", "Interior", "Students", "Routes", "Safety", "Events"];

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const filterScrollRef = useRef<HTMLDivElement>(null);

  // Filter images based on active category
  const filteredImages =
    activeCategory === "All"
      ? galleryImages
      : galleryImages.filter((img) => img.category === activeCategory);

  // Open lightbox
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    setIsZoomed(false);
    document.body.style.overflow = "hidden";
  };

  // Close lightbox
  const closeLightbox = () => {
    setLightboxOpen(false);
    setIsZoomed(false);
    document.body.style.overflow = "auto";
  };

  // Navigate to previous image
  const prevImage = () => {
    if (isZoomed) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? filteredImages.length - 1 : prev - 1
    );
  };

  // Navigate to next image
  const nextImage = () => {
    if (isZoomed) return;
    setCurrentImageIndex((prev) =>
      prev === filteredImages.length - 1 ? 0 : prev + 1
    );
  };

  // Toggle zoom
  const toggleZoom = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsZoomed(!isZoomed);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isZoomed) {
      setIsZoomed(false);
    } else {
      closeLightbox();
    }
  };

  // Download image function
  const downloadImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentImage = filteredImages[currentImageIndex];
    if (!currentImage) return;

    setDownloading(true);
    setDownloadSuccess(false);

    try {
      const response = await fetch(currentImage.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${currentImage.title.replace(/\s+/g, "-").toLowerCase()}-buseasily.jng`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(currentImage.src, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  // Download from grid
  const downloadFromGrid = async (e: React.MouseEvent, image: typeof galleryImages[0]) => {
    e.stopPropagation();

    try {
      const response = await fetch(image.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${image.title.replace(/\s+/g, "-").toLowerCase()}-buseasily.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(image.src, "_blank");
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") {
        if (isZoomed) {
          setIsZoomed(false);
        } else {
          closeLightbox();
        }
      }
      if (e.key === "ArrowLeft" && !isZoomed) prevImage();
      if (e.key === "ArrowRight" && !isZoomed) nextImage();
      if (e.key === "z" || e.key === "Z") toggleZoom();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, filteredImages.length, isZoomed]);

  // Touch handlers for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isZoomed) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (isZoomed) return;
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setMobileMenuOpen(false);
    };

    if (mobileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Blurred Background when zoomed */}
          {isZoomed && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="grid grid-cols-3 gap-2 p-4 opacity-20 blur-sm scale-110">
                {filteredImages.map((img) => (
                  <img
                    key={img.id}
                    src={img.src}
                    alt=""
                    className="w-full h-20 sm:h-24 object-cover rounded"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Top Bar */}
          <div
            className={`flex items-center justify-between p-2 sm:p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-[120] transition-all duration-300 ${
              isZoomed ? "opacity-0 pointer-events-none -translate-y-full" : "opacity-100"
            }`}
          >
            {/* Image Counter */}
            <div className="px-2 py-1 sm:px-4 sm:py-2 rounded-full bg-white/10 text-white text-xs sm:text-sm font-medium">
              {currentImageIndex + 1} / {filteredImages.length}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={toggleZoom}
                className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-white"
                title="Zoom (Z)"
              >
                <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              <button
                onClick={downloadImage}
                disabled={downloading}
                className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-white disabled:opacity-50"
                title="Download"
              >
                {downloading ? (
                  <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : downloadSuccess ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                ) : (
                  <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>

              <button
                onClick={closeLightbox}
                className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-white"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          {/* Zoom indicator */}
          {isZoomed && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[130] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/60 text-white text-xs sm:text-sm flex items-center gap-2">
              <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Tap to exit zoom</span>
            </div>
          )}

          {/* Main Image Container */}
          <div
            ref={imageContainerRef}
            className={`flex-1 flex items-center justify-center px-2 sm:px-4 py-14 sm:py-20 relative z-[110] transition-all duration-500 ${
              isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
            }`}
            onClick={handleBackdropClick}
          >
            <div
              className={`relative transition-all duration-500 ease-out max-w-full ${
                isZoomed ? "scale-125 sm:scale-150 md:scale-[2]" : "scale-100"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleZoom();
              }}
            >
              <img
                src={filteredImages[currentImageIndex]?.src}
                alt={filteredImages[currentImageIndex]?.title}
                className={`max-w-full object-contain rounded-lg transition-all duration-500 ${
                  isZoomed
                    ? "max-h-[70vh] sm:max-h-[80vh]"
                    : "max-h-[50vh] sm:max-h-[60vh] md:max-h-[70vh]"
                }`}
                draggable={false}
              />
            </div>
          </div>

          {/* Navigation Arrows - Desktop only */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className={`hidden md:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-[115] p-2 lg:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white ${
              isZoomed ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <ChevronLeft className="h-6 w-6 lg:h-8 lg:w-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className={`hidden md:flex absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-[115] p-2 lg:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white ${
              isZoomed ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <ChevronRight className="h-6 w-6 lg:h-8 lg:w-8" />
          </button>

          {/* Mobile Swipe Hint */}
          {!isZoomed && (
            <div className="md:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[105]">
              <div className="flex items-center gap-3 text-white/20 text-xs">
                <ChevronLeft className="h-5 w-5" />
                <span>Swipe</span>
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>
          )}

          {/* Image Info - Bottom */}
          <div
            className={`absolute bottom-14 sm:bottom-16 md:bottom-20 left-0 right-0 p-3 sm:p-4 md:p-6 bg-gradient-to-t from-black/80 to-transparent z-[115] transition-all duration-300 ${
              isZoomed ? "opacity-0 pointer-events-none translate-y-full" : "opacity-100"
            }`}
          >
            <div className="max-w-3xl mx-auto">
              <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 bg-primary text-primary-foreground text-[10px] sm:text-xs rounded-full mb-1 sm:mb-2">
                {filteredImages[currentImageIndex]?.category}
              </span>
              <h3 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1">
                {filteredImages[currentImageIndex]?.title}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-white/80 line-clamp-2">
                {filteredImages[currentImageIndex]?.description}
              </p>
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div
            className={`absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 md:p-3 bg-black/60 z-[115] transition-all duration-300 ${
              isZoomed ? "opacity-0 pointer-events-none translate-y-full" : "opacity-100"
            }`}
          >
            <div className="flex gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto pb-1 px-1 sm:px-2 scrollbar-hide justify-start sm:justify-center">
              {filteredImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`flex-shrink-0 w-10 h-8 sm:w-14 sm:h-10 md:w-16 md:h-12 rounded overflow-hidden transition-all ${
                    index === currentImageIndex
                      ? "ring-2 ring-primary scale-105 sm:scale-110"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image.src}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2">
              <img className="w-7 h-7 sm:w-10 sm:h-10" src="../../android-chrome-512x512.png" alt="" />
              <span className="text-base sm:text-xl font-bold text-foreground">Buseasily</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="default" size="default">
                  Login / Sign Up
                </Button>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="flex items-center gap-1.5 md:hidden">
              <Link to="/">
                <Button variant="ghost" size="sm" className="p-2">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
              <button
                className="p-2 rounded-lg hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute left-0 right-0 top-full bg-card border-b border-border shadow-lg animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col p-2">
                <Link
                  to="/"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                <Link
                  to="/auth"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Login / Sign Up</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent z-10"></div>
        <img
          src={busHero}
          alt="Gallery hero"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-20 container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center px-2.5 py-1 sm:px-4 sm:py-2 bg-primary/10 rounded-full text-primary font-semibold text-xs sm:text-sm mb-3 sm:mb-6">
              <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Photo Gallery
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-foreground mb-3 sm:mb-6 leading-tight">
              Explore Our <span className="text-primary">Journey</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-4 sm:mb-8 max-w-2xl">
              Take a visual tour of our fleet, facilities, and the happy faces of
              students who travel with us every day.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-4 sm:mt-8 max-w-md sm:max-w-xl">
              <div className="text-center sm:text-left">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">50+</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Photos</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">6</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">Daily</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Updates</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Mobile: Horizontal Scrollable Filter */}
        <div className="md:hidden">
          <div 
            ref={filterScrollRef}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "bg-accent hover:bg-accent/80 text-foreground"
                }`}
              >
                {category}
                {activeCategory === category && (
                  <span className="ml-1.5 bg-primary-foreground/20 px-1.5 py-0.5 rounded-full text-[10px]">
                    {category === "All"
                      ? galleryImages.length
                      : galleryImages.filter((img) => img.category === category).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Centered Filter */}
        <div className="hidden md:flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              className={`rounded-full whitespace-nowrap text-sm transition-all ${
                activeCategory === category ? "scale-105 shadow-lg" : ""
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
              {activeCategory === category && (
                <span className="ml-2 bg-primary-foreground/20 px-2 py-0.5 rounded-full text-xs">
                  {category === "All"
                    ? galleryImages.length
                    : galleryImages.filter((img) => img.category === category).length}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-center text-muted-foreground mt-3 sm:mt-4 text-xs sm:text-sm">
          Showing {filteredImages.length} {filteredImages.length === 1 ? "photo" : "photos"}
          {activeCategory !== "All" && ` in "${activeCategory}"`}
        </p>
      </section>

      {/* Gallery Grid */}
      <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 md:py-12">
        {filteredImages.length === 0 ? (
          <div className="text-center py-8 sm:py-12 md:py-16">
            <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2">
              No photos found
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              No images available in this category
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveCategory("All")}
              className="mt-4"
            >
              View All Photos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
            {filteredImages.map((image, index) => (
              <Card
                key={image.id}
                className="overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform hover:shadow-lg"
                onClick={() => openLightbox(index)}
              >
                <div className="relative aspect-[4/3] sm:h-48 md:h-64 lg:h-72 overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Action buttons */}
                  <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 md:top-4 md:right-4 flex gap-1 sm:gap-1.5 md:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => downloadFromGrid(e, image)}
                      className="bg-white/20 backdrop-blur-sm rounded-full p-1 sm:p-1.5 md:p-2 hover:bg-white/40 transition-colors"
                      title="Download"
                    >
                      <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-white" />
                    </button>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 sm:p-1.5 md:p-2">
                      <ZoomIn className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 md:p-4 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300">
                    <span className={`inline-block px-1.5 py-0.5 sm:px-2 sm:py-0.5 md:px-3 md:py-1 text-primary-foreground text-[8px] sm:text-[10px] md:text-xs rounded-full mb-0.5 sm:mb-1 md:mb-2 ${
                      image.category === "Buses" ? "bg-blue-500/80" :
                      image.category === "Interior" ? "bg-green-500/80" :
                      image.category === "Students" ? "bg-yellow-500/80" :
                      image.category === "Routes" ? "bg-purple-500/80" :
                      image.category === "Safety" ? "bg-red-500/80" :
                      image.category === "Events" ? "bg-pink-500/80" : "bg-gray-500/80"
                    }`}>
                      {image.category}
                    </span>
                    <h3 className="text-xs sm:text-sm md:text-xl font-bold text-white line-clamp-1">{image.title}</h3>
                    <p className="text-[10px] sm:text-xs md:text-sm text-white/80 line-clamp-1 hidden sm:block">{image.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Featured Section */}
      <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-4">
            Featured Moments
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground">
            Highlights from our daily operations
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <Card className="overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform" onClick={() => openLightbox(0)}>
            <div className="relative aspect-[16/10] sm:aspect-[16/9] md:h-72 lg:h-80 overflow-hidden">
              <img
                src={busHero}
                alt="Featured 1"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 flex gap-1.5 sm:gap-2">
                <button
                  onClick={(e) => downloadFromGrid(e, galleryImages[0])}
                  className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 sm:p-2 hover:bg-white/40 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                </button>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 sm:p-2">
                  <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 md:bottom-6 md:left-6 md:right-6">
                <div className="flex flex-wrap items-center gap-2 text-white/80 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                    January 2025
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                    Main Campus
                  </span>
                </div>
                <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-white">
                  New Fleet Inauguration
                </h3>
                <p className="text-white/80 mt-0.5 sm:mt-1 md:mt-2 text-[10px] sm:text-xs md:text-sm lg:text-base line-clamp-2">
                  Celebrating the addition of 10 new AC buses to our fleet
                </p>
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform" onClick={() => openLightbox(2)}>
            <div className="relative aspect-[16/10] sm:aspect-[16/9] md:h-72 lg:h-80 overflow-hidden">
              <img
                src={studentsBus}
                alt="Featured 2"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 flex gap-1.5 sm:gap-2">
                <button
                  onClick={(e) => downloadFromGrid(e, galleryImages[2])}
                  className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 sm:p-2 hover:bg-white/40 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                </button>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 sm:p-2">
                  <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 md:bottom-6 md:left-6 md:right-6">
                <div className="flex flex-wrap items-center gap-2 text-white/80 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                    500+ Students
                  </span>
                  <span className="flex items-center gap-1">
                    <Bus className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                    College Fest
                  </span>
                </div>
                <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-white">
                  Annual College Festival
                </h3>
                <p className="text-white/80 mt-0.5 sm:mt-1 md:mt-2 text-[10px] sm:text-xs md:text-sm lg:text-base line-clamp-2">
                  Special transport arrangements for the grand celebration
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16">
        <Card className="relative overflow-hidden border-border">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"></div>
          <div className="relative p-4 sm:p-8 md:p-12 lg:p-16 text-center">
            <h2 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-3 md:mb-4">
              Want to Be Part of Our Journey?
            </h2>
            <p className="text-xs sm:text-sm md:text-lg text-muted-foreground mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto">
              Book your seat today and create your own memorable moments
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 md:gap-4">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="default" className="w-full sm:w-auto text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 h-10 sm:h-12 md:h-14 font-semibold">
                  Book Your Seat
                </Button>
              </Link>
              <Link to="/browse" className="w-full sm:w-auto">
                <Button
                  size="default"
                  variant="outline"
                  className="w-full sm:w-auto text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 h-10 sm:h-12 md:h-14 font-semibold"
                >
                  View Buses
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
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
            <img className="h-8 w-8" src="../../android-chrome-512x512.png" alt="Buseasily" />
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

      {/* Add CSS for hiding scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Gallery;