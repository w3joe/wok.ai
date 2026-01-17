-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]',
  steps JSONB NOT NULL DEFAULT '[]',
  timing JSONB,
  techniques JSONB,
  transcript TEXT,
  -- New video-related fields
  video_url TEXT,
  language TEXT DEFAULT 'en',
  cuisine_type TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  frames JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for searching recipes by title
CREATE INDEX IF NOT EXISTS recipes_title_idx ON recipes(title);

-- Create index for created_at for sorting
CREATE INDEX IF NOT EXISTS recipes_created_at_idx ON recipes(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow public read access" ON recipes
  FOR SELECT USING (true);

-- Create policy to allow insert access to all users
CREATE POLICY "Allow public insert access" ON recipes
  FOR INSERT WITH CHECK (true);

-- Create policy to allow update access to all users
CREATE POLICY "Allow public update access" ON recipes
  FOR UPDATE USING (true);
