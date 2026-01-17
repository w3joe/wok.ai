-- FIX: Allow both authenticated and guest inserts
DROP POLICY IF EXISTS "Allow authenticated insert access" ON recipes;
DROP POLICY IF EXISTS "Allow public insert access" ON recipes;

CREATE POLICY "Allow public insert with checks" ON recipes 
  FOR INSERT 
  WITH CHECK (
    -- Allow guests (no user_id)
    (user_id IS NULL)
    OR
    -- Allow authenticated users claiming their own ID
    (auth.uid() = user_id)
  );

-- Ensure public read access is still on
DROP POLICY IF EXISTS "Allow public read access" ON recipes;
CREATE POLICY "Allow public read access" ON recipes FOR SELECT USING (true);
