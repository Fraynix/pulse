import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.DEMO_PASSWORD) {
  console.error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_PASSWORD before running this script.');
  process.exit(1);
}
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
const c = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const userIds = {};
const coachMap = {};

// --- Users ---
const users = [
  { email: 'marie.martin@demo.coach', password: DEMO_PASSWORD, name: 'Marie Martin', role: 'coach' },
  { email: 'julien.dupont@demo.coach', password: DEMO_PASSWORD, name: 'Julien Dupont', role: 'coach' },
  { email: 'sarah.benali@demo.coach', password: DEMO_PASSWORD, name: 'Sarah Benali', role: 'coach' },
  { email: 'thomas.roux@demo.coach', password: DEMO_PASSWORD, name: 'Thomas Roux', role: 'coach' },
  { email: 'amelie.garcia@demo.coach', password: DEMO_PASSWORD, name: 'Amelie Garcia', role: 'coach' },
  { email: 'lucas.petit@demo.athlete', password: DEMO_PASSWORD, name: 'Lucas Petit', role: 'athlete' },
  { email: 'emma.blanc@demo.athlete', password: DEMO_PASSWORD, name: 'Emma Blanc', role: 'athlete' },
  { email: 'adam.morel@demo.athlete', password: DEMO_PASSWORD, name: 'Adam Morel', role: 'athlete' },
  { email: 'admin@oikos.one', password: DEMO_PASSWORD, name: 'Admin OIKOS', role: 'athlete' },
];

for (const u of users) {
  const { data, error } = await c.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { full_name: u.name, role: u.role },
  });
  if (error) { console.log('Skip:', u.email, error.message); continue; }
  userIds[u.email] = data.user.id;
  console.log('User:', u.email);

  await c.from('profiles').update({
    first_name: u.name.split(' ')[0],
    last_name: u.name.split(' ').slice(1).join(' '),
    role: u.role,
    city: 'Paris',
  }).eq('id', data.user.id);
}

// --- Coach profiles ---
const coaches = [
  { email: 'marie.martin@demo.coach', bio: 'Coach CrossFit certifiee, 8 ans d\'experience. Specialisee dans la preparation physique et la perte de poids.', specialties: ['CrossFit', 'Preparation physique', 'Perte de poids'], rate: 55, lat: 48.8566, lng: 2.3522 },
  { email: 'julien.dupont@demo.coach', bio: 'Coach musculation et fitness. Ancien athlete de haut niveau.', specialties: ['Musculation', 'Fitness', 'Coaching en ligne'], rate: 45, lat: 48.8606, lng: 2.3376 },
  { email: 'sarah.benali@demo.coach', bio: 'Professeure de yoga et meditation. Approche holistique du bien-etre.', specialties: ['Yoga', 'Meditation', 'Pilates', 'Bien-etre'], rate: 60, lat: 48.8534, lng: 2.3488 },
  { email: 'thomas.roux@demo.coach', bio: 'Coach running et trail. Preparation marathon et plans personnalises.', specialties: ['Running', 'Trail', 'Endurance'], rate: 40, lat: 48.8738, lng: 2.2950 },
  { email: 'amelie.garcia@demo.coach', bio: 'Coach boxe et self-defense. Cours fun et intensifs, tous niveaux.', specialties: ['Boxe', 'Self-defense', 'Cardio', 'HIIT'], rate: 50, lat: 48.8462, lng: 2.3572 },
];

for (const coach of coaches) {
  const userId = userIds[coach.email];
  if (!userId) continue;
  const { data, error } = await c.from('coach_profiles').insert({
    user_id: userId,
    bio: coach.bio,
    specialties: coach.specialties,
    hourly_rate: coach.rate,
    lat: coach.lat,
    lng: coach.lng,
    radius: 20,
    is_verified: true,
    avg_rating: +(3.5 + Math.random() * 1.5).toFixed(1),
    total_sessions: Math.floor(Math.random() * 150) + 10,
  }).select('id').single();
  if (error) { console.log('Coach error:', error.message); continue; }
  coachMap[userId] = data.id;
  console.log('Coach:', coach.email);
}

// --- Session templates ---
const templates = [
  { email: 'marie.martin@demo.coach', title: 'CrossFit Debutant', desc: 'Initiation au CrossFit. Mouvements de base.', level: 'discovery', type: 'one_on_one', duration: 60, price: 5500, tags: ['crossfit', 'debutant'] },
  { email: 'marie.martin@demo.coach', title: 'CrossFit Avance', desc: 'WOD intense, technique olympique.', level: 'advanced', type: 'one_on_one', duration: 75, price: 6500, tags: ['crossfit', 'avance'] },
  { email: 'julien.dupont@demo.coach', title: 'Musculation Complete', desc: 'Programme push/pull/legs adapte.', level: 'standard', type: 'one_on_one', duration: 60, price: 4500, tags: ['musculation'] },
  { email: 'julien.dupont@demo.coach', title: 'Bilan Forme', desc: 'Evaluation : composition corporelle, force, mobilite.', level: 'discovery', type: 'assessment', duration: 90, price: 7000, tags: ['bilan'] },
  { email: 'sarah.benali@demo.coach', title: 'Yoga Vinyasa', desc: 'Flow dynamique, souffle et souplesse.', level: 'standard', type: 'one_on_one', duration: 60, price: 6000, tags: ['yoga', 'vinyasa'] },
  { email: 'sarah.benali@demo.coach', title: 'Meditation Guidee', desc: 'Meditation pleine conscience.', level: 'discovery', type: 'one_on_one', duration: 45, price: 4000, tags: ['meditation'] },
  { email: 'sarah.benali@demo.coach', title: 'Yoga Collectif', desc: 'Yoga en groupe (max 8), ambiance conviviale.', level: 'standard', type: 'group', duration: 75, price: 2000, tags: ['yoga', 'groupe'] },
  { email: 'thomas.roux@demo.coach', title: 'Plan Marathon', desc: 'Programme personnalise marathon.', level: 'advanced', type: 'one_on_one', duration: 60, price: 4000, tags: ['running', 'marathon'] },
  { email: 'thomas.roux@demo.coach', title: 'Sortie Trail', desc: 'Sortie nature, technique de descente.', level: 'standard', type: 'group', duration: 120, price: 2500, tags: ['trail'] },
  { email: 'amelie.garcia@demo.coach', title: 'Boxe Initiation', desc: 'Bases : garde, jab, direct, esquive.', level: 'discovery', type: 'one_on_one', duration: 60, price: 5000, tags: ['boxe'] },
  { email: 'amelie.garcia@demo.coach', title: 'HIIT Boxing', desc: 'Cardio intense avec sac de frappe. 800+ kcal.', level: 'intensive', type: 'group', duration: 45, price: 2500, tags: ['hiit', 'boxe'] },
];

for (const t of templates) {
  const userId = userIds[t.email];
  const coachId = coachMap[userId];
  if (!coachId) continue;
  const { error } = await c.from('session_templates').insert({
    coach_id: coachId, title: t.title, description: t.desc,
    level: t.level, type: t.type, duration: t.duration, price: t.price,
  });
  if (error) console.log('Template error:', t.title, error.message);
  else console.log('Template:', t.title);
}

// --- Events ---
const events = [
  { title: 'Bootcamp CrossFit - Champ de Mars', desc: 'CrossFit gratuit en plein air. Tous niveaux !', type: 'platform', date: '2026-04-20T09:00:00+02:00', address: 'Champ de Mars, Paris 7e', lat: 48.8584, lng: 2.2945, slotsCoach: 3, slotsAthlete: 30, price: 0, sport: 'CrossFit', level: 'all', status: 'open' },
  { title: 'Yoga Sunrise au Trocadero', desc: 'Yoga au lever du soleil face a la Tour Eiffel.', type: 'platform', date: '2026-04-25T06:30:00+02:00', address: 'Trocadero, Paris 16e', lat: 48.8625, lng: 2.2884, slotsCoach: 2, slotsAthlete: 50, price: 0, sport: 'Yoga', level: 'all', status: 'open' },
  { title: '10km du Bois de Boulogne', desc: 'Course communautaire, parcours boise, ravitaillement.', type: 'platform', date: '2026-05-10T08:00:00+02:00', address: 'Bois de Boulogne, Paris 16e', lat: 48.8628, lng: 2.2514, slotsCoach: 5, slotsAthlete: 100, price: 500, sport: 'Running', level: 'standard', status: 'open' },
  { title: 'Workshop Boxe & Self-Defense', desc: 'Atelier 3h : boxe, self-defense, gestion du stress.', type: 'partner', date: '2026-05-03T14:00:00+02:00', address: 'Paris 11e', lat: 48.8590, lng: 2.3789, slotsCoach: 2, slotsAthlete: 20, price: 2500, sport: 'Boxe', level: 'discovery', status: 'open' },
];

for (const ev of events) {
  const { error } = await c.from('events').insert({
    title: ev.title, description: ev.desc, type: ev.type, date: ev.date,
    address: ev.address, lat: ev.lat, lng: ev.lng, slots_coach: ev.slotsCoach,
    slots_athlete: ev.slotsAthlete, price: ev.price, sport: ev.sport,
    level: ev.level, status: ev.status,
  });
  if (error) console.log('Event error:', ev.title, error.message);
  else console.log('Event:', ev.title);
}

// --- Bookings + Ratings ---
const { data: allTemplates } = await c.from('session_templates').select('id, coach_id');
const athleteEmails = ['lucas.petit@demo.athlete', 'emma.blanc@demo.athlete', 'adam.morel@demo.athlete'];
const comments = [
  'Excellente seance, tres pedagogique !',
  'Super coaching, bonne progression.',
  'Tres bonne ambiance, on se sent a l\'aise.',
  'Exercices bien adaptes a mon niveau.',
  'Top ! Nouveau sport decouvert et j\'adore.',
  'Professionnel et a l\'ecoute. Je recommande.',
  'Seance intense mais tres efficace.',
  'Parfait pour debuter, le coach explique bien.',
];

for (let i = 0; i < 8; i++) {
  const athleteId = userIds[athleteEmails[i % 3]];
  const tmpl = allTemplates[i % allTemplates.length];
  if (!athleteId || !tmpl) continue;

  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() - (i + 1) * 3);
  const endAt = new Date(scheduledAt);
  endAt.setHours(endAt.getHours() + 1);

  const { data: booking, error: bErr } = await c.from('bookings').insert({
    session_template_id: tmpl.id, athlete_id: athleteId, coach_id: tmpl.coach_id,
    scheduled_at: scheduledAt.toISOString(), end_at: endAt.toISOString(), status: 'completed',
  }).select('id').single();
  if (bErr) { console.log('Booking error:', bErr.message); continue; }

  await c.from('ratings').insert({
    booking_id: booking.id, athlete_id: athleteId, coach_id: tmpl.coach_id,
    score: Math.floor(Math.random() * 2) + 4, comment: comments[i], is_anonymous: i % 4 === 0,
  });
  console.log('Booking + Rating:', i + 1);
}

// --- Availability (Mon-Fri 9h-18h) ---
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
for (const email of coaches.map(c => c.email)) {
  const userId = userIds[email];
  const coachId = coachMap[userId];
  if (!coachId) continue;
  for (const day of days) {
    await c.from('availability').insert({
      coach_id: coachId, day_of_week: day, start_time: '09:00', end_time: '18:00', is_recurring: true,
    });
  }
  console.log('Availability:', email);
}

console.log('\n=== SEED COMPLETE ===');
console.log('Admin: admin@oikos.one (password: DEMO_PASSWORD)');
console.log('Coaches: 5 (verified, Paris)');
console.log('Athletes: 3');
console.log('Templates: 11 | Events: 4 | Bookings: 8 | Ratings: 8');
