import postgres from 'postgres';

const sql = postgres(
  process.env.DATABASE_URL ?? (() => { throw new Error('Set DATABASE_URL'); })(),
  { ssl: 'require' }
);

// ── 15 Strength exercises from VIVO catalog ──────────────────────────────────
const STRENGTH = [
  {
    name: 'Squat', name_en: 'Squat', sport: 'musculation', category: 'compound',
    muscle_engagement: { quadriceps: 90, glutes: 85, hamstrings: 60, core: 50 },
    tendon_stress: { patellar: 75 },
    joint_impact: { knees: 80, hips: 60, lumbar_spine: 50 },
  },
  {
    name: 'Soulevé de terre', name_en: 'Deadlift', sport: 'musculation', category: 'compound',
    muscle_engagement: { hamstrings: 85, glutes: 80, lower_back: 90, forearms: 60 },
    tendon_stress: { achilles: 40 },
    joint_impact: { hips: 70, lumbar_spine: 80, knees: 40 },
  },
  {
    name: 'Développé couché', name_en: 'Bench Press', sport: 'musculation', category: 'compound',
    muscle_engagement: { chest: 90, triceps: 75, shoulders: 60 },
    tendon_stress: { pec_tendon: 60 },
    joint_impact: { shoulders: 65, elbows: 50, wrists: 30 },
  },
  {
    name: 'Tractions', name_en: 'Pull-up', sport: 'musculation', category: 'compound',
    muscle_engagement: { upper_back: 90, biceps: 75, forearms: 70 },
    tendon_stress: { biceps_tendon: 60 },
    joint_impact: { shoulders: 55, elbows: 45 },
  },
  {
    name: 'Gainage', name_en: 'Plank', sport: 'musculation', category: 'isolation',
    muscle_engagement: { core: 90, shoulders: 40, glutes: 30 },
    tendon_stress: {},
    joint_impact: { lumbar_spine: 20, shoulders: 15 },
  },
  {
    name: 'Développé militaire', name_en: 'Overhead Press', sport: 'musculation', category: 'compound',
    muscle_engagement: { shoulders: 90, triceps: 70, core: 40 },
    tendon_stress: { rotator_cuff: 65 },
    joint_impact: { shoulders: 75, elbows: 40, wrists: 25 },
  },
  {
    name: 'Fentes', name_en: 'Lunges', sport: 'musculation', category: 'compound',
    muscle_engagement: { quadriceps: 85, glutes: 80, hamstrings: 55, core: 35 },
    tendon_stress: { patellar: 65 },
    joint_impact: { knees: 75, hips: 55, ankles: 40 },
  },
  {
    name: 'Rowing', name_en: 'Rows', sport: 'musculation', category: 'compound',
    muscle_engagement: { upper_back: 85, biceps: 65, forearms: 55 },
    tendon_stress: { biceps_tendon: 45 },
    joint_impact: { shoulders: 40, elbows: 35 },
  },
  {
    name: 'Presse à cuisses', name_en: 'Leg Press', sport: 'musculation', category: 'compound',
    muscle_engagement: { quadriceps: 90, glutes: 75, hamstrings: 50 },
    tendon_stress: { patellar: 55 },
    joint_impact: { knees: 70, hips: 45 },
  },
  {
    name: 'Mollets', name_en: 'Calf Raise', sport: 'musculation', category: 'isolation',
    muscle_engagement: { calves: 95, glutes: 10 },
    tendon_stress: { achilles: 70 },
    joint_impact: { ankles: 50 },
  },
  {
    name: 'Dips', name_en: 'Dips', sport: 'musculation', category: 'compound',
    muscle_engagement: { chest: 75, triceps: 85, shoulders: 55 },
    tendon_stress: { pec_tendon: 50 },
    joint_impact: { shoulders: 60, elbows: 55 },
  },
  {
    name: 'Soulevé jambes tendues', name_en: 'Romanian Deadlift', sport: 'musculation', category: 'compound',
    muscle_engagement: { hamstrings: 90, glutes: 75, lower_back: 70 },
    tendon_stress: { achilles: 35 },
    joint_impact: { hips: 65, lumbar_spine: 60 },
  },
  {
    name: 'Relevé de bassin', name_en: 'Hip Thrust', sport: 'musculation', category: 'isolation',
    muscle_engagement: { glutes: 95, hamstrings: 55, core: 35 },
    tendon_stress: {},
    joint_impact: { hips: 50, lumbar_spine: 30 },
  },
  {
    name: 'Tirage visage', name_en: 'Face Pull', sport: 'musculation', category: 'isolation',
    muscle_engagement: { upper_back: 70, shoulders: 60 },
    tendon_stress: { rotator_cuff: 40 },
    joint_impact: { shoulders: 35, elbows: 25 },
  },
  {
    name: 'Planche abdominale', name_en: 'Crunch', sport: 'musculation', category: 'isolation',
    muscle_engagement: { core: 85, hip_flexors: 40 },
    tendon_stress: {},
    joint_impact: { lumbar_spine: 35 },
  },
];

// ── CrossFit exercises ───────────────────────────────────────────────────────
const CROSSFIT = [
  {
    name: 'Burpees', name_en: 'Burpees', sport: 'crossfit', category: 'compound',
    muscle_engagement: { quadriceps: 70, chest: 60, shoulders: 55, core: 65 },
    tendon_stress: { patellar: 50, achilles: 45 },
    joint_impact: { knees: 60, wrists: 45, shoulders: 40 },
  },
  {
    name: 'Box jumps', name_en: 'Box Jumps', sport: 'crossfit', category: 'compound',
    muscle_engagement: { quadriceps: 80, glutes: 75, calves: 65, core: 40 },
    tendon_stress: { patellar: 65, achilles: 60 },
    joint_impact: { knees: 70, ankles: 55 },
  },
  {
    name: 'Thrusters', name_en: 'Thrusters', sport: 'crossfit', category: 'compound',
    muscle_engagement: { quadriceps: 85, shoulders: 80, triceps: 65, core: 60 },
    tendon_stress: { patellar: 60, rotator_cuff: 50 },
    joint_impact: { knees: 65, shoulders: 60, wrists: 40 },
  },
  {
    name: 'Wall balls', name_en: 'Wall Balls', sport: 'crossfit', category: 'compound',
    muscle_engagement: { quadriceps: 75, shoulders: 70, glutes: 65, core: 50 },
    tendon_stress: { patellar: 50 },
    joint_impact: { knees: 55, shoulders: 45 },
  },
  {
    name: 'Double-unders', name_en: 'Double Unders', sport: 'crossfit', category: 'cardio',
    muscle_engagement: { calves: 80, shoulders: 50, core: 40 },
    tendon_stress: { achilles: 65 },
    joint_impact: { ankles: 55, knees: 40 },
  },
  {
    name: 'Toes to bar', name_en: 'Toes to Bar', sport: 'crossfit', category: 'compound',
    muscle_engagement: { core: 90, hip_flexors: 75, forearms: 60 },
    tendon_stress: {},
    joint_impact: { shoulders: 45, lumbar_spine: 35 },
  },
  {
    name: 'Clean & jerk', name_en: 'Clean & Jerk', sport: 'crossfit', category: 'compound',
    muscle_engagement: { quadriceps: 85, glutes: 80, shoulders: 75, hamstrings: 70, core: 65 },
    tendon_stress: { patellar: 70, rotator_cuff: 55, achilles: 45 },
    joint_impact: { knees: 75, shoulders: 70, wrists: 55, hips: 50 },
  },
];

// ── Running exercises (using VIVO run discipline profile) ────────────────────
const RUN_PROFILE = {
  muscle_engagement: { quadriceps: 85, hamstrings: 75, calves: 80, glutes: 70, core: 40 },
  tendon_stress: { achilles: 80, patellar: 70, it_band: 65, plantar_fascia: 60 },
  joint_impact: { knees: 75, ankles: 70, hips: 50 },
};
const RUNNING = [
  { name: 'Course continue', name_en: 'Easy Run', sport: 'running', category: 'cardio', default_duration: 45, default_rpe: 4, ...RUN_PROFILE },
  { name: 'Fractionné', name_en: 'Interval Training', sport: 'running', category: 'cardio', default_duration: 40, default_rpe: 8, ...RUN_PROFILE },
  { name: 'Côtes (course)', name_en: 'Hill Repeats', sport: 'running', category: 'cardio', default_duration: 35, default_rpe: 8, ...RUN_PROFILE },
  { name: 'Tempo run', name_en: 'Tempo Run', sport: 'running', category: 'cardio', default_duration: 40, default_rpe: 7, ...RUN_PROFILE },
  { name: 'Récupération (course)', name_en: 'Recovery Run', sport: 'running', category: 'cardio', default_duration: 30, default_rpe: 3, ...RUN_PROFILE },
];

// ── Cycling exercises (using VIVO bike discipline profile) ───────────────────
const BIKE_PROFILE = {
  muscle_engagement: { quadriceps: 90, hamstrings: 60, calves: 50, glutes: 75, core: 30 },
  tendon_stress: { patellar: 60, it_band: 40 },
  joint_impact: { knees: 65, hips: 40, lumbar_spine: 35 },
};
const CYCLING = [
  { name: 'Sortie endurance', name_en: 'Endurance Ride', sport: 'cyclisme', category: 'cardio', default_duration: 90, default_rpe: 4, ...BIKE_PROFILE },
  { name: 'Intervalles (vélo)', name_en: 'Cycling Intervals', sport: 'cyclisme', category: 'cardio', default_duration: 60, default_rpe: 8, ...BIKE_PROFILE },
  { name: 'Côtes (vélo)', name_en: 'Hill Climbing', sport: 'cyclisme', category: 'cardio', default_duration: 60, default_rpe: 8, ...BIKE_PROFILE },
  { name: 'Tempo (vélo)', name_en: 'Tempo Ride', sport: 'cyclisme', category: 'cardio', default_duration: 60, default_rpe: 7, ...BIKE_PROFILE },
  { name: 'Récupération (vélo)', name_en: 'Recovery Ride', sport: 'cyclisme', category: 'cardio', default_duration: 45, default_rpe: 3, ...BIKE_PROFILE },
];

// ── Swimming exercises (using VIVO swim discipline profile) ──────────────────
const SWIM_PROFILE = {
  muscle_engagement: { shoulders: 85, upper_back: 80, core: 70, triceps: 65, chest: 60 },
  tendon_stress: { rotator_cuff: 80, biceps_tendon: 50 },
  joint_impact: { shoulders: 70, elbows: 30 },
};
const SWIMMING = [
  { name: 'Crawl continu', name_en: 'Continuous Freestyle', sport: 'natation', category: 'cardio', default_duration: 45, default_rpe: 5, ...SWIM_PROFILE },
  { name: 'Séries 100m', name_en: '100m Sets', sport: 'natation', category: 'cardio', default_duration: 40, default_rpe: 7, ...SWIM_PROFILE },
  { name: 'Dos', name_en: 'Backstroke', sport: 'natation', category: 'cardio', default_duration: 30, default_rpe: 5, ...SWIM_PROFILE },
  { name: 'Brasse', name_en: 'Breaststroke', sport: 'natation', category: 'cardio', default_duration: 30, default_rpe: 5, ...SWIM_PROFILE },
  { name: 'Éducatifs', name_en: 'Drills', sport: 'natation', category: 'cardio', default_duration: 30, default_rpe: 4, ...SWIM_PROFILE },
];

// ── Boxing exercises ─────────────────────────────────────────────────────────
const BOXING = [
  {
    name: 'Shadow boxing', name_en: 'Shadow Boxing', sport: 'boxe', category: 'cardio', default_duration: 15, default_rpe: 5,
    muscle_engagement: { shoulders: 75, core: 65, calves: 40 },
    tendon_stress: { rotator_cuff: 40 },
    joint_impact: { shoulders: 45, wrists: 35 },
  },
  {
    name: 'Sac lourd', name_en: 'Heavy Bag', sport: 'boxe', category: 'compound', default_duration: 20, default_rpe: 7,
    muscle_engagement: { shoulders: 80, chest: 65, core: 70, forearms: 60 },
    tendon_stress: { rotator_cuff: 55 },
    joint_impact: { shoulders: 55, wrists: 60, elbows: 45 },
  },
  {
    name: 'Corde à sauter', name_en: 'Jump Rope', sport: 'boxe', category: 'cardio', default_duration: 10, default_rpe: 6,
    muscle_engagement: { calves: 85, shoulders: 45, core: 40 },
    tendon_stress: { achilles: 65 },
    joint_impact: { ankles: 55, knees: 40 },
  },
  {
    name: "Pattes d'ours", name_en: 'Focus Mitts', sport: 'boxe', category: 'compound', default_duration: 15, default_rpe: 7,
    muscle_engagement: { shoulders: 80, core: 70, chest: 55 },
    tendon_stress: { rotator_cuff: 50 },
    joint_impact: { shoulders: 50, wrists: 55 },
  },
  {
    name: 'Sparring', name_en: 'Sparring', sport: 'boxe', category: 'compound', default_duration: 20, default_rpe: 9,
    muscle_engagement: { shoulders: 85, core: 75, quadriceps: 60, calves: 55 },
    tendon_stress: { rotator_cuff: 60, achilles: 40 },
    joint_impact: { shoulders: 65, wrists: 60, knees: 45 },
  },
];

// ── Yoga / Flexibility ───────────────────────────────────────────────────────
const YOGA = [
  {
    name: 'Salutation au soleil', name_en: 'Sun Salutation', sport: 'yoga', category: 'flexibility', default_duration: 15, default_rpe: 3,
    muscle_engagement: { core: 50, shoulders: 45, hamstrings: 40, quadriceps: 35 },
    tendon_stress: {},
    joint_impact: { wrists: 30, shoulders: 25 },
  },
  {
    name: 'Guerrier I', name_en: 'Warrior I', sport: 'yoga', category: 'flexibility', default_duration: 5, default_rpe: 3,
    muscle_engagement: { quadriceps: 60, glutes: 50, core: 40 },
    tendon_stress: {},
    joint_impact: { knees: 30, hips: 25 },
  },
  {
    name: 'Guerrier II', name_en: 'Warrior II', sport: 'yoga', category: 'flexibility', default_duration: 5, default_rpe: 3,
    muscle_engagement: { quadriceps: 55, glutes: 50, shoulders: 35 },
    tendon_stress: {},
    joint_impact: { knees: 30, hips: 25 },
  },
  {
    name: 'Chien tête en bas', name_en: 'Downward Dog', sport: 'yoga', category: 'flexibility', default_duration: 5, default_rpe: 3,
    muscle_engagement: { shoulders: 55, hamstrings: 50, calves: 45, core: 40 },
    tendon_stress: { achilles: 30 },
    joint_impact: { wrists: 40, shoulders: 30 },
  },
  {
    name: 'Pont (yoga)', name_en: 'Bridge Pose', sport: 'yoga', category: 'flexibility', default_duration: 5, default_rpe: 3,
    muscle_engagement: { glutes: 60, core: 45, hamstrings: 40 },
    tendon_stress: {},
    joint_impact: { lumbar_spine: 25 },
  },
];

// ── Fitness / General ────────────────────────────────────────────────────────
const FITNESS = [
  {
    name: 'Pompes', name_en: 'Push-ups', sport: 'fitness', category: 'compound',
    muscle_engagement: { chest: 80, triceps: 70, shoulders: 55, core: 45 },
    tendon_stress: { pec_tendon: 40 },
    joint_impact: { shoulders: 45, elbows: 35, wrists: 40 },
  },
  {
    name: 'Abdos', name_en: 'Sit-ups', sport: 'fitness', category: 'isolation',
    muscle_engagement: { core: 85, hip_flexors: 45 },
    tendon_stress: {},
    joint_impact: { lumbar_spine: 30 },
  },
  {
    name: 'Mountain climbers', name_en: 'Mountain Climbers', sport: 'fitness', category: 'cardio',
    muscle_engagement: { core: 75, shoulders: 55, quadriceps: 60, hip_flexors: 50 },
    tendon_stress: {},
    joint_impact: { wrists: 40, shoulders: 35, knees: 30 },
  },
  {
    name: 'Jumping jacks', name_en: 'Jumping Jacks', sport: 'fitness', category: 'cardio',
    muscle_engagement: { calves: 60, shoulders: 45, quadriceps: 40 },
    tendon_stress: { achilles: 35 },
    joint_impact: { ankles: 40, knees: 30 },
  },
  {
    name: 'Curl biceps', name_en: 'Bicep Curl', sport: 'musculation', category: 'isolation',
    muscle_engagement: { biceps: 90, forearms: 50 },
    tendon_stress: { biceps_tendon: 55 },
    joint_impact: { elbows: 40, wrists: 25 },
  },
];

// ── Triathlon — Swimming (technique / interval focus) ────────────────────────
const TRI_SWIM_PROFILE = {
  muscle_engagement: { shoulders: 85, upper_back: 80, core: 70, triceps: 65, chest: 60 },
  tendon_stress: { rotator_cuff: 80, biceps_tendon: 50 },
  joint_impact: { shoulders: 70, elbows: 30 },
};
const TRIATHLON_SWIM = [
  { name: 'Éducatifs crawl', name_en: 'Crawl Technique Drills', sport: 'triathlon', category: 'cardio', default_duration: 30, default_rpe: 4, ...TRI_SWIM_PROFILE },
  { name: 'Séries 100m (tri)', name_en: '100m Interval Sets', sport: 'triathlon', category: 'cardio', default_duration: 35, default_rpe: 7, ...TRI_SWIM_PROFILE },
  { name: 'Séries 400m', name_en: '400m Interval Sets', sport: 'triathlon', category: 'cardio', default_duration: 45, default_rpe: 7, ...TRI_SWIM_PROFILE },
  { name: 'Simulation eau libre', name_en: 'Open Water Simulation', sport: 'triathlon', category: 'cardio', default_duration: 40, default_rpe: 6, ...TRI_SWIM_PROFILE },
  { name: 'Pull buoy endurance', name_en: 'Pull Buoy Endurance', sport: 'triathlon', category: 'cardio', default_duration: 35, default_rpe: 5, ...TRI_SWIM_PROFILE },
  { name: 'Séries jambes (natation)', name_en: 'Kick Sets', sport: 'triathlon', category: 'cardio', default_duration: 25, default_rpe: 5,
    muscle_engagement: { calves: 70, quadriceps: 60, glutes: 55, core: 50 },
    tendon_stress: { achilles: 40 },
    joint_impact: { ankles: 50, knees: 40 },
  },
];

// ── Triathlon — Cycling (power/tempo focus) ──────────────────────────────────
const BIKE_PROFILE_TRI = {
  muscle_engagement: { quadriceps: 90, hamstrings: 60, calves: 50, glutes: 75, core: 30 },
  tendon_stress: { patellar: 60, it_band: 40 },
  joint_impact: { knees: 65, hips: 40, lumbar_spine: 35 },
};
const TRIATHLON_BIKE = [
  { name: 'Sweet spot (vélo)', name_en: 'Sweet Spot Intervals', sport: 'triathlon', category: 'cardio', default_duration: 75, default_rpe: 7, ...BIKE_PROFILE_TRI },
  { name: 'Côtes répétées (vélo)', name_en: 'Hill Repeats Cycling', sport: 'triathlon', category: 'cardio', default_duration: 60, default_rpe: 8, ...BIKE_PROFILE_TRI },
  { name: 'Tempo (vélo triathlon)', name_en: 'Tempo Ride Triathlon', sport: 'triathlon', category: 'cardio', default_duration: 90, default_rpe: 7, ...BIKE_PROFILE_TRI },
  { name: 'Récupération active (vélo)', name_en: 'Recovery Spin', sport: 'triathlon', category: 'cardio', default_duration: 45, default_rpe: 3, ...BIKE_PROFILE_TRI },
  { name: 'Effort chrono (vélo)', name_en: 'Time Trial Effort', sport: 'triathlon', category: 'cardio', default_duration: 60, default_rpe: 9, ...BIKE_PROFILE_TRI },
];

// ── Triathlon — Running (brick focus) ────────────────────────────────────────
const RUN_PROFILE_TRI = {
  muscle_engagement: { quadriceps: 85, hamstrings: 75, calves: 80, glutes: 70, core: 40 },
  tendon_stress: { achilles: 80, patellar: 70, it_band: 65, plantar_fascia: 60 },
  joint_impact: { knees: 75, ankles: 70, hips: 50 },
};
const TRIATHLON_RUN = [
  { name: 'Sortie brick (après vélo)', name_en: 'Brick Run (off the bike)', sport: 'triathlon', category: 'cardio', default_duration: 30, default_rpe: 7, ...RUN_PROFILE_TRI },
  { name: 'Tempo (course triathlon)', name_en: 'Tempo Run Triathlon', sport: 'triathlon', category: 'cardio', default_duration: 40, default_rpe: 7, ...RUN_PROFILE_TRI },
  { name: 'Fractionné 400m/800m', name_en: 'Track Intervals 400m/800m', sport: 'triathlon', category: 'cardio', default_duration: 45, default_rpe: 8, ...RUN_PROFILE_TRI },
  { name: 'Sortie longue (course)', name_en: 'Long Run Easy', sport: 'triathlon', category: 'cardio', default_duration: 75, default_rpe: 4, ...RUN_PROFILE_TRI },
  { name: 'Fartlek (triathlon)', name_en: 'Fartlek Triathlon', sport: 'triathlon', category: 'cardio', default_duration: 45, default_rpe: 6, ...RUN_PROFILE_TRI },
];

// ── Triathlon — Transitions ──────────────────────────────────────────────────
const TRIATHLON_TRANSITIONS = [
  {
    name: 'Pratique T1 (natation→vélo)', name_en: 'T1 Practice (swim to bike)', sport: 'triathlon', category: 'cardio', default_duration: 15, default_rpe: 4,
    muscle_engagement: { core: 30, shoulders: 25, quadriceps: 20 },
    tendon_stress: {},
    joint_impact: {},
  },
  {
    name: 'Pratique T2 (vélo→course)', name_en: 'T2 Practice (bike to run)', sport: 'triathlon', category: 'cardio', default_duration: 15, default_rpe: 4,
    muscle_engagement: { core: 30, quadriceps: 25, calves: 20 },
    tendon_stress: {},
    joint_impact: {},
  },
  {
    name: 'Répétition transitions complètes', name_en: 'Full Transition Rehearsal', sport: 'triathlon', category: 'cardio', default_duration: 30, default_rpe: 5,
    muscle_engagement: { core: 35, shoulders: 25, quadriceps: 30, calves: 20 },
    tendon_stress: {},
    joint_impact: {},
  },
];

const ALL_EXERCISES = [
  ...STRENGTH,
  ...CROSSFIT,
  ...RUNNING,
  ...CYCLING,
  ...SWIMMING,
  ...BOXING,
  ...YOGA,
  ...FITNESS,
  ...TRIATHLON_SWIM,
  ...TRIATHLON_BIKE,
  ...TRIATHLON_RUN,
  ...TRIATHLON_TRANSITIONS,
];

async function seed() {
  console.log(`Seeding ${ALL_EXERCISES.length} exercises...`);

  // Delete existing global exercises
  const deleted = await sql`DELETE FROM public.exercises WHERE is_custom = false`;
  console.log(`Deleted ${deleted.count} existing global exercises`);

  // Insert all
  for (const ex of ALL_EXERCISES) {
    await sql`
      INSERT INTO public.exercises (name, name_en, sport, category, muscle_engagement, tendon_stress, joint_impact, default_duration, default_rpe, is_custom)
      VALUES (
        ${ex.name},
        ${ex.name_en},
        ${ex.sport},
        ${ex.category},
        ${JSON.stringify(ex.muscle_engagement)},
        ${JSON.stringify(ex.tendon_stress)},
        ${JSON.stringify(ex.joint_impact)},
        ${ex.default_duration || null},
        ${ex.default_rpe || null},
        false
      )
    `;
  }

  const count = await sql`SELECT count(*) as c FROM public.exercises WHERE is_custom = false`;
  console.log(`Done! ${count[0].c} global exercises in DB`);
  await sql.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
