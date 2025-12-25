-- Update posts policies to require active account for creation
DROP POLICY IF EXISTS "Users can create posts in their university" ON public.posts;
CREATE POLICY "Users can create posts in their university" 
ON public.posts FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) 
  AND (university_id = get_user_university(auth.uid()))
  AND is_account_active(auth.uid())
);

-- Update housing_listings to strictly enforce role rules
-- Students can only create roommate-type listings (not property listings)
DROP POLICY IF EXISTS "Users can create housing listings" ON public.housing_listings;
CREATE POLICY "Students can create roommate requests only" 
ON public.housing_listings FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) 
  AND (university_id = get_user_university(auth.uid()))
  AND is_account_active(auth.uid())
  AND (listing_type = 'roommate')
  AND (is_vendor_listing = false OR is_vendor_listing IS NULL)
);

-- Update vendor policy - partners can post without admin approval
DROP POLICY IF EXISTS "Approved vendors can create housing listings" ON public.housing_listings;
CREATE POLICY "Partners can create housing listings" 
ON public.housing_listings FOR INSERT 
WITH CHECK (
  (is_vendor_listing = true) 
  AND (partner_id IS NOT NULL) 
  AND EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = housing_listings.partner_id 
    AND partners.user_id = auth.uid()
  )
);

-- Update marketplace_posts to require active account
DROP POLICY IF EXISTS "Students can create marketplace posts" ON public.marketplace_posts;
CREATE POLICY "Students can create marketplace posts" 
ON public.marketplace_posts FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) 
  AND (university_id = get_user_university(auth.uid()))
  AND is_account_active(auth.uid())
  AND (NOT has_role(auth.uid(), 'partner_vendor'))
);

-- Update roommate_requests to require active account
DROP POLICY IF EXISTS "Students can create roommate requests" ON public.roommate_requests;
CREATE POLICY "Students can create roommate requests" 
ON public.roommate_requests FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) 
  AND (university_id = get_user_university(auth.uid()))
  AND is_account_active(auth.uid())
  AND (NOT has_role(auth.uid(), 'partner_vendor'))
);

-- Update post_comments to require active account
DROP POLICY IF EXISTS "Users can create comments" ON public.post_comments;
CREATE POLICY "Users can create comments" 
ON public.post_comments FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id)
  AND is_account_active(auth.uid())
);

-- Update post_likes to require active account
DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
CREATE POLICY "Users can like posts" 
ON public.post_likes FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id)
  AND is_account_active(auth.uid())
);

-- Allow admins to view all profiles for verification management
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff and admin can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'admin')
);

-- Allow admin to update profiles (for verification approval)
CREATE POLICY "Admin can update any profile" 
ON public.profiles FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin')
);

-- Update academic_resources to require active account
DROP POLICY IF EXISTS "Users can create resources" ON public.academic_resources;
CREATE POLICY "Users can create resources" 
ON public.academic_resources FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) 
  AND (university_id = get_user_university(auth.uid()))
  AND is_account_active(auth.uid())
);

-- Update job_listings - partners can post without admin approval
DROP POLICY IF EXISTS "Approved vendors can create job listings" ON public.job_listings;
CREATE POLICY "Partners can create job listings" 
ON public.job_listings FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = job_listings.partner_id 
    AND partners.user_id = auth.uid()
  )
);

-- Update messages to require active account
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations" 
ON public.messages FOR INSERT 
WITH CHECK (
  (auth.uid() = sender_id) 
  AND is_conversation_participant(auth.uid(), conversation_id)
  AND is_account_active(auth.uid())
);