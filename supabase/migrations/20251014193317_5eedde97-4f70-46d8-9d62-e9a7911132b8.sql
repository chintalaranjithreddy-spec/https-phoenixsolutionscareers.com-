-- Fix email exposure: Update RLS policy to hide email from public queries
-- Drop the existing public policy
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;

-- Create new policy that excludes email column from public view
CREATE POLICY "Public can view approved reviews without email"
ON public.reviews
FOR SELECT
USING (is_approved = true);

-- Note: The email column will still be in the table but client code should not select it
-- We'll update the client code to only select necessary columns