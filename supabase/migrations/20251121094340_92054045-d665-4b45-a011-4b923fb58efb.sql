-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create enum for branch
CREATE TYPE public.branch AS ENUM ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'CHEMICAL', 'BIOTECH');

-- Create enum for year
CREATE TYPE public.year AS ENUM ('1st', '2nd', '3rd', '4th');

-- Create enum for bus type
CREATE TYPE public.bus_type AS ENUM ('AC', 'Non-AC');

-- Create enum for seat status
CREATE TYPE public.seat_status AS ENUM ('available', 'locked', 'booked');

-- Create enum for booking status
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  branch public.branch NOT NULL,
  year public.year NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create buses table
CREATE TABLE public.buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number TEXT NOT NULL UNIQUE,
  route TEXT NOT NULL,
  branch public.branch NOT NULL,
  year public.year NOT NULL,
  bus_type public.bus_type NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  total_seats INTEGER NOT NULL,
  fare DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create seats table
CREATE TABLE public.seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  seat_number TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  column_number INTEGER NOT NULL,
  status public.seat_status DEFAULT 'available' NOT NULL,
  locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(bus_id, seat_number)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  seat_ids UUID[] NOT NULL,
  total_fare DECIMAL(10,2) NOT NULL,
  status public.booking_status DEFAULT 'pending' NOT NULL,
  payment_id TEXT,
  payment_status TEXT,
  booked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for buses
CREATE POLICY "Anyone can view active buses"
  ON public.buses FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage buses"
  ON public.buses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for seats
CREATE POLICY "Anyone can view seats"
  ON public.seats FOR SELECT
  USING (true);

CREATE POLICY "Users can lock seats"
  ON public.seats FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      locked_by IS NULL OR 
      locked_by = auth.uid() OR 
      (locked_until IS NOT NULL AND locked_until < now())
    )
  );

CREATE POLICY "Admins can manage seats"
  ON public.seats FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buses_updated_at
  BEFORE UPDATE ON public.buses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seats_updated_at
  BEFORE UPDATE ON public.seats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to release expired seat locks
CREATE OR REPLACE FUNCTION public.release_expired_seat_locks()
RETURNS void AS $$
BEGIN
  UPDATE public.seats
  SET status = 'available', locked_by = NULL, locked_until = NULL
  WHERE status = 'locked' AND locked_until < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insert some sample buses
INSERT INTO public.buses (bus_number, route, branch, year, bus_type, departure_time, arrival_time, total_seats, fare) VALUES
  ('BUS-CSE-001', 'College - City Center - College', 'CSE', '1st', 'AC', '07:30 AM', '05:30 PM', 40, 50.00),
  ('BUS-CSE-002', 'College - Railway Station - College', 'CSE', '2nd', 'Non-AC', '08:00 AM', '06:00 PM', 45, 30.00),
  ('BUS-ECE-001', 'College - Bus Stand - College', 'ECE', '1st', 'AC', '07:45 AM', '05:45 PM', 40, 50.00),
  ('BUS-MECH-001', 'College - Industrial Area - College', 'MECH', '3rd', 'Non-AC', '08:15 AM', '06:15 PM', 50, 30.00);

-- Create seats for each bus using proper sequential numbering
INSERT INTO public.seats (bus_id, seat_number, row_number, column_number)
SELECT 
  b.id,
  LPAD(seat_seq::TEXT, 2, '0'),
  ((seat_seq - 1) / 4) + 1,
  ((seat_seq - 1) % 4) + 1
FROM public.buses b
CROSS JOIN generate_series(1, b.total_seats) seat_seq;