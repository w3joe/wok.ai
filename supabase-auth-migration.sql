-- Add user_id column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update RLS policies to restrict access based on user_id

-- 1. Everyone can still read recipes (public sharing)
-- DROP POLICY IF EXISTS "Allow public read access" ON recipes;
-- CREATE POLICY "Allow public read access" ON recipes FOR SELECT USING (true);

-- 2. Only authenticated users can insert (and auto-assign their ID)
DROP POLICY IF EXISTS "Allow public insert access" ON recipes;
CREATE POLICY "Allow authenticated insert access" ON recipes 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can only update their own recipes
DROP POLICY IF EXISTS "Allow public update access" ON recipes;
CREATE POLICY "Allow owners to update" ON recipes 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 4. Users can only delete their own recipes
CREATE POLICY "Allow owners to delete" ON recipes 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);
