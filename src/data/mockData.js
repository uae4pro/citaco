// Mock data for the spare parts application

// Sample spare parts data
export const mockSpareParts = [
  {
    id: "1",
    name: "Brake Pads - Front Set",
    description: "High-quality ceramic brake pads for front wheels. Compatible with most sedan models.",
    price: 89.99,
    category: "brakes",
    brand: "AutoPro",
    part_number: "BP-001-F",
    stock_quantity: 25,
    is_active: true,
    image_urls: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"
    ],
    compatibility: ["Honda Civic", "Toyota Camry", "Nissan Altima"],
    created_date: "2024-01-15T10:00:00Z",
    updated_date: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    name: "Engine Oil Filter",
    description: "Premium oil filter for optimal engine performance and protection.",
    price: 24.99,
    category: "engine",
    brand: "FilterMax",
    part_number: "OF-205",
    stock_quantity: 50,
    is_active: true,
    image_urls: [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400"
    ],
    compatibility: ["Ford F-150", "Chevrolet Silverado", "Ram 1500"],
    created_date: "2024-01-16T09:30:00Z",
    updated_date: "2024-01-16T09:30:00Z"
  },
  {
    id: "3",
    name: "Transmission Fluid",
    description: "High-performance automatic transmission fluid for smooth shifting.",
    price: 34.99,
    category: "transmission",
    brand: "FluidTech",
    part_number: "ATF-500",
    stock_quantity: 30,
    is_active: true,
    image_urls: [
      "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=400"
    ],
    compatibility: ["Honda Accord", "Toyota Corolla", "Mazda CX-5"],
    created_date: "2024-01-17T14:15:00Z",
    updated_date: "2024-01-17T14:15:00Z"
  },
  {
    id: "4",
    name: "Shock Absorbers - Rear Pair",
    description: "Heavy-duty shock absorbers for improved ride comfort and handling.",
    price: 159.99,
    category: "suspension",
    brand: "RideComfort",
    part_number: "SA-300-R",
    stock_quantity: 15,
    is_active: true,
    image_urls: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400"
    ],
    compatibility: ["BMW 3 Series", "Mercedes C-Class", "Audi A4"],
    created_date: "2024-01-18T11:45:00Z",
    updated_date: "2024-01-18T11:45:00Z"
  },
  {
    id: "5",
    name: "LED Headlight Bulbs",
    description: "Ultra-bright LED headlight bulbs with long lifespan and low power consumption.",
    price: 79.99,
    category: "electrical",
    brand: "BrightLite",
    part_number: "LED-H7",
    stock_quantity: 40,
    is_active: true,
    image_urls: [
      "https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=400"
    ],
    compatibility: ["Volkswagen Golf", "Subaru Outback", "Hyundai Elantra"],
    created_date: "2024-01-19T16:20:00Z",
    updated_date: "2024-01-19T16:20:00Z"
  },
  {
    id: "6",
    name: "Air Filter",
    description: "High-efficiency air filter for improved engine performance and fuel economy.",
    price: 19.99,
    category: "engine",
    brand: "AirFlow",
    part_number: "AF-150",
    stock_quantity: 60,
    is_active: true,
    image_urls: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"
    ],
    compatibility: ["Toyota Prius", "Honda Insight", "Nissan Leaf"],
    created_date: "2024-01-20T08:10:00Z",
    updated_date: "2024-01-20T08:10:00Z"
  },
  {
    id: "7",
    name: "Brake Rotors - Front Pair",
    description: "Ventilated brake rotors for superior heat dissipation and braking performance.",
    price: 129.99,
    category: "brakes",
    brand: "StopMax",
    part_number: "BR-400-F",
    stock_quantity: 8,
    is_active: true,
    image_urls: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"
    ],
    compatibility: ["Ford Mustang", "Chevrolet Camaro", "Dodge Challenger"],
    created_date: "2024-01-21T13:30:00Z",
    updated_date: "2024-01-21T13:30:00Z"
  },
  {
    id: "8",
    name: "Radiator Coolant",
    description: "Premium coolant for optimal engine temperature regulation and corrosion protection.",
    price: 29.99,
    category: "cooling",
    brand: "CoolFlow",
    part_number: "RC-250",
    stock_quantity: 35,
    is_active: true,
    image_urls: [
      "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=400"
    ],
    compatibility: ["Jeep Wrangler", "Ford Explorer", "Chevrolet Tahoe"],
    created_date: "2024-01-22T10:45:00Z",
    updated_date: "2024-01-22T10:45:00Z"
  }
];

// Sample users data
export const mockUsers = [
  {
    id: "user1",
    email: "john.doe@example.com",
    name: "John Doe",
    role: "customer",
    created_date: "2024-01-01T00:00:00Z"
  },
  {
    id: "user2", 
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    created_date: "2024-01-01T00:00:00Z"
  }
];

// Sample cart items (initially empty, will be managed in localStorage)
export const mockCartItems = [];

// Sample orders
export const mockOrders = [
  {
    id: "order1",
    user_email: "john.doe@example.com",
    items: [
      { spare_part_id: "1", quantity: 2, price: 89.99 },
      { spare_part_id: "2", quantity: 1, price: 24.99 }
    ],
    total_amount: 204.97,
    status: "completed",
    created_date: "2024-01-10T15:30:00Z"
  },
  {
    id: "order2",
    user_email: "john.doe@example.com", 
    items: [
      { spare_part_id: "3", quantity: 1, price: 34.99 }
    ],
    total_amount: 34.99,
    status: "pending",
    created_date: "2024-01-20T09:15:00Z"
  }
];

// Sample app settings
export const mockAppSettings = {
  id: "settings1",
  app_name: "AutoParts Store",
  currency: "USD",
  tax_rate: 0.08,
  shipping_cost: 9.99,
  free_shipping_threshold: 100.00
};
