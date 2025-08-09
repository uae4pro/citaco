-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert default app settings
INSERT INTO app_settings (app_name, currency, tax_rate, shipping_cost, free_shipping_threshold) 
VALUES ('AutoParts Store', 'USD', 0.08, 9.99, 100.00);

-- Insert sample categories
INSERT INTO categories (name, description, icon) VALUES
('engine', 'Engine parts and components', 'engine'),
('transmission', 'Transmission and drivetrain parts', 'gear'),
('brakes', 'Brake system components', 'disc'),
('suspension', 'Suspension and steering parts', 'spring'),
('electrical', 'Electrical system components', 'zap'),
('body', 'Body panels and exterior parts', 'car'),
('interior', 'Interior components and accessories', 'seat'),
('exhaust', 'Exhaust system parts', 'pipe'),
('cooling', 'Cooling system components', 'thermometer'),
('fuel_system', 'Fuel system parts', 'fuel'),
('accessory', 'Accessories and add-ons', 'plus');

-- Insert sample brands
INSERT INTO brands (name, description) VALUES
('AutoPro', 'Professional automotive parts manufacturer'),
('FilterMax', 'Premium filter solutions'),
('FluidTech', 'Advanced automotive fluids'),
('RideComfort', 'Suspension and comfort specialists'),
('BrightLite', 'LED lighting solutions'),
('AirFlow', 'Air filtration experts'),
('StopMax', 'Brake system specialists'),
('CoolFlow', 'Cooling system solutions');

-- Insert sample admin user (password should be hashed in real application)
INSERT INTO users (email, name, role, password_hash) VALUES
('admin@autoparts.com', 'Admin User', 'admin', '$2b$10$example.hash.here'),
('john.doe@example.com', 'John Doe', 'customer', '$2b$10$example.hash.here');

-- Insert sample spare parts
INSERT INTO spare_parts (name, part_number, description, price, category, brand, stock_quantity, weight, dimensions, image_urls, compatibility) VALUES
('Brake Pads - Front Set', 'BP-001-F', 'High-quality ceramic brake pads for front wheels. Compatible with most sedan models.', 89.99, 'brakes', 'AutoPro', 25, 2.5, '25x15x3 cm', '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"]', '["Honda Civic", "Toyota Camry", "Nissan Altima"]'),
('Engine Oil Filter', 'OF-205', 'Premium oil filter for optimal engine performance and protection.', 24.99, 'engine', 'FilterMax', 50, 0.8, '10x10x8 cm', '["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400"]', '["Ford F-150", "Chevrolet Silverado", "Ram 1500"]'),
('Transmission Fluid', 'ATF-500', 'High-performance automatic transmission fluid for smooth shifting.', 34.99, 'transmission', 'FluidTech', 30, 1.2, '12x8x25 cm', '["https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=400"]', '["Honda Accord", "Toyota Corolla", "Mazda CX-5"]'),
('Shock Absorbers - Rear Pair', 'SA-300-R', 'Heavy-duty shock absorbers for improved ride comfort and handling.', 159.99, 'suspension', 'RideComfort', 15, 3.2, '45x8x8 cm', '["https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400"]', '["BMW 3 Series", "Mercedes C-Class", "Audi A4"]'),
('LED Headlight Bulbs', 'LED-H7', 'Ultra-bright LED headlight bulbs with long lifespan and low power consumption.', 79.99, 'electrical', 'BrightLite', 40, 0.3, '8x5x5 cm', '["https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=400"]', '["Volkswagen Golf", "Subaru Outback", "Hyundai Elantra"]'),
('Air Filter', 'AF-150', 'High-efficiency air filter for improved engine performance and fuel economy.', 19.99, 'engine', 'AirFlow', 60, 0.5, '20x15x5 cm', '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"]', '["Toyota Prius", "Honda Insight", "Nissan Leaf"]'),
('Brake Rotors - Front Pair', 'BR-400-F', 'Ventilated brake rotors for superior heat dissipation and braking performance.', 129.99, 'brakes', 'StopMax', 8, 4.2, '30x30x5 cm', '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"]', '["Ford Mustang", "Chevrolet Camaro", "Dodge Challenger"]'),
('Radiator Coolant', 'RC-250', 'Premium coolant for optimal engine temperature regulation and corrosion protection.', 29.99, 'cooling', 'CoolFlow', 35, 1.2, '12x8x25 cm', '["https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=400"]', '["Jeep Wrangler", "Ford Explorer", "Chevrolet Tahoe"]'),
('Spark Plugs Set', 'SP-100', 'High-performance spark plugs for improved ignition and fuel efficiency.', 45.99, 'engine', 'AutoPro', 75, 0.2, '8x2x2 cm', '["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400"]', '["Honda Civic", "Toyota Corolla", "Nissan Sentra"]'),
('Cabin Air Filter', 'CAF-300', 'HEPA cabin air filter for clean air circulation inside the vehicle.', 22.99, 'interior', 'AirFlow', 45, 0.3, '25x20x3 cm', '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"]', '["BMW X5", "Mercedes GLE", "Audi Q7"]');

-- Insert sample orders
DO $$
DECLARE
    user_id_1 UUID;
    user_id_2 UUID;
    order_id_1 UUID;
    order_id_2 UUID;
    part_id_1 UUID;
    part_id_2 UUID;
    part_id_3 UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO user_id_1 FROM users WHERE email = 'john.doe@example.com';
    SELECT id INTO user_id_2 FROM users WHERE email = 'admin@autoparts.com';
    
    -- Get some part IDs
    SELECT id INTO part_id_1 FROM spare_parts WHERE part_number = 'BP-001-F';
    SELECT id INTO part_id_2 FROM spare_parts WHERE part_number = 'OF-205';
    SELECT id INTO part_id_3 FROM spare_parts WHERE part_number = 'ATF-500';
    
    -- Insert sample orders
    INSERT INTO orders (id, user_id, user_email, order_number, subtotal, tax_amount, shipping_cost, total_amount, status, payment_status)
    VALUES 
    (gen_random_uuid(), user_id_1, 'john.doe@example.com', 'ORD-2024-001', 204.97, 16.40, 9.99, 231.36, 'completed', 'paid'),
    (gen_random_uuid(), user_id_1, 'john.doe@example.com', 'ORD-2024-002', 34.99, 2.80, 9.99, 47.78, 'pending', 'pending')
    RETURNING id INTO order_id_1;
    
    -- Get the order IDs for order items
    SELECT id INTO order_id_1 FROM orders WHERE order_number = 'ORD-2024-001';
    SELECT id INTO order_id_2 FROM orders WHERE order_number = 'ORD-2024-002';
    
    -- Insert order items for first order
    INSERT INTO order_items (order_id, spare_part_id, quantity, unit_price, total_price, part_name, part_number)
    VALUES 
    (order_id_1, part_id_1, 2, 89.99, 179.98, 'Brake Pads - Front Set', 'BP-001-F'),
    (order_id_1, part_id_2, 1, 24.99, 24.99, 'Engine Oil Filter', 'OF-205');
    
    -- Insert order items for second order
    INSERT INTO order_items (order_id, spare_part_id, quantity, unit_price, total_price, part_name, part_number)
    VALUES 
    (order_id_2, part_id_3, 1, 34.99, 34.99, 'Transmission Fluid', 'ATF-500');
    
END $$;
