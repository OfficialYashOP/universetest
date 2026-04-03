import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const uniId = "a44aa242-24f4-4342-a389-97a9af8adedc";
  const password = "Demo123!";

  const demoUsers = [
    { email: "arjun.sharma@lpu.in", full_name: "Arjun Sharma", username: "arjun_sharma", role: "student", bio: "CSE 3rd year | Full-stack dev | Hackathon winner 🏆", branch: "Computer Science Engineering", year: "3rd Year", verified: true },
    { email: "priya.patel@lpu.in", full_name: "Priya Patel", username: "priya_patel", role: "student", bio: "MBA student | Marketing enthusiast | Coffee lover ☕", branch: "Business Administration", year: "2nd Year", verified: true },
    { email: "rahul.kumar@lpu.in", full_name: "Rahul Kumar", username: "rahul_k", role: "senior", bio: "ECE final year | IoT researcher | Cricket enthusiast 🏏", branch: "Electronics & Communication", year: "4th Year", verified: true },
    { email: "sneha.reddy@lpu.in", full_name: "Sneha Reddy", username: "sneha_reddy", role: "student", bio: "Design student | UI/UX | Figma wizard ✨", branch: "Design", year: "2nd Year", verified: true },
    { email: "vikram.singh@lpu.in", full_name: "Vikram Singh", username: "vikram_s", role: "student", bio: "Mechanical Engineering | Gym freak 💪 | Photography", branch: "Mechanical Engineering", year: "3rd Year", verified: false },
    { email: "ananya.gupta@lpu.in", full_name: "Ananya Gupta", username: "ananya_g", role: "student", bio: "BCA student | App developer | Open source contributor 🌟", branch: "Computer Applications", year: "3rd Year", verified: true },
    { email: "dev.malhotra@lpu.in", full_name: "Dev Malhotra", username: "dev_m", role: "student", bio: "Law student | Moot court champion | Debate club president", branch: "Law", year: "2nd Year", verified: false },
    { email: "kavya.nair@lpu.in", full_name: "Kavya Nair", username: "kavya_nair", role: "student", bio: "Journalism major | Campus radio host 🎙️ | Writer", branch: "Journalism & Mass Communication", year: "3rd Year", verified: true },
    { email: "rohit.joshi@lpu.in", full_name: "Rohit Joshi", username: "rohit_j", role: "senior", bio: "Civil Engineering | Sustainable architecture | Traveler 🌍", branch: "Civil Engineering", year: "4th Year", verified: false },
    { email: "isha.verma@lpu.in", full_name: "Isha Verma", username: "isha_v", role: "student", bio: "Psychology student | Mental health advocate | Yoga practitioner 🧘", branch: "Psychology", year: "2nd Year", verified: true },
  ];

  const createdIds: string[] = [];
  const errors: string[] = [];

  // Step 1: Create auth users
  for (const u of demoUsers) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, university_id: uniId, role: u.role, username: u.username },
    });
    if (error) {
      if (error.message?.includes("already been registered")) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find((x: any) => x.email === u.email);
        if (existing) createdIds.push(existing.id);
        else errors.push(`${u.email}: ${error.message}`);
      } else {
        errors.push(`${u.email}: ${error.message}`);
      }
    } else if (data?.user) {
      createdIds.push(data.user.id);
      // Update profile with extra fields
      await supabaseAdmin.from("profiles").update({
        bio: u.bio,
        branch: u.branch,
        year_of_study: u.year,
        is_verified: u.verified,
        verification_status: u.verified ? "verified" : null,
        avatar_url: `https://i.pravatar.cc/300?u=${u.username}`,
      }).eq("id", data.user.id);
    }
  }

  if (createdIds.length < 2) {
    return new Response(JSON.stringify({ error: "Not enough users created", errors }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }

  // Step 2: Create follows
  const followPairs = [
    [0,1],[0,3],[0,5],[1,0],[1,2],[2,0],[2,7],[3,0],[3,1],[4,2],[4,5],[5,0],[5,3],[6,7],[6,9],[7,6],[7,0],[8,2],[8,4],[9,6],[9,7],[9,0]
  ];
  for (const [a, b] of followPairs) {
    if (createdIds[a] && createdIds[b]) {
      await supabaseAdmin.from("follows").upsert({ follower_id: createdIds[a], following_id: createdIds[b] }, { onConflict: "follower_id,following_id", ignoreDuplicates: true });
    }
  }

  // Step 3: Create posts
  const postContents = [
    { idx: 0, content: "🚀 Just deployed my first full-stack project using React + Supabase! The feeling of seeing your code live is unmatched. Who else is building cool stuff this semester? #coding #webdev", likes: 24, comments: 5, group: "769f5c2a-5455-40a6-b1ff-cedcadf9d69a", ago: "5 days" },
    { idx: 1, content: "Marketing case study competition results are out! Our team secured 2nd place 🥈 Huge thanks to my teammates for the incredible work. Hard work pays off! 💪", likes: 31, comments: 8, group: "769f5c2a-5455-40a6-b1ff-cedcadf9d69a", ago: "4 days" },
    { idx: 2, content: "📢 Seniors, final placement season is here! Here are my tips:\n\n1. Start DSA prep early\n2. Build real projects\n3. Practice mock interviews\n4. Network on LinkedIn\n5. Stay consistent\n\nGood luck! 🎯", likes: 56, comments: 12, group: "fd9b6894-3369-4501-9afb-4c5266970bac", ago: "3 days" },
    { idx: 3, content: "Just finished designing the UI for our campus event app! 🎨 Clean, minimal, and user-friendly. What do you think about this color palette? Feedback welcome! #UIDesign", likes: 18, comments: 4, group: "769f5c2a-5455-40a6-b1ff-cedcadf9d69a", ago: "2 days" },
    { idx: 4, content: "Morning gym session hit different today 💪🔥 5:30 AM wake-up is worth it when you see the results. Who else is part of the early morning gym crew?", likes: 15, comments: 3, group: "769f5c2a-5455-40a6-b1ff-cedcadf9d69a", ago: "2 days" },
    { idx: 5, content: "🌟 Excited to announce my open source Flutter package just crossed 500 stars on GitHub! Building in public is the best way to learn and grow.", likes: 42, comments: 7, group: "769f5c2a-5455-40a6-b1ff-cedcadf9d69a", ago: "1 day" },
    { idx: 6, content: "Won the inter-university moot court competition! 🏆⚖️ 3 months of preparation finally paid off. Shoutout to the law department faculty!", likes: 38, comments: 9, group: "769f5c2a-5455-40a6-b1ff-cedcadf9d69a", ago: "1 day" },
    { idx: 7, content: "🎙️ New episode of Campus Vibes Radio is LIVE! This week: upcoming cultural fest plans, interview with the student council president, and top 5 study spots on campus!", likes: 27, comments: 6, group: "769f5c2a-5455-40a6-b1ff-cedcadf9d69a", ago: "20 hours" },
    { idx: 8, content: "Site visit to the new sustainable building project in Jalandhar was amazing! 🏗️ Learning about green architecture in real-world settings beats textbooks. #CivilEngineering", likes: 19, comments: 4, group: "769f5c2a-5455-40a6-b1ff-cedcadf9d69a", ago: "18 hours" },
    { idx: 9, content: "🧘 Friendly reminder to take care of your mental health during exam season! The counseling center is FREE for all students. No shame in seeking help. You matter! 💚 #MentalHealthMatters", likes: 67, comments: 14, group: "769f5c2a-5455-40a6-b1ff-cedcadf9d69a", ago: "12 hours" },
    { idx: 0, content: "Hey freshers! 👋 Welcome to LPU!\n🍕 Best food: Block 38 canteen\n📚 Best study spot: Central library 3rd floor\n🏃 Best hangout: Uni Mall area\n\nDrop your questions below!", likes: 45, comments: 11, group: "b94159d3-0ab1-4d59-9b76-c756b637e62e", ago: "6 hours" },
    { idx: 2, content: "Looking for a roommate for next semester! Currently in BH-3, Block B. Preferably CSE or ECE. Clean, organized, and respectful of study hours. DM if interested! 🏠", likes: 8, comments: 3, group: "549643a2-1db9-44b2-8005-1cda0bc8ffc1", ago: "3 hours" },
  ];

  const postIds: string[] = [];
  for (const p of postContents) {
    if (!createdIds[p.idx]) continue;
    const { data } = await supabaseAdmin.from("posts").insert({
      user_id: createdIds[p.idx],
      university_id: uniId,
      content: p.content,
      likes_count: p.likes,
      comments_count: p.comments,
      group_id: p.group,
    }).select("id").single();
    if (data) postIds.push(data.id);
  }

  // Step 4: Post likes
  for (const postId of postIds.slice(0, 5)) {
    for (let i = 0; i < Math.min(5, createdIds.length); i++) {
      await supabaseAdmin.from("post_likes").insert({ post_id: postId, user_id: createdIds[i] }).then(() => {});
    }
  }

  // Step 5: Post comments
  const commentData = [
    { postIdx: 0, userIdx: 1, content: "Amazing work! 🔥 Would love to collaborate on the next project." },
    { postIdx: 0, userIdx: 5, content: "Which hosting did you use? Looking for good options!" },
    { postIdx: 0, userIdx: 0, content: "I used Vercel for frontend and Supabase for backend. Super easy!" },
    { postIdx: 2, userIdx: 0, content: "This is gold! Saving this for later. Thanks senior! 🙏" },
    { postIdx: 2, userIdx: 4, content: "How early should we start preparing? I'm in 3rd year ME." },
    { postIdx: 2, userIdx: 2, content: "Start NOW! 3rd year is the best time. Focus on core subjects + aptitude." },
    { postIdx: 9, userIdx: 0, content: "Such an important post! Everyone needs to hear this. 💚" },
    { postIdx: 9, userIdx: 3, content: "Thank you for normalizing this conversation! 🙌" },
    { postIdx: 9, userIdx: 7, content: "We should do a podcast episode about this! Would you like to be a guest? 🎙️" },
    { postIdx: 9, userIdx: 9, content: "Absolutely! DM me the details and let's make it happen! 💪" },
    { postIdx: 6, userIdx: 7, content: "Congratulations Dev! You deserve it! 🎉⚖️" },
    { postIdx: 6, userIdx: 9, content: "So proud of you! Hard work always pays off. 👏" },
    { postIdx: 5, userIdx: 0, content: "500 stars is insane! Congrats! 🌟 What's the package about?" },
    { postIdx: 10, userIdx: 1, content: "Block 38 canteen samosas are legendary! 😋" },
    { postIdx: 10, userIdx: 3, content: "What about the best places for group study?" },
  ];
  for (const c of commentData) {
    if (postIds[c.postIdx] && createdIds[c.userIdx]) {
      await supabaseAdmin.from("post_comments").insert({ post_id: postIds[c.postIdx], user_id: createdIds[c.userIdx], content: c.content });
    }
  }

  // Step 6: Academic resources
  const resources = [
    { idx: 0, title: "Data Structures & Algorithms - Cormen (CLRS)", desc: "Classic CLRS textbook, 3rd edition. Highlighted key sections. Perfect for placement prep.", type: "textbook", subject: "Computer Science", condition: "good", price: 450 },
    { idx: 2, title: "Signals & Systems Complete Notes", desc: "Handwritten notes covering entire syllabus with solved examples. Got 9.5 CGPA!", type: "notes", subject: "Electronics & Communication", condition: "new", price: 150 },
    { idx: 1, title: "Philip Kotler - Marketing Management 16th Ed", desc: "Latest edition, barely used. Includes unused online access code.", type: "textbook", subject: "Marketing", condition: "like_new", price: 800 },
    { idx: 5, title: "Python Programming Lab Manual + Solutions", desc: "Complete lab manual with all programs solved and tested.", type: "notes", subject: "Computer Applications", condition: "new", price: 100 },
    { idx: 8, title: "Surveying & Leveling by Punmia", desc: "Standard textbook for civil engineering. Some wear but all pages intact.", type: "textbook", subject: "Civil Engineering", condition: "fair", price: 300 },
    { idx: 4, title: "Thermodynamics by Cengel & Boles", desc: "Engineering thermodynamics, 8th edition. Clear explanations.", type: "textbook", subject: "Mechanical Engineering", condition: "good", price: 500 },
    { idx: 9, title: "Psychology Research Methods Notes + Previous Papers", desc: "Comprehensive notes with 5 years of solved previous papers.", type: "notes", subject: "Psychology", condition: "new", price: 200 },
    { idx: 6, title: "Indian Penal Code - Bare Act + Commentary", desc: "IPC bare act with detailed commentary and case laws.", type: "textbook", subject: "Law", condition: "good", price: 350 },
    { idx: 3, title: "Complete UI/UX Design Course Materials", desc: "Figma files, wireframe templates, and design system components.", type: "notes", subject: "Design", condition: "new", price: 250 },
    { idx: 7, title: "Mass Communication Theory by McQuail", desc: "7th edition. Excellent condition with sticky notes on key chapters.", type: "textbook", subject: "Journalism", condition: "like_new", price: 600 },
  ];
  for (const r of resources) {
    if (!createdIds[r.idx]) continue;
    await supabaseAdmin.from("academic_resources").insert({ user_id: createdIds[r.idx], university_id: uniId, title: r.title, description: r.desc, resource_type: r.type, subject: r.subject, condition: r.condition, price: r.price });
  }

  // Step 7: Marketplace posts
  const marketplace = [
    { idx: 0, title: "MacBook Air M1 (2020) - 8GB/256GB", desc: "Battery health 92%, original charger and box. No scratches.", price: 52000, cat: "electronics", cond: "good" },
    { idx: 2, title: "HP Scientific Calculator - fx-991ES PLUS", desc: "Used for 2 semesters. Works perfectly.", price: 800, cat: "electronics", cond: "good" },
    { idx: 4, title: "Gym Equipment Set - Dumbbells + Resistance Bands", desc: "5kg and 10kg dumbbell pair + 5 resistance bands. Barely used.", price: 2500, cat: "sports", cond: "like_new" },
    { idx: 3, title: "Wacom Drawing Tablet - Intuos S", desc: "Perfect for digital art. Comes with pen and USB cable.", price: 3500, cat: "electronics", cond: "good" },
    { idx: 1, title: "Business Formal Wear Set (Blazer + Trousers)", desc: "Navy blue, size M. Worn only for presentations.", price: 1800, cat: "clothing", cond: "like_new" },
    { idx: 7, title: "Audio-Technica ATH-M50x Headphones", desc: "Professional studio monitors. Amazing sound quality.", price: 6000, cat: "electronics", cond: "good" },
    { idx: 8, title: "Drafting Kit - Complete Set", desc: "T-square, set squares, compass, protractor, scale. Leather case.", price: 1200, cat: "stationery", cond: "good" },
    { idx: 5, title: "Raspberry Pi 4 (4GB) + Accessories Kit", desc: "Case, power supply, 32GB SD card, heatsinks. Perfect for IoT.", price: 4000, cat: "electronics", cond: "like_new" },
    { idx: 9, title: "Yoga Mat + Block Set", desc: "Premium 6mm mat with cork block. Non-slip surface.", price: 900, cat: "sports", cond: "new" },
    { idx: 6, title: "Study Desk Lamp - LED Adjustable", desc: "USB rechargeable, 3 brightness levels.", price: 500, cat: "furniture", cond: "like_new" },
  ];
  for (const m of marketplace) {
    if (!createdIds[m.idx]) continue;
    await supabaseAdmin.from("marketplace_posts").insert({ user_id: createdIds[m.idx], university_id: uniId, title: m.title, description: m.desc, price: m.price, category: m.cat, condition: m.cond });
  }

  // Step 8: Local services
  const services = [
    { name: "Campus Quick Laundry", desc: "Same-day laundry and dry cleaning. Hostel pickup & delivery.", cat: "laundry", addr: "Gate 2, Near BH-3, LPU Campus", phone: "9876543210", rating: 4.5, reviews: 128 },
    { name: "Sharma Ji ka Dhaba", desc: "Authentic North Indian food at student-friendly prices. Famous butter chicken!", cat: "food", addr: "Phagwara Main Road, Near Gate 1", phone: "9876543211", rating: 4.7, reviews: 256 },
    { name: "PrintHub Express", desc: "Printing, photocopying, spiral binding, lamination. Assignment specialists!", cat: "printing", addr: "Block 34, Ground Floor", phone: "9876543212", rating: 4.3, reviews: 89 },
    { name: "FitZone Gym", desc: "Fully equipped gym with personal training. Student discount with LPU ID.", cat: "fitness", addr: "Near LPU Gate 3", phone: "9876543213", rating: 4.6, reviews: 167 },
    { name: "TechFix Mobile Repair", desc: "Screen replacement, battery change, software issues. 30-day warranty.", cat: "repair", addr: "Uni Mall, Shop 12", phone: "9876543214", rating: 4.4, reviews: 95 },
    { name: "South Express Tiffin Service", desc: "Daily South Indian tiffin delivery to hostels. Taste of home!", cat: "food", addr: "Delivery only - Phagwara", phone: "9876543215", rating: 4.8, reviews: 312 },
    { name: "Style Studio Salon", desc: "Haircuts, styling, facials. 20% student discount on weekdays.", cat: "salon", addr: "Near Gate 1, Phagwara Road", phone: "9876543216", rating: 4.2, reviews: 74 },
    { name: "RideShare LPU", desc: "Bike and scooty rental. Daily, weekly, and monthly plans.", cat: "transport", addr: "Gate 2, LPU Campus", phone: "9876543217", rating: 4.1, reviews: 53 },
    { name: "BookWorm Stationery", desc: "All stationery, lab manuals, drawing sheets, engineering supplies.", cat: "stationery", addr: "Block 38, Near Canteen", phone: "9876543218", rating: 4.5, reviews: 142 },
    { name: "MediCare Pharmacy", desc: "24/7 pharmacy. Home delivery available. All prescription and OTC medicines.", cat: "pharmacy", addr: "Opposite Gate 1", phone: "9876543219", rating: 4.6, reviews: 198 },
  ];
  for (const s of services) {
    await supabaseAdmin.from("local_services").insert({ university_id: uniId, name: s.name, description: s.desc, category: s.cat, address: s.addr, phone: s.phone, rating: s.rating, reviews_count: s.reviews, is_verified: true, is_admin_approved: true });
  }

  // Step 9: Housing listings
  const housing = [
    { idx: 2, title: "Spacious 1BHK Near Gate 1", desc: "Fully furnished with AC, geyser, attached bathroom. 5 min walk from Gate 1.", type: "roommate", price: 8000, loc: "Near Gate 1", room: "single", gender: "male", amenities: ["WiFi","AC","Geyser","Attached Bathroom","Furnished"] },
    { idx: 8, title: "Shared Room - Budget Friendly", desc: "Looking for a roommate. Includes bed, table, chair, wardrobe.", type: "roommate", price: 4500, loc: "Near Gate 3", room: "shared", gender: "male", amenities: ["WiFi","Meals Included","Laundry","Study Table"] },
    { idx: 1, title: "Girls PG - Premium Room Available", desc: "Safe girls PG with home-cooked meals. CCTV, biometric lock, warden.", type: "roommate", price: 7500, loc: "Near Gate 2", room: "single", gender: "female", amenities: ["WiFi","AC","Meals","CCTV","Warden","Hot Water"] },
    { idx: 4, title: "2BHK Flat for Sharing - 4 Students", desc: "Spacious 2BHK. Two bedrooms with attached baths. Kitchen available.", type: "roommate", price: 5000, loc: "Phagwara City", room: "shared", gender: "male", amenities: ["WiFi","Kitchen","2 Bathrooms","Parking","Balcony"] },
    { idx: 9, title: "Single Room - Quiet Study Environment", desc: "Quiet neighborhood. Includes study table and bookshelf.", type: "roommate", price: 6000, loc: "Near Gate 1", room: "single", gender: "female", amenities: ["WiFi","Study Table","Bookshelf","Quiet Zone","Power Backup"] },
  ];
  for (const h of housing) {
    if (!createdIds[h.idx]) continue;
    await supabaseAdmin.from("housing_listings").insert({ user_id: createdIds[h.idx], university_id: uniId, title: h.title, description: h.desc, listing_type: h.type, price: h.price, location: h.loc, room_type: h.room, gender_preference: h.gender, amenities: h.amenities });
  }

  return new Response(JSON.stringify({
    success: true,
    users_created: createdIds.length,
    posts_created: postIds.length,
    errors,
    message: "Demo data created! All users have password: Demo123!"
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
