-- ============================================
-- COMPLETE DATABASE EXPORT FOR PROJECT MIGRATION
-- Generated: 2025-12-26
-- ============================================
-- Run this after creating a new project and running all migrations

-- ============================================
-- 1. UNIVERSITIES
-- ============================================
INSERT INTO universities (id, name, short_name, slug, domain, location, logo_url, theme_primary, theme_gradient, is_active, created_at, updated_at) VALUES
('a44aa242-24f4-4342-a389-97a9af8adedc', 'Lovely Professional University', 'LPU', 'lpu', 'lpu.in', 'Phagwara, Punjab, India', '/assets/universities/lpu/logo.png', '349 80% 48%', 'linear-gradient(135deg, hsl(349, 80%, 48%), hsl(24, 90%, 55%))', true, '2025-12-25 15:52:52.797202+00', '2025-12-25 17:16:37.6544+00'),
('68ccbd36-c623-44b9-a212-6310092da87e', 'Delhi University', 'DU', 'du', 'du.ac.in', 'Delhi', '/assets/universities/du/logo.jpg', '220 70% 45%', 'linear-gradient(135deg, hsl(220, 70%, 45%), hsl(180, 60%, 40%))', false, '2025-12-25 16:59:45.077706+00', '2025-12-25 17:16:37.6544+00'),
('6f9dda42-f710-4a71-923b-c5b82ddb5fc8', 'Indian Institute of Technology Delhi', 'IITD', 'iitd', 'iitd.ac.in', 'Delhi', '/assets/universities/iit-delhi/logo.png', '210 80% 40%', 'linear-gradient(135deg, hsl(210, 80%, 40%), hsl(240, 60%, 50%))', false, '2025-12-25 16:59:45.077706+00', '2025-12-25 17:16:37.6544+00'),
('f4ed5c61-e789-40ba-8381-c7e9df2944e7', 'BITS Pilani', 'BITS', 'bits', 'bits-pilani.ac.in', 'Pilani, Rajasthan', '/assets/universities/bits-pilani/logo.png', '0 70% 50%', 'linear-gradient(135deg, hsl(0, 70%, 50%), hsl(30, 80%, 55%))', false, '2025-12-25 16:59:45.077706+00', '2025-12-25 17:16:37.6544+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. COMMUNITY GROUPS
-- ============================================
INSERT INTO community_groups (id, name, slug, description, icon, display_order, created_at) VALUES
('769f5c2a-5455-40a6-b1ff-cedcadf9d69a', 'General', 'general', 'General discussions and announcements', 'MessageSquare', 1, '2025-12-25 22:02:13.933596+00'),
('b94159d3-0ab1-4d59-9b76-c756b637e62e', 'Freshers', 'freshers', 'Welcome freshers! Ask questions and connect', 'Sparkles', 2, '2025-12-25 22:02:13.933596+00'),
('fd9b6894-3369-4501-9afb-4c5266970bac', 'Seniors', 'seniors', 'Senior students discussions and mentorship', 'GraduationCap', 3, '2025-12-25 22:02:13.933596+00'),
('549643a2-1db9-44b2-8005-1cda0bc8ffc1', 'Housing & Living', 'housing-living', 'Housing, roommates, and campus living', 'Home', 4, '2025-12-25 22:02:13.933596+00'),
('fb13be57-9be8-44b5-aeb1-53150d2fe10a', 'Academics', 'academics', 'Study groups, resources, and academic help', 'BookOpen', 5, '2025-12-25 22:02:13.933596+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. LPU EMERGENCY CONTACTS
-- ============================================
INSERT INTO lpu_emergency_contacts (id, category, department, contact_name, mobile, landline, email, availability, is_sos, priority, created_at, updated_at) VALUES
('f148d2d7-4b3b-478c-81f0-bf890e6c0168', 'hospital', 'Hospital Reception', NULL, NULL, ARRAY['01824-444079', '01824-501227'], NULL, '24x7', true, 1, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('18ddfe90-0388-4359-8330-1da05c42cfba', 'women_help', 'Women Help Center', 'Dr. Monica Gulati', '9915020408', ARRAY['01824-444040'], NULL, '9:00 AM - 5:00 PM', true, 1, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('58d22a83-f3de-44db-865c-187eb44e595e', 'fire_safety', 'Fire & Safety Cell Office', NULL, NULL, ARRAY['01824-444201'], NULL, '24x7', true, 1, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('78eae276-34c5-4b01-9a5d-a81a17980572', 'student_help', 'Student Relationship Division', NULL, '7347000929', ARRAY['01824-510311'], 'parents@lpu.co.in', '9:00 AM to 5:00 PM', false, 1, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('35212974-9596-4ed4-9d13-8e1df6073adc', 'fee_help', 'Fee Help Desk', NULL, NULL, ARRAY['01824-444337'], 'helpdesk.accounts@lpu.co.in', '9:00 AM to 5:00 PM', false, 1, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('f8f16640-e655-43bf-bbaa-9cb36c854e52', 'women_help', 'Women Help Center', 'Mrs. Ravinder Kaur', '9878977800', ARRAY['01824-444235'], NULL, '9:00 AM - 5:00 PM', false, 2, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('d130a25d-4bd3-4e9d-9c98-74072a46fb04', 'women_help', 'Women Help Center', 'Ms. Nirpaljeet Kaur', '7986757060', NULL, NULL, '9:00 AM - 5:00 PM', false, 2, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('9bbe459b-b402-4c4a-ba8f-4d5ddb3e265f', 'hospital', 'Hospital Male Ward', 'Mr. Aneesh George', '7508182840', ARRAY['01824-444066'], NULL, '24x7', false, 2, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('7bf70611-51f8-49a9-a5c5-e1d7a18665ca', 'hospital', 'Hospital Female Ward', 'Ms. Karamjit', '9780036453', ARRAY['01824-444067'], NULL, '24x7', false, 2, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('b5f1fb1e-0a3e-4e3b-a13f-2ddc0775de40', 'women_help', 'Women Safety Cell', 'Mr. Surinder Khurana', '9876644331', ARRAY['01824-444097'], NULL, '9:00 AM - 5:00 PM', false, 2, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('aaa5649a-c53b-4e82-8ca5-51e3aa761ab2', 'fee_help', 'Fee Head of Division', 'Mr. Manohar Sharma', '9876740040', NULL, 'cgm.lovely@gmail.com', NULL, false, 2, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('e7325b28-89bd-4629-9b80-04afa7ef3fae', 'fire_safety', 'Fire Officer', 'Mr. Kuldeep Singh Minhas', '9780036402', NULL, NULL, '24x7', false, 2, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('588c5d70-df72-454d-8e73-f03c43e9bc05', 'fire_safety', 'Fire Tender', NULL, '7508183870', NULL, NULL, '24x7', false, 2, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('0156422b-47a2-458b-99e3-06c60b3dbc91', 'fee_help', 'Fee Coordinator', 'Mr. Krishan Lal', '8054848002', NULL, 'krishan.lal@lpu.co.in', NULL, false, 2, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('55999da4-bd37-402a-9b30-f94be987bd27', 'hospital', 'Doctor', 'Dr. N. K. Gupta', '9878426871', ARRAY['01824-444071'], NULL, '24x7', false, 3, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00'),
('19dceb03-4ed0-4519-9719-03bd7159dfc4', 'fire_safety', 'Fire & Safety', 'Mr. Surinder Kumar Khurana', '9876644331', ARRAY['01824-444097'], NULL, '24x7', false, 3, '2025-12-25 16:52:05.220704+00', '2025-12-25 16:52:05.220704+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. LPU HOSTEL CONTACTS
-- ============================================
INSERT INTO lpu_hostel_contacts (id, hostel_name, hostel_type, block, landline, mobile, availability, created_at, updated_at) VALUES
('da9fdd1d-2928-4368-a63b-871dd266cd90', 'Apartment', 'apartment', 'A, B, C, D', '01824-444520', '9878977900', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('fbacce70-d9b0-419c-abcf-c844b87780b4', 'BH-1', 'boys', 'C', '01824-444523', '9915020442', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('dbf1bf1d-edf4-43fa-bd45-53cd572e46ec', 'BH-1', 'boys', 'A', '01824-444521', '9915020442', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('2a9ccef6-7a2c-43f2-9f60-3c866aef6a82', 'BH-1', 'boys', 'B', '01824-444522', '9915020442', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('e1e4da0d-ef90-492c-9948-08d31d7ada70', 'BH-2', 'boys', 'A, B', '01824-444524', '9888598705', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('15c565b3-d25f-4397-939b-9bc20a723895', 'BH-3', 'boys', 'A, B', '01824-444526', '9915710553', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('f176cbf2-c03f-4796-bb6d-bfb52aef991d', 'BH-3', 'boys', 'C, D', '01824-444527', '9915710553', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('13f0cad8-3604-43e2-925c-ee4f7a4e27d1', 'BH-4', 'boys', 'A, B, C, D, E', '01824-444529', '9876015107', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('3d812fe9-c5a1-430e-bd4a-9b63f77f92fa', 'BH-5', 'boys', 'A, B', '01824-444530', '9780036434', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('4accea70-0994-4cd3-ba4a-74cdc797cf6e', 'BH-5', 'boys', 'C', '01824-444531', '9780036434', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('cfbd5289-a6ae-42b9-aef6-ad82997ed1ec', 'BH-6', 'boys', 'B, C', '01824-444533', '9501110445', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('9a5eb64a-91a2-4862-a0ca-e21b5cbf1e0e', 'BH-6', 'boys', 'A', '01824-444532', '9501110445', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('7aa29bc3-efed-4c4e-9f7d-2f669dfd650a', 'BH-7', 'boys', '', '01824-444536', '7508182896', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('5fe80484-ff16-4f54-8992-ecedcbce5480', 'BH-8', 'boys', '', '01824-444528', '9780005942', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('7e5b2a27-60e8-44c5-b6bd-ea9f5b4faf05', 'GH-1', 'girls', '', '01824-444081', '9915020443', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('5541d066-df92-4aa5-83e0-cb8eadf1b34d', 'GH-2', 'girls', '', '01824-444082', '9876644335', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('8a11d6ce-573b-4680-ab9f-e2f063588969', 'GH-3', 'girls', '', '01824-444083', '9876740090', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('65f1b9ff-7b10-4e36-a114-92f7d89525e2', 'GH-4', 'girls', '', '01824-444084', '9915020444', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('b467dbca-b149-406f-adff-f8e67be31326', 'GH-5', 'girls', 'A, B', '01824-444303', '9876015106', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00'),
('e9416123-06b8-44d3-b3d4-84e54792fd36', 'GH-6', 'girls', 'A, B', '01824-444301', '9915020439', '8:00 AM to 10:00 PM', '2025-12-25 16:51:00.071629+00', '2025-12-25 16:51:00.071629+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. LPU HEALTH DIRECTORY
-- ============================================
INSERT INTO lpu_health_directory (id, department, phone_numbers, created_at) VALUES
('7d950162-fd19-4c6d-ad7a-d5d6524d1508', 'Reception', ARRAY['01824-444079', '01824-501227'], '2025-12-25 16:52:21.576903+00'),
('03723791-4ee7-411a-b4a6-b3b1cd70d8c3', 'Cabin No. 1', ARRAY['01824-444071'], '2025-12-25 16:52:21.576903+00'),
('03ceb790-0990-4f06-afcd-61539390833c', 'Cabin No. 2', ARRAY['01824-444072'], '2025-12-25 16:52:21.576903+00'),
('9ed1b5fc-372e-4f4a-9703-addcc1ade9c9', 'Cabin No. 3', ARRAY['01824-444073'], '2025-12-25 16:52:21.576903+00'),
('bae382f3-e310-4657-89f8-cb9865999620', 'Cabin No. 4', ARRAY['01824-444074'], '2025-12-25 16:52:21.576903+00'),
('036220ac-324a-4078-81eb-97585e71fc56', 'AO Cabin 5', ARRAY['01824-444076'], '2025-12-25 16:52:21.576903+00'),
('d19f2c50-15ca-4e82-ac25-3878f73f6995', 'Cabin No. 6', ARRAY['01824-95015'], '2025-12-25 16:52:21.576903+00'),
('513c4a37-132e-4cf7-88a3-d83ce96c032a', 'Cabin No. 7', ARRAY['01824-444077'], '2025-12-25 16:52:21.576903+00'),
('628fd765-0429-4b62-b62a-7646034581a5', 'Cabin No. 8', ARRAY['01824-95016'], '2025-12-25 16:52:21.576903+00'),
('5e08601e-aa29-4fcb-aa4c-a1463829201d', 'Female Ward', ARRAY['01824-444067'], '2025-12-25 16:52:21.576903+00'),
('f206515f-5e44-4a16-a5dc-d927352ce447', 'Male Ward', ARRAY['01824-444066'], '2025-12-25 16:52:21.576903+00'),
('64719373-ea50-47f9-a81f-2f426f527437', 'Medical Laboratory', ARRAY['01824-444069'], '2025-12-25 16:52:21.576903+00'),
('d301b85c-8107-48ae-a61e-9b4c80df996f', 'Medical Store', ARRAY['01824-444068'], '2025-12-25 16:52:21.576903+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. LPU HEALTH STAFF
-- ============================================
INSERT INTO lpu_health_staff (id, name, role_type, specialization, designation, office_contact, personal_contact, timings, uid, created_at, updated_at) VALUES
('c23b13e9-2bf1-4d4f-84c3-977a26343e24', 'Dr. Ajay Arneja', 'doctor', 'Dentist', 'Medical Officer (Part Time)', '9914033108', '9914033108', '4:00 PM to 8:00 PM', '15536', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00'),
('82309d4e-74cb-4516-be21-a9690e842f32', 'Dr. Anil Malhotra', 'doctor', 'General Physician', 'Medical Officer', '9815364977', '9815364977', '2:00 PM to 10:00 PM', '24116', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00'),
('dee1f885-4dc1-4089-adc2-f9dadb4fac40', 'Dr. Harjeet Singh', 'doctor', 'General Physician, Surgeon', 'Medical Officer', '9815760306', '9815760306', '8 hrs shift duty', '18211', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00'),
('aac07ebe-c30f-4147-8fe6-9bec68b5313f', 'Dr. N.K Gupta', 'doctor', 'General Physician, Surgeon & Eye Specialist', 'Medical Officer', '9878426871', '9815023005', '4:00 PM to 8:00 PM', '31269', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00'),
('6b2a55cb-d5e5-456e-8054-316aeedfaf90', 'Dr. Navneet Singh', 'doctor', 'General Physician', 'Resident Medical Officer', '8264557767', '8264557767', '24 hrs duty (8 hrs shift)', '30482', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00'),
('90fd7c6a-7944-47e1-a9a0-9e8869bd4109', 'Dr. Reyhan Ahmad Sheikh', 'doctor', 'General Physician', 'Resident Medical Officer', '6005932395', '6005932395', '24 hrs duty (8 hrs shift)', '31166', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00'),
('c609bff4-698b-4e9e-8cd0-ab83e7cf494d', 'Dr. Santosh Daniel', 'doctor', 'General Physician', 'Resident Medical Officer', '9944838602', '9944838602', '24 hrs duty (8 hrs shift)', '31230', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00'),
('5081e3ff-5d70-46bd-a512-a4926432795d', 'Dr. Vijay Mohan', 'doctor', 'General Physician, Surgeon (Traditional Medicine)', 'Resident Medical Officer', '9878426880', NULL, '24 hrs (8 hrs shift)', '12772', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00'),
('f794e7bc-383e-47f1-be31-eda54c232318', 'Ms. Anuradha', 'psychologist', 'Post Graduation in Psychology', 'Counseling Psychologist', '01824-444509', NULL, '9:00 AM - 5:30 PM', '25481', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00'),
('2ca00a40-edcd-472d-bd26-880cd42b1968', 'Ms. Anusuya Hazarika', 'psychologist', 'Post Graduation in Clinical Psychology', 'Counseling Psychologist', '01824-444509', NULL, '9:00 AM - 5:30 PM', '24082', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00'),
('f5d4be9c-d902-4854-b65a-0c4aec277db9', 'Ms. Babita', 'psychologist', 'Post Graduation in Psychology', 'Counseling Psychologist', '01824-444509', NULL, '9:00 AM - 5:30 PM', '24639', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00'),
('579b743c-5167-4982-905d-731271408ab6', 'Ms. Neha Sharma', 'psychologist', 'PHD Human Development', 'Counseling Psychologist', '01824-444509', NULL, '9:00 AM - 5:30 PM', '24088', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00'),
('8650eacd-7aa3-4fe8-95f3-c443e3002777', 'Dr. Mamta Arora', 'visiting_doctor', 'Skin Specialist', 'Visiting Consultant', '8146580816', '8146580816', '4:00 PM - 6:00 PM Thursday', '61422', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00'),
('305952f0-4162-4ffd-aff0-6136258dc4e7', 'Dr. Vandana Lalwani', 'visiting_doctor', 'Gynecologist', 'Visiting Consultant', '9814857075', '9814857075', '4:00 PM - 6:00 PM Tuesday & Friday', '63977', '2025-12-25 16:52:20.634043+00', '2025-12-25 16:52:20.634043+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- NOTES:
-- ============================================
-- 1. User accounts (profiles, user_roles) are NOT included because
--    they are linked to Supabase Auth which cannot be migrated.
--    Users will need to sign up again.
--
-- 2. User-generated content (posts, housing_listings, marketplace_posts, etc.)
--    is also NOT included because it references user IDs that won't exist
--    in the new project.
--
-- 3. After running this script in your new project:
--    - All universities will be available
--    - All community groups will be set up
--    - All LPU-specific data (hostels, health, emergency) will be restored
--    - Users can sign up fresh and start using the platform
--
-- ============================================
-- END OF EXPORT
-- ============================================
