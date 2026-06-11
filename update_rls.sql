-- ============================================================
-- RLS Policy Update Script (v1.5.4 Security Patch)
-- ============================================================

-- 1. Update Profiles Select Policy
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.family_members fm1
      JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid() AND fm2.user_id = profiles.id
    )
  );

-- 2. Update Family Members Insert Policy (Block Privilege Escalation)
DROP POLICY IF EXISTS "family_members_insert" ON public.family_members;
CREATE POLICY "family_members_insert"
  ON public.family_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'member');

-- 3. Update Storage Bucket Policies (familyId base paths)
DROP POLICY IF EXISTS "storage_photos_insert" ON storage.objects;
CREATE POLICY "storage_photos_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND public.is_family_member((regexp_split_to_array(name, '/'))[1]::uuid)
  );

DROP POLICY IF EXISTS "storage_photos_select" ON storage.objects;
CREATE POLICY "storage_photos_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'photos' AND
    public.is_family_member((regexp_split_to_array(name, '/'))[1]::uuid)
  );

DROP POLICY IF EXISTS "storage_photos_update" ON storage.objects;
CREATE POLICY "storage_photos_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND public.is_family_member((regexp_split_to_array(name, '/'))[1]::uuid)
  );

DROP POLICY IF EXISTS "storage_photos_delete" ON storage.objects;
CREATE POLICY "storage_photos_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND public.is_family_member((regexp_split_to_array(name, '/'))[1]::uuid)
  );
