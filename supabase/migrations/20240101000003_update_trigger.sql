CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, line_user_id)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    '', 
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'sub' -- Assuming 'sub' contains the LINE User ID
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
