CREATE TABLE thai_locations (
  id SERIAL PRIMARY KEY,
  province TEXT NOT NULL,
  amphoe TEXT NOT NULL, -- District
  tambon TEXT NOT NULL, -- Sub-district
  zipcode TEXT NOT NULL,
  district_code TEXT,
  province_code TEXT,
  amphoe_code TEXT,
  tambon_code TEXT
);

-- Create indexes for faster search
CREATE INDEX idx_thai_locations_province ON thai_locations(province);
CREATE INDEX idx_thai_locations_amphoe ON thai_locations(amphoe);
CREATE INDEX idx_thai_locations_tambon ON thai_locations(tambon);
CREATE INDEX idx_thai_locations_zipcode ON thai_locations(zipcode);

-- Enable RLS (Read-only for everyone)
ALTER TABLE thai_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thai locations are viewable by everyone" ON thai_locations
  FOR SELECT USING (true);
