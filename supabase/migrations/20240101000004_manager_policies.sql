-- Allow managers to create repairs
CREATE POLICY "Managers can create repairs"
ON repairs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'finance')
  )
);

-- Allow managers to update any repair
CREATE POLICY "Managers can update any repair"
ON repairs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('manager', 'finance')
  )
);
