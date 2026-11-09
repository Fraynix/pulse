import { createClient } from '@supabase/supabase-js';

// Credentials come from the environment — never commit them.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DEMO_PASSWORD) {
  console.error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_PASSWORD before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// --- Helpers ---
const TODAY = new Date('2026-04-10T12:00:00+02:00');
function daysAgo(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d;
}
function isoAt(date, hour = 9, minute = 0) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function randomBetween(min, max) {
  return +(min + Math.random() * (max - min)).toFixed(2);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function uuid() { return crypto.randomUUID(); }

const stats = { created: {}, skipped: {}, warned: {} };
function log(action, detail) { console.log(`  [${action}] ${detail}`); }
function warn(table, msg) {
  stats.warned[table] = (stats.warned[table] || 0) + 1;
  console.warn(`  ⚠ [${table}] ${msg}`);
}

async function safeInsert(table, data, opts = {}) {
  const { data: result, error } = opts.onConflict
    ? await supabase.from(table).upsert(data, { onConflict: opts.onConflict }).select()
    : await supabase.from(table).insert(data).select();
  if (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      warn(table, `Table does not exist — skipping`);
      return null;
    }
    if (error.message?.includes('duplicate') || error.code === '23505') {
      log('EXISTS', `${table}: duplicate — skipping`);
      stats.skipped[table] = (stats.skipped[table] || 0) + 1;
      return null;
    }
    warn(table, `Insert error: ${error.message}`);
    return null;
  }
  stats.created[table] = (stats.created[table] || 0) + (Array.isArray(data) ? data.length : 1);
  return Array.isArray(result) ? result : [result];
}

// ============================================================
// 1. USERS — create or find existing
// ============================================================
console.log('\n=== 1. USERS ===');

const allUsers = [
  // Coaches
  { email: 'marie.martin@demo.coach', password: DEMO_PASSWORD, first_name: 'Marie', last_name: 'Martin', role: 'coach' },
  { email: 'julien.dupont@demo.coach', password: DEMO_PASSWORD, first_name: 'Julien', last_name: 'Dupont', role: 'coach' },
  { email: 'sarah.benali@demo.coach', password: DEMO_PASSWORD, first_name: 'Sarah', last_name: 'Benali', role: 'coach' },
  { email: 'thomas.roux@demo.coach', password: DEMO_PASSWORD, first_name: 'Thomas', last_name: 'Roux', role: 'coach' },
  { email: 'amelie.garcia@demo.coach', password: DEMO_PASSWORD, first_name: 'Amélie', last_name: 'Garcia', role: 'coach' },
  // Athletes
  { email: 'lucas.petit@demo.athlete', password: DEMO_PASSWORD, first_name: 'Lucas', last_name: 'Petit', role: 'athlete' },
  { email: 'emma.blanc@demo.athlete', password: DEMO_PASSWORD, first_name: 'Emma', last_name: 'Blanc', role: 'athlete' },
  { email: 'adam.morel@demo.athlete', password: DEMO_PASSWORD, first_name: 'Adam', last_name: 'Morel', role: 'athlete' },
  { email: 'chloe.duval@demo.athlete', password: DEMO_PASSWORD, first_name: 'Chloé', last_name: 'Duval', role: 'athlete' },
  { email: 'hugo.leroy@demo.athlete', password: DEMO_PASSWORD, first_name: 'Hugo', last_name: 'Leroy', role: 'athlete' },
  // Admin
  { email: 'admin@oikos.one', password: DEMO_PASSWORD, first_name: 'Admin', last_name: 'OIKOS', role: 'admin' },
  // Dimitri — the demo user (coach + athlete)
  { email: 'dimitri@coaching-app.fr', password: DEMO_PASSWORD, first_name: 'Dimitri', last_name: 'K.', role: 'both' },
];

const userIds = {};

// Pre-fetch all existing users
const { data: existingUsersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
const existingUsersMap = {};
for (const u of existingUsersData?.users || []) {
  existingUsersMap[u.email] = u.id;
}

for (const u of allUsers) {
  // Check if user already exists
  if (existingUsersMap[u.email]) {
    userIds[u.email] = existingUsersMap[u.email];
    log('EXISTS', `User ${u.email} → ${existingUsersMap[u.email]}`);
  } else {
    // Create new user
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: `${u.first_name} ${u.last_name}`, role: u.role },
    });

    if (created?.user) {
      userIds[u.email] = created.user.id;
      log('CREATED', `User ${u.email} → ${created.user.id}`);
    } else {
      warn('auth', `Cannot create ${u.email}: ${error?.message}`);
      continue;
    }
  }

  // Update profile
  await supabase.from('profiles').upsert({
    id: userIds[u.email],
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
    role: u.role,
    city: 'Paris',
    postal_code: '75011',
    lat: 48.8566 + (Math.random() - 0.5) * 0.02,
    lng: 2.3522 + (Math.random() - 0.5) * 0.02,
  }, { onConflict: 'id' });
}

const DIMITRI = userIds['dimitri@coaching-app.fr'];
if (!DIMITRI) { console.error('FATAL: Cannot find/create Dimitri. Aborting.'); process.exit(1); }
console.log(`  Dimitri ID: ${DIMITRI}`);

// ============================================================
// 2. COACH PROFILES
// ============================================================
console.log('\n=== 2. COACH PROFILES ===');

const coachDefs = [
  { email: 'marie.martin@demo.coach', bio: 'Coach CrossFit certifiée, 8 ans d\'expérience. Spécialisée dans la préparation physique et la perte de poids.', specialties: ['CrossFit', 'Préparation physique', 'Perte de poids'], rate: 55, lat: 48.8566, lng: 2.3522 },
  { email: 'julien.dupont@demo.coach', bio: 'Coach musculation et fitness. Ancien athlète de haut niveau, passionné par la progression de ses élèves.', specialties: ['Musculation', 'Fitness', 'Coaching en ligne'], rate: 45, lat: 48.8606, lng: 2.3376 },
  { email: 'sarah.benali@demo.coach', bio: 'Professeure de yoga et méditation. Approche holistique du bien-être, bienveillance et exigence.', specialties: ['Yoga', 'Méditation', 'Pilates', 'Bien-être'], rate: 60, lat: 48.8534, lng: 2.3488 },
  { email: 'thomas.roux@demo.coach', bio: 'Coach running et trail. Préparation marathon et plans personnalisés. 3x finisher UTMB.', specialties: ['Running', 'Trail', 'Endurance'], rate: 40, lat: 48.8738, lng: 2.2950 },
  { email: 'amelie.garcia@demo.coach', bio: 'Coach boxe et self-défense. Cours fun et intensifs, tous niveaux bienvenus.', specialties: ['Boxe', 'Self-défense', 'Cardio', 'HIIT'], rate: 50, lat: 48.8462, lng: 2.3572 },
];

const coachProfileIds = {};

for (const c of coachDefs) {
  const userId = userIds[c.email];
  if (!userId) continue;

  // Check if coach profile exists
  const { data: existing } = await supabase.from('coach_profiles').select('id').eq('user_id', userId).single();
  if (existing) {
    coachProfileIds[c.email] = existing.id;
    log('EXISTS', `Coach ${c.email}`);
    continue;
  }

  const { data, error } = await supabase.from('coach_profiles').insert({
    user_id: userId,
    bio: c.bio,
    specialties: c.specialties,
    hourly_rate: c.rate,
    lat: c.lat,
    lng: c.lng,
    radius: 20,
    is_verified: true,
    avg_rating: +(3.8 + Math.random() * 1.2).toFixed(1),
    total_sessions: Math.floor(50 + Math.random() * 150),
  }).select('id').single();

  if (error) { warn('coach_profiles', `${c.email}: ${error.message}`); continue; }
  coachProfileIds[c.email] = data.id;
  log('CREATED', `Coach ${c.email} → ${data.id}`);
}

// ============================================================
// 3. SESSION TEMPLATES
// ============================================================
console.log('\n=== 3. SESSION TEMPLATES ===');

const templateDefs = [
  { coach: 'marie.martin@demo.coach', title: 'CrossFit Débutant', sport: 'crossfit', desc: 'Initiation au CrossFit. Mouvements de base et WOD adapté.', level: 'beginner', type: 'individual', duration: 60, price: 55 },
  { coach: 'marie.martin@demo.coach', title: 'CrossFit Avancé', sport: 'crossfit', desc: 'WOD intense, technique haltérophile, compétition.', level: 'advanced', type: 'individual', duration: 75, price: 65 },
  { coach: 'julien.dupont@demo.coach', title: 'Musculation Complète', sport: 'musculation', desc: 'Programme push/pull/legs adapté à vos objectifs.', level: 'all', type: 'individual', duration: 60, price: 45 },
  { coach: 'julien.dupont@demo.coach', title: 'Bilan Forme', sport: 'musculation', desc: 'Évaluation complète : composition corporelle, force, mobilité.', level: 'beginner', type: 'individual', duration: 90, price: 70 },
  { coach: 'sarah.benali@demo.coach', title: 'Yoga Vinyasa', sport: 'yoga', desc: 'Flow dynamique, souffle et souplesse.', level: 'all', type: 'individual', duration: 60, price: 60 },
  { coach: 'sarah.benali@demo.coach', title: 'Méditation Guidée', sport: 'yoga', desc: 'Méditation pleine conscience, gestion du stress.', level: 'beginner', type: 'individual', duration: 45, price: 40 },
  { coach: 'sarah.benali@demo.coach', title: 'Yoga Collectif', sport: 'yoga', desc: 'Yoga en groupe (max 8), ambiance conviviale.', level: 'all', type: 'group', duration: 75, price: 20 },
  { coach: 'thomas.roux@demo.coach', title: 'Plan Marathon', sport: 'running', desc: 'Programme personnalisé marathon, fractionné et endurance.', level: 'advanced', type: 'individual', duration: 60, price: 40 },
  { coach: 'thomas.roux@demo.coach', title: 'Sortie Trail', sport: 'running', desc: 'Sortie nature, technique de descente et gestion de l\'effort.', level: 'all', type: 'group', duration: 120, price: 25 },
  { coach: 'amelie.garcia@demo.coach', title: 'Boxe Initiation', sport: 'boxe', desc: 'Bases : garde, jab, direct, esquive, travail au sac.', level: 'beginner', type: 'individual', duration: 60, price: 50 },
  { coach: 'amelie.garcia@demo.coach', title: 'HIIT Boxing', sport: 'boxe', desc: 'Cardio intense avec sac de frappe. 800+ kcal garanties.', level: 'all', type: 'group', duration: 45, price: 25 },
];

const templateIds = {};

for (const t of templateDefs) {
  const coachId = coachProfileIds[t.coach];
  if (!coachId) continue;

  // Check existing
  const { data: existing } = await supabase.from('session_templates').select('id').eq('coach_id', coachId).eq('title', t.title).single();
  if (existing) {
    templateIds[t.title] = existing.id;
    log('EXISTS', `Template: ${t.title}`);
    continue;
  }

  const { data, error } = await supabase.from('session_templates').insert({
    coach_id: coachId,
    title: t.title,
    sport: t.sport,
    description: t.desc,
    level: t.level,
    type: t.type,
    duration: t.duration,
    price: t.price,
    max_participants: t.type === 'group' ? 8 : 1,
    is_active: true,
  }).select('id').single();

  if (error) { warn('session_templates', `${t.title}: ${error.message}`); continue; }
  templateIds[t.title] = data.id;
  log('CREATED', `Template: ${t.title}`);
}

// ============================================================
// 4. AVAILABILITY SLOTS
// ============================================================
console.log('\n=== 4. AVAILABILITY ===');

for (const c of coachDefs) {
  const coachId = coachProfileIds[c.email];
  if (!coachId) continue;

  // Check if already has slots
  const { data: existing } = await supabase.from('availability_slots').select('id').eq('coach_id', coachId).limit(1);
  if (existing?.length > 0) {
    log('EXISTS', `Availability for ${c.email}`);
    continue;
  }

  for (let day = 1; day <= 5; day++) { // Mon-Fri
    await safeInsert('availability_slots', {
      coach_id: coachId,
      day_of_week: day,
      start_time: '09:00',
      end_time: '18:00',
      is_active: true,
    });
  }
  // Saturday morning
  await safeInsert('availability_slots', {
    coach_id: coachId,
    day_of_week: 6,
    start_time: '09:00',
    end_time: '13:00',
    is_active: true,
  });
  log('CREATED', `Availability for ${c.email}`);
}

// ============================================================
// 5. EVENTS
// ============================================================
console.log('\n=== 5. EVENTS ===');

const eventDefs = [
  { title: 'Bootcamp CrossFit — Champ de Mars', desc: 'CrossFit gratuit en plein air. Tous niveaux, venez nombreux !', type: 'platform', date: '2026-04-20T09:00:00+02:00', address: 'Champ de Mars, Paris 7e', lat: 48.8584, lng: 2.2945, slotsCoach: 3, slotsAthlete: 30, price: 0, sport: 'CrossFit', level: 'all', status: 'open' },
  { title: 'Yoga Sunrise au Trocadéro', desc: 'Yoga au lever du soleil face à la Tour Eiffel.', type: 'platform', date: '2026-04-25T06:30:00+02:00', address: 'Trocadéro, Paris 16e', lat: 48.8625, lng: 2.2884, slotsCoach: 2, slotsAthlete: 50, price: 0, sport: 'Yoga', level: 'all', status: 'open' },
  { title: '10km du Bois de Boulogne', desc: 'Course communautaire, parcours boisé, ravitaillement inclus.', type: 'platform', date: '2026-05-10T08:00:00+02:00', address: 'Bois de Boulogne, Paris 16e', lat: 48.8628, lng: 2.2514, slotsCoach: 5, slotsAthlete: 100, price: 5, sport: 'Running', level: 'all', status: 'open' },
  { title: 'Workshop Boxe & Self-Défense', desc: 'Atelier 3h : boxe, self-défense, gestion du stress.', type: 'partner', date: '2026-05-03T14:00:00+02:00', address: 'Salle Fight Club, Paris 11e', lat: 48.8590, lng: 2.3789, slotsCoach: 2, slotsAthlete: 20, price: 25, sport: 'Boxe', level: 'beginner', status: 'open' },
];

const eventIds = [];

for (const ev of eventDefs) {
  const { data: existing } = await supabase.from('events').select('id').eq('title', ev.title).single();
  if (existing) {
    eventIds.push(existing.id);
    log('EXISTS', `Event: ${ev.title}`);
    continue;
  }

  const result = await safeInsert('events', {
    title: ev.title, description: ev.desc, type: ev.type, date: ev.date,
    address: ev.address, lat: ev.lat, lng: ev.lng, slots_coach: ev.slotsCoach,
    slots_athlete: ev.slotsAthlete, price: ev.price, sport: ev.sport,
    level: ev.level, status: ev.status,
  });
  if (result?.[0]) {
    eventIds.push(result[0].id);
    log('CREATED', `Event: ${ev.title}`);
  }
}

// Register Dimitri for first 2 events
for (let i = 0; i < 2 && i < eventIds.length; i++) {
  await safeInsert('event_participants', {
    event_id: eventIds[i],
    user_id: DIMITRI,
    role: 'athlete',
    status: 'confirmed',
  });
  log('CREATED', `Dimitri registered for event ${i + 1}`);
}

// ============================================================
// 6. DIMITRI — BOOKINGS (8 completed with coaches)
// ============================================================
console.log('\n=== 6. DIMITRI BOOKINGS ===');

// Get all template IDs from DB
const { data: allTemplates } = await supabase.from('session_templates').select('id, coach_id, title, sport, duration, price');

const dimitriBookingDefs = [
  { templateTitle: 'CrossFit Débutant', daysAgo: 28 },
  { templateTitle: 'Musculation Complète', daysAgo: 25 },
  { templateTitle: 'Yoga Vinyasa', daysAgo: 21 },
  { templateTitle: 'Plan Marathon', daysAgo: 18 },
  { templateTitle: 'Boxe Initiation', daysAgo: 14 },
  { templateTitle: 'CrossFit Avancé', daysAgo: 10 },
  { templateTitle: 'HIIT Boxing', daysAgo: 7 },
  { templateTitle: 'Méditation Guidée', daysAgo: 3 },
];

const dimitriBookingIds = [];

for (const b of dimitriBookingDefs) {
  const tmpl = allTemplates?.find(t => t.title === b.templateTitle);
  if (!tmpl) { warn('bookings', `Template not found: ${b.templateTitle}`); continue; }

  const scheduledAt = daysAgo(b.daysAgo);
  scheduledAt.setHours(10 + Math.floor(Math.random() * 6), 0, 0, 0);
  const endAt = new Date(scheduledAt);
  endAt.setMinutes(endAt.getMinutes() + (tmpl.duration || 60));

  const result = await safeInsert('bookings', {
    session_template_id: tmpl.id,
    athlete_id: DIMITRI,
    coach_id: tmpl.coach_id,
    scheduled_at: scheduledAt.toISOString(),
    end_at: endAt.toISOString(),
    status: 'completed',
    location_type: 'on_site',
    address: 'Paris 11e',
  });
  if (result?.[0]) {
    dimitriBookingIds.push({ id: result[0].id, coach_id: tmpl.coach_id, sport: tmpl.sport, title: tmpl.title, date: scheduledAt });
    log('CREATED', `Booking: ${b.templateTitle} (${b.daysAgo}d ago)`);
  }
}

// ============================================================
// 7. DIMITRI — RATINGS on 4 bookings
// ============================================================
console.log('\n=== 7. DIMITRI RATINGS ===');

const ratingComments = [
  { score: 5, comment: 'Incroyable séance ! Marie est hyper motivante, j\'ai tout donné. Le CrossFit c\'est addictif.' },
  { score: 4, comment: 'Bon coaching, Julien maîtrise son sujet. Un peu trop de repos entre les séries à mon goût.' },
  { score: 5, comment: 'Sarah est exceptionnelle. Le Vinyasa était fluide, je me suis senti tellement bien après.' },
  { score: 5, comment: 'Thomas m\'a fait un plan marathon aux petits oignons. La progression est claire, j\'y crois !' },
];

for (let i = 0; i < 4 && i < dimitriBookingIds.length; i++) {
  const b = dimitriBookingIds[i];
  const r = ratingComments[i];

  await safeInsert('ratings', {
    booking_id: b.id,
    athlete_id: DIMITRI,
    coach_id: b.coach_id,
    score: r.score,
    comment: r.comment,
    is_anonymous: false,
  });
  log('CREATED', `Rating: ${r.score}★ on ${b.title}`);
}

// ============================================================
// 8. OTHER ATHLETES — BOOKINGS (lighter)
// ============================================================
console.log('\n=== 8. OTHER ATHLETES BOOKINGS ===');

const otherAthletes = [
  'lucas.petit@demo.athlete', 'emma.blanc@demo.athlete', 'adam.morel@demo.athlete',
  'chloe.duval@demo.athlete', 'hugo.leroy@demo.athlete',
];
const otherComments = [
  'Excellente séance, très pédagogique !',
  'Super coaching, bonne progression.',
  'Très bonne ambiance, on se sent à l\'aise.',
  'Exercices bien adaptés à mon niveau.',
  'Top ! Nouveau sport découvert et j\'adore.',
  'Professionnel et à l\'écoute. Je recommande.',
];

for (const email of otherAthletes) {
  const athleteId = userIds[email];
  if (!athleteId || !allTemplates?.length) continue;

  for (let i = 0; i < 3; i++) {
    const tmpl = allTemplates[Math.floor(Math.random() * allTemplates.length)];
    const scheduledAt = daysAgo(Math.floor(3 + Math.random() * 25));
    scheduledAt.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);
    const endAt = new Date(scheduledAt);
    endAt.setMinutes(endAt.getMinutes() + (tmpl.duration || 60));

    const result = await safeInsert('bookings', {
      session_template_id: tmpl.id,
      athlete_id: athleteId,
      coach_id: tmpl.coach_id,
      scheduled_at: scheduledAt.toISOString(),
      end_at: endAt.toISOString(),
      status: 'completed',
    });
    if (result?.[0]) {
      // Add a rating 60% of the time
      if (Math.random() > 0.4) {
        await safeInsert('ratings', {
          booking_id: result[0].id,
          athlete_id: athleteId,
          coach_id: tmpl.coach_id,
          score: Math.floor(3 + Math.random() * 3),
          comment: pick(otherComments),
          is_anonymous: Math.random() > 0.7,
        });
      }
    }
  }
  log('CREATED', `Bookings for ${email}`);
}

// ============================================================
// 9. DIMITRI — SOLO SESSIONS (18 sessions, last 30 days + 3 upcoming)
// ============================================================
console.log('\n=== 9. DIMITRI SOLO SESSIONS ===');

const soloSessionDefs = [
  // Past sessions (completed)
  { sport: 'running', title: 'Footing matinal — Buttes Chaumont', daysAgo: 29, duration: 45, completed: true, metrics: { distance_km: 7.2, avg_pace_min_km: 5.8, calories: 520, heart_rate_avg: 152 } },
  { sport: 'musculation', title: 'Push day — pecs & épaules', daysAgo: 28, duration: 55, completed: true, metrics: { exercises: 6, total_sets: 18, total_reps: 156, max_weight_kg: 80 } },
  { sport: 'yoga', title: 'Yoga flow — récupération', daysAgo: 26, duration: 40, completed: true, metrics: { flexibility_score: 6, calories: 180 } },
  { sport: 'running', title: 'Fractionné 6x800m', daysAgo: 25, duration: 50, completed: true, metrics: { distance_km: 8.5, avg_pace_min_km: 5.1, calories: 620, heart_rate_avg: 168 } },
  { sport: 'crossfit', title: 'WOD Murph (modifié)', daysAgo: 23, duration: 40, completed: true, metrics: { wod_time_seconds: 2280, reps_completed: 250, calories: 480 } },
  { sport: 'musculation', title: 'Pull day — dos & biceps', daysAgo: 21, duration: 50, completed: true, metrics: { exercises: 5, total_sets: 15, total_reps: 120, max_weight_kg: 85 } },
  { sport: 'running', title: 'Sortie longue — Canal Saint-Martin', daysAgo: 19, duration: 75, completed: true, metrics: { distance_km: 12.3, avg_pace_min_km: 5.9, calories: 780, heart_rate_avg: 145 } },
  { sport: 'boxe', title: 'Shadow boxing + sac', daysAgo: 17, duration: 35, completed: true, metrics: { rounds: 6, calories: 380 } },
  { sport: 'crossfit', title: 'WOD Fran', daysAgo: 16, duration: 25, completed: true, metrics: { wod_time_seconds: 285, reps_completed: 45, calories: 320 } },
  { sport: 'yoga', title: 'Yoga Ashtanga', daysAgo: 14, duration: 60, completed: true, metrics: { flexibility_score: 7, calories: 250 } },
  { sport: 'running', title: 'Footing récup — Tuileries', daysAgo: 12, duration: 35, completed: true, metrics: { distance_km: 5.5, avg_pace_min_km: 6.2, calories: 380, heart_rate_avg: 138 } },
  { sport: 'musculation', title: 'Legs day — squats & deadlifts', daysAgo: 10, duration: 60, completed: true, metrics: { exercises: 5, total_sets: 16, total_reps: 96, max_weight_kg: 100 } },
  { sport: 'crossfit', title: 'EMOM 20 min', daysAgo: 8, duration: 30, completed: true, metrics: { wod_time_seconds: 1200, reps_completed: 200, calories: 350 } },
  { sport: 'running', title: 'Tempo run 10K', daysAgo: 7, duration: 52, completed: true, metrics: { distance_km: 10.1, avg_pace_min_km: 5.15, calories: 650, heart_rate_avg: 162 } },
  { sport: 'boxe', title: 'Sparring léger + technique', daysAgo: 5, duration: 45, completed: true, metrics: { rounds: 8, calories: 520 } },
  { sport: 'running', title: '5K chrono — PB !', daysAgo: 3, duration: 24, completed: true, metrics: { distance_km: 5.0, avg_pace_min_km: 4.84, calories: 340, heart_rate_avg: 175 } },
  { sport: 'musculation', title: 'Push day — bench press focus', daysAgo: 1, duration: 50, completed: true, metrics: { exercises: 5, total_sets: 15, total_reps: 90, max_weight_kg: 85 } },
  { sport: 'yoga', title: 'Yin yoga — hanches & dos', daysAgo: 0, duration: 45, completed: true, metrics: { flexibility_score: 7.5, calories: 160 } },
  // Upcoming sessions (not completed)
  { sport: 'running', title: 'Sortie longue 15K — Vincennes', daysFromNow: 2, duration: 85, completed: false, metrics: { distance_km: 15, target_pace: 5.5 } },
  { sport: 'crossfit', title: 'WOD Hero — DT', daysFromNow: 4, duration: 35, completed: false, metrics: {} },
  { sport: 'boxe', title: 'Entraînement libre — sac', daysFromNow: 6, duration: 40, completed: false, metrics: {} },
];

const dimitriSoloIds = [];

for (const s of soloSessionDefs) {
  const scheduledDate = s.daysAgo !== undefined ? daysAgo(s.daysAgo) : daysFromNow(s.daysFromNow);
  scheduledDate.setHours(s.sport === 'running' ? 7 : s.sport === 'yoga' ? 19 : 18, 0, 0, 0);

  const result = await safeInsert('solo_sessions', {
    user_id: DIMITRI,
    sport: s.sport,
    title: s.title,
    duration_minutes: s.duration,
    scheduled_at: scheduledDate.toISOString(),
    completed: s.completed,
    notes: '',
    metrics: s.metrics,
  });
  if (result?.[0]) {
    dimitriSoloIds.push({ ...result[0], sport: s.sport, title: s.title, date: scheduledDate, metrics: s.metrics, completed: s.completed });
    log('CREATED', `Solo: ${s.title}`);
  }
}

// ============================================================
// 10. OTHER ATHLETES — SOLO SESSIONS (lighter)
// ============================================================
console.log('\n=== 10. OTHER ATHLETES SOLO SESSIONS ===');

const sportOptions = ['running', 'musculation', 'yoga', 'crossfit', 'boxe'];

for (const email of otherAthletes) {
  const athleteId = userIds[email];
  if (!athleteId) continue;

  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const sport = pick(sportOptions);
    const d = daysAgo(Math.floor(Math.random() * 20));
    d.setHours(7 + Math.floor(Math.random() * 12), 0, 0, 0);

    await safeInsert('solo_sessions', {
      user_id: athleteId,
      sport,
      title: `${sport.charAt(0).toUpperCase() + sport.slice(1)} — séance ${i + 1}`,
      duration_minutes: 30 + Math.floor(Math.random() * 60),
      scheduled_at: d.toISOString(),
      completed: true,
      metrics: sport === 'running'
        ? { distance_km: randomBetween(3, 12), avg_pace_min_km: randomBetween(5, 7), calories: Math.floor(200 + Math.random() * 500) }
        : { calories: Math.floor(200 + Math.random() * 400) },
    });
  }
  log('CREATED', `Solo sessions for ${email}`);
}

// ============================================================
// 11. DIMITRI — GOALS
// ============================================================
console.log('\n=== 11. DIMITRI GOALS ===');

const goalDefs = [
  { title: 'Courir un semi-marathon', type: 'performance', target_value: 21.1, current_value: 15.2, unit: 'km', deadline: '2026-06-01T00:00:00+02:00', status: 'active' },
  { title: '10 séances par mois', type: 'frequency', target_value: 10, current_value: 7, unit: 'séances/mois', deadline: null, status: 'active' },
  { title: 'Perdre 3kg', type: 'weight', target_value: 3, current_value: 1.8, unit: 'kg', deadline: '2026-05-15T00:00:00+02:00', status: 'active' },
];

for (const g of goalDefs) {
  await safeInsert('goals', {
    user_id: DIMITRI,
    title: g.title,
    type: g.type,
    target_value: g.target_value,
    current_value: g.current_value,
    unit: g.unit,
    deadline: g.deadline,
    status: g.status,
  });
  log('CREATED', `Goal: ${g.title}`);
}

// Other athletes — 1 goal each
for (const email of otherAthletes) {
  const athleteId = userIds[email];
  if (!athleteId) continue;
  await safeInsert('goals', {
    user_id: athleteId,
    title: pick(['Courir 5K en moins de 25 min', 'Faire du sport 3x/semaine', 'Perdre 5kg', 'Tenir une planche 3 min']),
    type: pick(['performance', 'frequency', 'weight']),
    target_value: pick([25, 3, 5, 3]),
    current_value: pick([18, 1, 2, 1.5]),
    unit: pick(['min', 'séances/semaine', 'kg', 'min']),
    status: 'active',
  });
}

// ============================================================
// 12. DIMITRI — JOURNAL ENTRIES (last 14 days)
// ============================================================
console.log('\n=== 12. DIMITRI JOURNAL ===');

// Training days map (which days had training based on solo sessions)
const trainingDays = new Set();
for (const s of soloSessionDefs) {
  if (s.completed && s.daysAgo !== undefined && s.daysAgo <= 14) {
    trainingDays.add(s.daysAgo);
  }
}

for (let dayOffset = 0; dayOffset <= 13; dayOffset++) {
  const date = daysAgo(dayOffset);
  const dateStr = date.toISOString().split('T')[0];
  const isWeekend = [0, 6].includes(date.getDay()); // Sun=0, Sat=6
  const hadTraining = trainingDays.has(dayOffset);
  const hadAlcohol = isWeekend && Math.random() > 0.4;
  const isPostAlcohol = isWeekend ? false : [1, 7].includes(date.getDay()) && Math.random() > 0.5; // Monday hangover?

  let sleepHours, sleepQuality, energy, stress, mood, caffeine;

  if (hadAlcohol || isPostAlcohol) {
    // Bad night after drinking
    sleepHours = randomBetween(4.5, 6);
    sleepQuality = pick([1, 2]);
    energy = pick([2, 3]);
    stress = pick([3, 4]);
    mood = pick([2, 3]);
    caffeine = pick([2, 3]);
  } else if (hadTraining) {
    // Good training day
    sleepHours = randomBetween(7, 8.5);
    sleepQuality = pick([3, 4, 5]);
    energy = pick([4, 5]);
    stress = pick([1, 2]);
    mood = pick([4, 5]);
    caffeine = pick([1, 2]);
  } else {
    // Rest day
    sleepHours = randomBetween(6.5, 8);
    sleepQuality = pick([3, 4]);
    energy = pick([3, 4]);
    stress = pick([2, 3]);
    mood = pick([3, 4]);
    caffeine = pick([1, 2]);
  }

  await safeInsert('journal_entries', {
    user_id: DIMITRI,
    date: dateStr,
    sleep_hours: sleepHours,
    sleep_quality: sleepQuality,
    energy_level: energy,
    stress_level: stress,
    mood,
    alcohol: hadAlcohol,
    caffeine_cups: caffeine,
    supplements: hadTraining ? ['protéines', 'créatine'] : [],
    notes: hadAlcohol ? 'Soirée entre amis, pas raisonnable...'
      : hadTraining ? ''
      : isWeekend ? 'Journée tranquille, repos actif' : '',
  });
  log('CREATED', `Journal: ${dateStr} (sleep=${sleepHours}h, energy=${energy})`);
}

// Some journal entries for other athletes
for (const email of otherAthletes.slice(0, 3)) {
  const athleteId = userIds[email];
  if (!athleteId) continue;
  for (let d = 0; d < 5; d++) {
    const date = daysAgo(d);
    await safeInsert('journal_entries', {
      user_id: athleteId,
      date: date.toISOString().split('T')[0],
      sleep_hours: randomBetween(6, 8.5),
      sleep_quality: pick([3, 4]),
      energy_level: pick([3, 4, 5]),
      stress_level: pick([1, 2, 3]),
      mood: pick([3, 4, 5]),
      alcohol: false,
      caffeine_cups: pick([0, 1, 2]),
    });
  }
}

// ============================================================
// 13. DIMITRI — PERSONAL RECORDS
// ============================================================
console.log('\n=== 13. DIMITRI PERSONAL RECORDS ===');

const prDefs = [
  { sport: 'running', metric_key: '5k_time', metric_label: '5K', value: 24.2, unit: 'min', daysAgo: 3 },
  { sport: 'running', metric_key: '10k_time', metric_label: '10K', value: 52.5, unit: 'min', daysAgo: 30 },
  { sport: 'musculation', metric_key: 'bench_press_1rm', metric_label: 'Bench Press 1RM', value: 85, unit: 'kg', daysAgo: 1 },
  { sport: 'crossfit', metric_key: 'fran_time', metric_label: 'Fran', value: 4.75, unit: 'min', daysAgo: 16 },
  { sport: 'boxe', metric_key: 'max_rounds', metric_label: 'Rounds consécutifs', value: 8, unit: 'rounds', daysAgo: 5 },
];

for (const pr of prDefs) {
  const { data: existing } = await supabase.from('personal_records')
    .select('id').eq('user_id', DIMITRI).eq('sport', pr.sport).eq('metric_key', pr.metric_key).single();

  if (existing) {
    log('EXISTS', `PR: ${pr.metric_label}`);
    continue;
  }

  await safeInsert('personal_records', {
    user_id: DIMITRI,
    sport: pr.sport,
    metric_key: pr.metric_key,
    metric_label: pr.metric_label,
    value: pr.value,
    unit: pr.unit,
    achieved_at: daysAgo(pr.daysAgo).toISOString(),
    source: 'pulse',
  });
  log('CREATED', `PR: ${pr.metric_label} = ${pr.value} ${pr.unit}`);
}

// ============================================================
// 14. DIMITRI — STREAK
// ============================================================
console.log('\n=== 14. DIMITRI STREAK ===');

await supabase.from('user_streaks').upsert({
  user_id: DIMITRI,
  current_streak: 5,
  longest_streak: 12,
  last_activity_date: TODAY.toISOString().split('T')[0],
  total_activities: 47,
}, { onConflict: 'user_id' });
log('UPSERT', 'Streak: current=5, longest=12, total=47');

// ============================================================
// 15. CHALLENGES
// ============================================================
console.log('\n=== 15. CHALLENGES ===');

const challengeDefs = [
  { title: 'Défi 100km Running — Avril', description: 'Cumulez 100 km de course à pied en avril. Tous les runs comptent !', type: 'distance', sport: 'running', target_value: 100, unit: 'km', start_date: '2026-04-01', end_date: '2026-04-30' },
  { title: '30 jours de sport', description: 'Faites du sport chaque jour pendant 30 jours. Toutes activités comptent.', type: 'frequency', sport: null, target_value: 30, unit: 'jours', start_date: '2026-04-01', end_date: '2026-04-30' },
  { title: 'Marathon de Yoga', description: '600 minutes de yoga en avril. Namaste !', type: 'duration', sport: 'yoga', target_value: 600, unit: 'minutes', start_date: '2026-04-01', end_date: '2026-04-30' },
];

const challengeIds = [];

for (const ch of challengeDefs) {
  const { data: existing } = await supabase.from('challenges').select('id').eq('title', ch.title).single();
  if (existing) {
    challengeIds.push(existing.id);
    log('EXISTS', `Challenge: ${ch.title}`);
    continue;
  }

  const result = await safeInsert('challenges', {
    title: ch.title,
    description: ch.description,
    type: ch.type,
    sport: ch.sport,
    target_value: ch.target_value,
    unit: ch.unit,
    start_date: ch.start_date,
    end_date: ch.end_date,
    is_global: true,
    created_by: DIMITRI,
  });
  if (result?.[0]) {
    challengeIds.push(result[0].id);
    log('CREATED', `Challenge: ${ch.title}`);
  }
}

// Register participants
const challengeParticipants = [
  // Dimitri — leading progress
  { email: 'dimitri@coaching-app.fr', values: [48.5, 10, 145] },
  // Others
  { email: 'lucas.petit@demo.athlete', values: [32, 7, 90] },
  { email: 'emma.blanc@demo.athlete', values: [55, 12, 280] },
  { email: 'adam.morel@demo.athlete', values: [21, 5, 60] },
];

for (const p of challengeParticipants) {
  const userId = userIds[p.email];
  if (!userId) continue;
  for (let i = 0; i < challengeIds.length; i++) {
    await safeInsert('challenge_participants', {
      challenge_id: challengeIds[i],
      user_id: userId,
      current_value: p.values[i] ?? 0,
    });
  }
  log('CREATED', `Challenge participant: ${p.email}`);
}

// ============================================================
// 16. FEED POSTS (auto-generated from activities)
// ============================================================
console.log('\n=== 16. FEED POSTS ===');

// Dimitri's solo sessions → feed
for (const s of dimitriSoloIds) {
  if (!s.completed) continue;

  const sportEmoji = { running: '🏃', musculation: '💪', yoga: '🧘', crossfit: '🏋️', boxe: '🥊' };
  const description = s.sport === 'running'
    ? `${s.metrics?.distance_km || '?'} km en ${s.duration_minutes} min`
    : s.sport === 'musculation'
    ? `${s.duration_minutes} min de muscu — max ${s.metrics?.max_weight_kg || '?'} kg`
    : `${s.duration_minutes} min de ${s.sport}`;

  await safeInsert('feed_posts', {
    user_id: DIMITRI,
    activity_type: 'solo_session',
    activity_id: s.id,
    sport: s.sport,
    title: s.title || `${sportEmoji[s.sport] || ''} ${s.sport}`,
    description,
    metrics: { duration_minutes: s.duration_minutes, ...s.metrics },
    created_at: s.scheduled_at || s.date?.toISOString(),
  });
}

// Dimitri's bookings → feed
for (const b of dimitriBookingIds) {
  await safeInsert('feed_posts', {
    user_id: DIMITRI,
    activity_type: 'booking',
    activity_id: b.id,
    sport: b.sport,
    title: `Coaching : ${b.title}`,
    description: `Séance avec un coach`,
    metrics: {},
    created_at: b.date?.toISOString(),
  });
}

log('CREATED', `Feed posts for Dimitri`);

// A few feed posts for other athletes
for (const email of otherAthletes.slice(0, 3)) {
  const athleteId = userIds[email];
  if (!athleteId) continue;
  for (let i = 0; i < 3; i++) {
    const sport = pick(sportOptions);
    const d = daysAgo(Math.floor(Math.random() * 14));
    await safeInsert('feed_posts', {
      user_id: athleteId,
      activity_type: 'solo_session',
      sport,
      title: `${sport.charAt(0).toUpperCase() + sport.slice(1)} du jour`,
      description: `${30 + Math.floor(Math.random() * 50)} min de ${sport}`,
      metrics: { duration_minutes: 30 + Math.floor(Math.random() * 50) },
      created_at: d.toISOString(),
    });
  }
}

// ============================================================
// SUMMARY
// ============================================================
console.log('\n╔══════════════════════════════════════╗');
console.log('║        SEED COMPLETE — PULSE         ║');
console.log('╠══════════════════════════════════════╣');
console.log('║ Demo user:                           ║');
console.log('║   dimitri@coaching-app.fr            ║');
console.log('║   (password: DEMO_PASSWORD)          ║');
console.log('╠══════════════════════════════════════╣');

for (const [table, count] of Object.entries(stats.created).sort()) {
  console.log(`║  ✅ ${table}: ${count} created`.padEnd(39) + '║');
}
for (const [table, count] of Object.entries(stats.skipped).sort()) {
  console.log(`║  ⏭  ${table}: ${count} skipped (exist)`.padEnd(39) + '║');
}
for (const [table, count] of Object.entries(stats.warned).sort()) {
  console.log(`║  ⚠  ${table}: ${count} warnings`.padEnd(39) + '║');
}

console.log('╠══════════════════════════════════════╣');
console.log('║ Users: 12 (5 coaches, 5 athletes,    ║');
console.log('║        1 admin, 1 Dimitri)           ║');
console.log('║ Dimitri data:                        ║');
console.log('║   18+ solo sessions, 8 bookings      ║');
console.log('║   4 ratings, 3 goals, 14 journal     ║');
console.log('║   5 PRs, streak, 3 challenges        ║');
console.log('║   2 event registrations, feed posts   ║');
console.log('╚══════════════════════════════════════╝');
