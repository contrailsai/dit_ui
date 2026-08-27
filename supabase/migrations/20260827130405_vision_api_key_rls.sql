-- Harden VISION_API_KEY RLS: owner-only SELECT / INSERT / UPDATE.
-- No DELETE — revoke via revoked_at.

ALTER TABLE public."VISION_API_KEY" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'VISION_API_KEY'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public."VISION_API_KEY"', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "vision_api_key_select_own"
  ON public."VISION_API_KEY"
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "vision_api_key_insert_own"
  ON public."VISION_API_KEY"
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "vision_api_key_update_own"
  ON public."VISION_API_KEY"
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
