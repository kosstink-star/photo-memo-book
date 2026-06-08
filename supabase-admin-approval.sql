-- 1. 'pending' 역할을 허용하도록 family_members 테이블의 제약 조건 업데이트
ALTER TABLE public.family_members DROP CONSTRAINT IF EXISTS family_members_role_check;
ALTER TABLE public.family_members ADD CONSTRAINT family_members_role_check CHECK (role IN ('admin', 'member', 'pending'));

-- 2. 헬퍼 함수 업데이트: 권한 체크 시 'pending' 상태인 멤버는 제외하도록 변경 (필수: 보안 강화)
-- (SECURITY DEFINER 함수 내에서 auth.uid()가 올바르게 작동하도록 사용자 ID를 인자로 받습니다)
CREATE OR REPLACE FUNCTION public.is_family_member(family_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY definer
STABLE
AS $$
  SELECT exists (
    SELECT 1
    FROM public.family_members
    WHERE family_id = family_uuid
      AND user_id = user_uuid
      AND role IN ('admin', 'member')
  );
$$;

-- 3. family_members 데이터 조회 정책 업데이트
DROP POLICY IF EXISTS "family_members_select" ON public.family_members;
CREATE POLICY "family_members_select"
  ON public.family_members FOR SELECT
  TO authenticated
  USING (
    public.is_family_member(family_id, auth.uid()) 
    OR user_id = auth.uid()
  );

-- 관리자(admin)가 'pending' 역할로 가입한 사람의 상태를 'member'로 업데이트할 수 있도록 허용하는 정책은 
-- 기존의 "family_members_update"와 "family_members_delete" 정책(admin 권한 확인)으로 이미 커버됩니다.
