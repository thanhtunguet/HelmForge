-- Create security definer function to check if user has access to a template via sharing
CREATE OR REPLACE FUNCTION public.has_template_share_access(
  _template_id uuid,
  _user_id uuid,
  _permission text DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.template_shares
    WHERE template_id = _template_id
      AND shared_with_user_id = _user_id
      AND (_permission IS NULL OR permission = _permission)
  )
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own, public, or shared templates" ON public.templates;
DROP POLICY IF EXISTS "Shared users with edit permission can update" ON public.templates;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view own, public, or shared templates" 
ON public.templates 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR visibility = 'public'::template_visibility 
  OR public.has_template_share_access(id, auth.uid())
);

CREATE POLICY "Shared users with edit permission can update" 
ON public.templates 
FOR UPDATE 
USING (public.has_template_share_access(id, auth.uid(), 'edit'));