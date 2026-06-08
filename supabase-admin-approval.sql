-- 1. Helper function to check admin status (Removed STABLE to fix auth.uid() caching issue)
CREATE OR REPLACE FUNCTION public.is_family_admin(family_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY definer
AS $$
  SELECT exists (
    SELECT 1
    FROM public.family_members
    WHERE family_id = family_uuid
      AND user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- 2. Ensure the update policy allows admins to update roles
DROP POLICY IF EXISTS "family_members_update" ON public.family_members;
CREATE POLICY "family_members_update"
  ON public.family_members FOR UPDATE
  TO authenticated
  USING (public.is_family_admin(family_id));
