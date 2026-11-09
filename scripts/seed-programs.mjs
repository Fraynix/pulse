/**
 * Seed 15 realistic training programs with workouts and enrollments.
 * Idempotent — uses fixed UUIDs so re-running won't duplicate.
 *
 * Usage: node scripts/seed-programs.mjs
 */
import postgres from 'postgres';
import crypto from 'crypto';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error('Set DATABASE_URL');

const sql = postgres(DB_URL, { ssl: 'require' });

// Deterministic UUID from a seed string (for idempotency)
function uuid(seed) {
  return crypto.createHash('md5').update(seed).digest('hex').replace(
    /(.{8})(.{4})(.{4})(.{4})(.{12})/,
    '$1-$2-$3-$4-$5'
  );
}

// ── Coaches ──────────────────────────────────────────────────────────────────
const COACHES = [
  '89894735-18fe-48a1-b143-fb87fb44e6fa',   // coach 0
  '373a10b5-144d-4cb1-92d5-868ed4bb47d7',   // coach 1
  '55d15ce3-a746-4b69-8abb-0e4e4de5fd1e',   // coach 2
  'c6977933-d404-41c0-b5b5-1c842cce03b5',   // coach 3
  '5b4efa8c-148a-4788-b2c7-b2e08e1a08dc',   // coach 4
  '045b25d0-63fa-4345-9203-4f8c7020c7e8',   // coach 5
  'e72233ab-3e21-44ab-b559-7d1a1d32cb79',   // coach 6 (Dimitri)
];

// Real user IDs (from profiles) for enrollments
const USER_IDS = [
  '152e08c4-5d04-4eb3-ab23-844f7cdcb641',
  'b2212522-8580-4d84-bab7-a0940bd4f833',
  '6205bb6b-21f0-4ea0-9b6d-2ed5f3e04288',
  '814748d2-0d1b-4df6-9d9b-40592b95d1fc',
  '33a69e83-3f5d-4f73-b8ad-f2a394fca036',
  '919985b8-e8f8-4961-80f8-460a7ed17439',
  'feab0204-eebd-4a3c-89c5-8f69ca662cb9',
  '3b8eff8a-0246-4e6f-a79f-bb68e9336151',
  '93605cfd-7b89-4175-b9ca-abe1748aebf9',
  '32c28354-74ea-4705-8edf-ca0db9c88043',
  '125bd211-fab9-42d0-a137-2b59c280f95f',
  'a2c88e15-c256-44c0-8524-bb00a1bf469c',
  'b87148c6-7d2b-4ac6-92c4-5d8d911479df',
];

// ── Program definitions ─────────────────────────────────────────────────────
const PROGRAMS = [
  {
    key: 'marathon-paris',
    title: 'Prépa Marathon de Paris',
    description: 'Programme complet de 16 semaines pour préparer le Marathon de Paris. Inclut sorties longues progressives, séances de tempo, fractionné et récupération active. Objectif : finir en moins de 4h.',
    sport: 'running',
    level: 'intermediate',
    duration_weeks: 16,
    price: 0,
    coach_idx: 6,
    sessions_per_week: 5,
    workout_templates: [
      { title: 'Sortie longue', desc: 'Course longue en endurance fondamentale, allure confortable', dur: [90, 120, 150, 180], intensity: 65 },
      { title: 'Tempo', desc: 'Course au seuil, allure semi-marathon', dur: [45, 50, 55, 60], intensity: 80 },
      { title: 'Fractionné 30/30', desc: '30s rapide / 30s récupération, développer la VMA', dur: [45, 50, 55, 60], intensity: 90 },
      { title: 'Endurance fondamentale', desc: 'Footing souple en aisance respiratoire', dur: [40, 45, 50], intensity: 60 },
      { title: 'Renforcement musculaire', desc: 'Gainage, squats, fentes, proprioception', dur: [30, 40, 45], intensity: 50 },
    ],
  },
  {
    key: 'marathon-debutant',
    title: 'Programme Marathon Débutant',
    description: 'Votre premier marathon en 12 semaines. Progression douce, volumes raisonnables, conseils nutrition intégrés. 3 séances par semaine suffisent.',
    sport: 'running',
    level: 'beginner',
    duration_weeks: 12,
    price: 0,
    coach_idx: 0,
    sessions_per_week: 3,
    workout_templates: [
      { title: 'Sortie longue progressive', desc: 'Augmentation progressive de la distance chaque semaine', dur: [60, 75, 90, 105, 120], intensity: 60 },
      { title: 'Footing récupération', desc: 'Course très lente, récupération active', dur: [30, 35, 40], intensity: 50 },
      { title: 'Endurance fondamentale', desc: 'Footing à allure confortable, travail de la base aérobie', dur: [40, 45, 50, 55], intensity: 65 },
    ],
  },
  {
    key: 'semi-marathon',
    title: 'Prépa Semi-Marathon 10 semaines',
    description: 'Programme semi-marathon accessible à tous les niveaux. 4 séances/semaine avec fractionné, tempo et sortie longue. Testez vos limites sur 21 km.',
    sport: 'running',
    level: 'all',
    duration_weeks: 10,
    price: 29,
    coach_idx: 1,
    sessions_per_week: 4,
    workout_templates: [
      { title: 'Sortie longue', desc: 'Course longue progressive en endurance', dur: [60, 75, 90, 100], intensity: 65 },
      { title: 'Tempo au seuil', desc: 'Blocs au seuil anaérobie avec récupération', dur: [45, 50, 55], intensity: 82 },
      { title: 'Intervalles courts', desc: '200m / 400m répétitions avec récupération', dur: [40, 45, 50], intensity: 92 },
      { title: 'Footing souple', desc: 'Récupération active en aisance respiratoire', dur: [30, 35, 40], intensity: 55 },
    ],
  },
  {
    key: 'trail-utmb',
    title: 'Objectif Trail UTMB',
    description: 'Programme ultra-trail de 20 semaines pour préparer l\'UTMB ou tout ultra de 100+ km. Sorties longues en montagne, travail de dénivelé, renforcement spécifique et gestion de l\'effort.',
    sport: 'trail',
    level: 'advanced',
    duration_weeks: 20,
    price: 49,
    coach_idx: 2,
    sessions_per_week: 5,
    workout_templates: [
      { title: 'Trail long montagne', desc: 'Sortie longue avec dénivelé, gestion alimentation et matériel', dur: [180, 210, 240, 300], intensity: 60 },
      { title: 'Côtes et dénivelé', desc: 'Répétitions de côtes, travail montée/descente technique', dur: [60, 75, 90], intensity: 85 },
      { title: 'Renforcement trail', desc: 'Squats, fentes, step-ups, gainage, proprioception pieds', dur: [45, 55, 60], intensity: 55 },
      { title: 'Endurance vallonnée', desc: 'Footing sur terrain vallonné en endurance fondamentale', dur: [60, 75, 90], intensity: 65 },
      { title: 'Récupération active', desc: 'Footing très lent ou marche active + étirements', dur: [30, 40], intensity: 40 },
    ],
  },
  {
    key: 'trail-initiation',
    title: 'Trail Court — Initiation',
    description: 'Découvrez le trail running en 8 semaines. Apprenez les techniques de montée/descente, renforcez vos chevilles et préparez votre premier trail de 15-25 km.',
    sport: 'trail',
    level: 'beginner',
    duration_weeks: 8,
    price: 0,
    coach_idx: 2,
    sessions_per_week: 3,
    workout_templates: [
      { title: 'Trail découverte', desc: 'Sortie trail sur sentier facile, alternance marche/course', dur: [45, 60, 75, 90], intensity: 55 },
      { title: 'Technique montée/descente', desc: 'Travail technique en côte, posture et appuis', dur: [40, 50, 55], intensity: 70 },
      { title: 'Renforcement chevilles', desc: 'Proprioception, équilibre, renforcement des chevilles et genoux', dur: [30, 35, 40], intensity: 45 },
    ],
  },
  {
    key: 'ironman-full',
    title: 'Ironman Full Distance',
    description: 'Programme Ironman complet de 24 semaines : 3.8 km natation, 180 km vélo, 42 km course. 6 séances/semaine avec entraînements combinés (brick) et gestion nutritionnelle.',
    sport: 'triathlon',
    level: 'advanced',
    duration_weeks: 24,
    price: 79,
    coach_idx: 3,
    sessions_per_week: 6,
    workout_templates: [
      { title: 'Natation technique', desc: 'Travail technique crawl : éducatifs, pull-buoy, plaquettes', dur: [60, 65, 70], intensity: 70 },
      { title: 'Vélo endurance', desc: 'Sortie longue vélo en endurance, cadence 85-95 rpm', dur: [120, 150, 180], intensity: 65 },
      { title: 'Course à pied — brick', desc: 'Enchaînement vélo/course pour habituer les jambes à la transition', dur: [75, 90, 105], intensity: 75 },
      { title: 'Natation endurance', desc: 'Série longue en eau libre ou piscine, allure Ironman', dur: [45, 55, 60], intensity: 65 },
      { title: 'Vélo intensité', desc: 'Intervalles sur vélo : FTP, sweet spot, force', dur: [60, 75, 90], intensity: 85 },
      { title: 'Course allure marathon', desc: 'Footing à allure spécifique marathon triathlon', dur: [45, 60, 75], intensity: 72 },
    ],
  },
  {
    key: 'triathlon-sprint',
    title: 'Triathlon Sprint — Découverte',
    description: 'Premier triathlon ? Ce programme de 8 semaines vous prépare au format sprint (750m natation, 20km vélo, 5km course). 4 séances/semaine, accessible aux débutants.',
    sport: 'triathlon',
    level: 'beginner',
    duration_weeks: 8,
    price: 19,
    coach_idx: 3,
    sessions_per_week: 4,
    workout_templates: [
      { title: 'Natation technique', desc: 'Apprentissage du crawl, respiration, éducatifs', dur: [30, 40, 45], intensity: 60 },
      { title: 'Vélo découverte', desc: 'Sortie vélo progressive, travail de cadence', dur: [45, 60, 75], intensity: 60 },
      { title: 'Course endurance', desc: 'Footing progressif, allure confortable', dur: [25, 30, 35, 40], intensity: 60 },
      { title: 'Brick enchaînement', desc: 'Vélo + course enchaînés pour simuler la transition', dur: [40, 50, 60], intensity: 70 },
    ],
  },
  {
    key: 'force-hypertrophie',
    title: 'Force & Hypertrophie',
    description: 'Programme musculation de 8 semaines en split Push/Pull/Legs + Full Body. Progression linéaire, exercices composés et isolation. Idéal pour une prise de masse propre.',
    sport: 'musculation',
    level: 'intermediate',
    duration_weeks: 8,
    price: 0,
    coach_idx: 4,
    sessions_per_week: 4,
    workout_templates: [
      {
        title: 'Push Day',
        desc: 'Développé couché, développé militaire, dips, élévations latérales, triceps',
        dur: [60, 65, 70],
        intensity: 80,
        exercises: [
          { name: 'Développé couché', sets: 4, reps: '8-10', rest: '90s' },
          { name: 'Développé militaire haltères', sets: 3, reps: '10-12', rest: '75s' },
          { name: 'Dips', sets: 3, reps: '10-15', rest: '60s' },
          { name: 'Élévations latérales', sets: 3, reps: '12-15', rest: '45s' },
          { name: 'Extension triceps poulie', sets: 3, reps: '12-15', rest: '45s' },
        ],
      },
      {
        title: 'Pull Day',
        desc: 'Tractions, rowing, tirage vertical, curl biceps, face pull',
        dur: [60, 65, 70],
        intensity: 80,
        exercises: [
          { name: 'Tractions', sets: 4, reps: '6-10', rest: '90s' },
          { name: 'Rowing barre', sets: 4, reps: '8-10', rest: '90s' },
          { name: 'Tirage vertical', sets: 3, reps: '10-12', rest: '60s' },
          { name: 'Curl biceps haltères', sets: 3, reps: '10-12', rest: '45s' },
          { name: 'Face pull', sets: 3, reps: '15-20', rest: '45s' },
        ],
      },
      {
        title: 'Leg Day',
        desc: 'Squat, presse, fentes, leg curl, mollets',
        dur: [60, 70, 75],
        intensity: 85,
        exercises: [
          { name: 'Squat barre', sets: 4, reps: '6-8', rest: '120s' },
          { name: 'Presse à cuisses', sets: 3, reps: '10-12', rest: '90s' },
          { name: 'Fentes marchées', sets: 3, reps: '10/jambe', rest: '60s' },
          { name: 'Leg curl', sets: 3, reps: '10-12', rest: '60s' },
          { name: 'Mollets debout', sets: 4, reps: '15-20', rest: '45s' },
        ],
      },
      {
        title: 'Full Body',
        desc: 'Séance complète : squat, développé, tirage, soulevé de terre, abdos',
        dur: [55, 65, 70],
        intensity: 75,
        exercises: [
          { name: 'Squat goblet', sets: 3, reps: '12', rest: '60s' },
          { name: 'Développé couché haltères', sets: 3, reps: '10-12', rest: '60s' },
          { name: 'Tirage horizontal', sets: 3, reps: '10-12', rest: '60s' },
          { name: 'Soulevé de terre roumain', sets: 3, reps: '10', rest: '90s' },
          { name: 'Gainage planche', sets: 3, reps: '45s', rest: '30s' },
        ],
      },
    ],
  },
  {
    key: 'crossfit-wod',
    title: 'CrossFit WOD Progressif',
    description: 'Programme CrossFit de 6 semaines avec WODs progressifs. Adapté à tous les niveaux avec des options de scaling. Développez votre condition physique générale.',
    sport: 'crossfit',
    level: 'all',
    duration_weeks: 6,
    price: 0,
    coach_idx: 4,
    sessions_per_week: 4,
    workout_templates: [
      {
        title: 'WOD du jour — AMRAP',
        desc: 'As Many Rounds As Possible en temps limité. Enchaînement de mouvements variés.',
        dur: [45, 50, 55],
        intensity: 88,
        exercises: [
          { name: 'Burpees', sets: 1, reps: '10', rest: '0s' },
          { name: 'Kettlebell swings', sets: 1, reps: '15', rest: '0s' },
          { name: 'Box jumps', sets: 1, reps: '12', rest: '0s' },
          { name: 'Pull-ups', sets: 1, reps: '8', rest: '0s' },
        ],
      },
      {
        title: 'WOD du jour — For Time',
        desc: 'Finir le plus vite possible. Intensité maximale.',
        dur: [40, 45, 50],
        intensity: 92,
        exercises: [
          { name: 'Thrusters', sets: 1, reps: '21-15-9', rest: '0s' },
          { name: 'Toes-to-bar', sets: 1, reps: '21-15-9', rest: '0s' },
        ],
      },
      {
        title: 'Force & Skill',
        desc: 'Travail technique et de force : Olympic lifts et gymnastics',
        dur: [50, 55, 60],
        intensity: 75,
      },
      {
        title: 'Mobility & Recovery',
        desc: 'Étirements, foam rolling, mobilité articulaire',
        dur: [30, 35, 40],
        intensity: 30,
      },
    ],
  },
  {
    key: 'yoga-flexibilite',
    title: 'Yoga Flexibilité & Récupération',
    description: 'Programme yoga de 4 semaines axé sur la souplesse et la récupération sportive. Idéal en complément d\'un programme d\'entraînement intense. 3 séances/semaine de 30 à 60 minutes.',
    sport: 'yoga',
    level: 'beginner',
    duration_weeks: 4,
    price: 0,
    coach_idx: 5,
    sessions_per_week: 3,
    workout_templates: [
      { title: 'Yoga Flow — Matin', desc: 'Flow dynamique pour réveiller le corps : salutations au soleil, guerriers, torsions', dur: [30, 40, 45], intensity: 40 },
      { title: 'Yin Yoga — Récupération', desc: 'Postures tenues 3-5 min, étirements profonds des fascias', dur: [45, 50, 60], intensity: 25 },
      { title: 'Yoga Sportif — Mobilité', desc: 'Mobilité hanches, épaules, colonne. Idéal après l\'entraînement', dur: [30, 35, 40], intensity: 35 },
    ],
  },
  {
    key: 'spartan-race',
    title: 'Prépa Spartan Race',
    description: 'Programme de 10 semaines pour préparer une Spartan Race (Sprint ou Super). Course à pied, renforcement fonctionnel, travail d\'obstacles et endurance.',
    sport: 'crossfit',
    level: 'intermediate',
    duration_weeks: 10,
    price: 29,
    coach_idx: 4,
    sessions_per_week: 4,
    workout_templates: [
      { title: 'Course trail', desc: 'Course en terrain naturel avec côtes, simulation parcours', dur: [40, 50, 60], intensity: 75 },
      {
        title: 'Renforcement fonctionnel',
        desc: 'Circuit : portés, tractions, grimper, ramper',
        dur: [45, 55, 60],
        intensity: 82,
        exercises: [
          { name: 'Farmer carry', sets: 3, reps: '40m', rest: '60s' },
          { name: 'Tractions', sets: 4, reps: '8-10', rest: '60s' },
          { name: 'Corde à grimper', sets: 3, reps: '1 montée', rest: '90s' },
          { name: 'Bear crawl', sets: 3, reps: '20m', rest: '45s' },
          { name: 'Burpees', sets: 3, reps: '15', rest: '45s' },
        ],
      },
      { title: 'Endurance mixte', desc: 'Alternance course / exercices au poids du corps toutes les 5 min', dur: [50, 55, 60], intensity: 78 },
      { title: 'Grip & Obstacles', desc: 'Travail de grip, suspension, lancer, équilibre', dur: [35, 40, 45], intensity: 65 },
    ],
  },
  {
    key: 'cyclisme-etape-tour',
    title: "Cyclisme — Préparer l'Étape du Tour",
    description: "Programme vélo de 12 semaines pour préparer l'Étape du Tour de France. Travail d'endurance, cols, FTP et gestion de l'effort sur longue distance.",
    sport: 'cyclisme',
    level: 'intermediate',
    duration_weeks: 12,
    price: 39,
    coach_idx: 1,
    sessions_per_week: 4,
    workout_templates: [
      { title: 'Sortie longue endurance', desc: 'Sortie vélo 3-5h en endurance, ravitaillements réguliers', dur: [150, 180, 210, 240, 300], intensity: 62 },
      { title: 'Intervalles FTP', desc: 'Blocs de 10-20 min à FTP, récupération courte', dur: [60, 75, 80], intensity: 85 },
      { title: 'Cols & Grimpées', desc: 'Répétitions de montées, travail de cadence en danseuse et assis', dur: [90, 105, 120], intensity: 80 },
      { title: 'Récupération vélo', desc: 'Sortie souple, mouliner à 95+ rpm, jambes légères', dur: [45, 50, 60], intensity: 45 },
    ],
  },
  {
    key: 'natation-perfectionnement',
    title: 'Natation Perfectionnement',
    description: 'Améliorez votre technique de nage en 8 semaines. Éducatifs, endurance et vitesse. Programme adapté aux nageurs intermédiaires souhaitant progresser en crawl et dos.',
    sport: 'natation',
    level: 'intermediate',
    duration_weeks: 8,
    price: 19,
    coach_idx: 3,
    sessions_per_week: 3,
    workout_templates: [
      { title: 'Technique crawl', desc: 'Éducatifs crawl : rattrapé, petit chien, unilatéral. Pull-buoy et plaquettes.', dur: [45, 50, 55], intensity: 65 },
      { title: 'Endurance natation', desc: 'Séries longues 200-400m, allure régulière, travail respiratoire', dur: [50, 55, 60], intensity: 70 },
      { title: 'Vitesse & sprint', desc: '50m et 100m à haute intensité, récupération longue', dur: [40, 45, 50], intensity: 88 },
    ],
  },
  {
    key: 'boxe-conditioning',
    title: 'Boxe Conditioning',
    description: 'Programme de conditioning boxe de 6 semaines. Shadow boxing, sac, cardio HIIT et renforcement spécifique. Aucune expérience de boxe requise.',
    sport: 'boxe',
    level: 'beginner',
    duration_weeks: 6,
    price: 0,
    coach_idx: 5,
    sessions_per_week: 3,
    workout_templates: [
      {
        title: 'Shadow boxing & technique',
        desc: 'Apprentissage des coups de base, déplacements, garde. 3 rounds de shadow.',
        dur: [40, 45, 50],
        intensity: 65,
        exercises: [
          { name: 'Shadow boxing', sets: 3, reps: '3 min', rest: '60s' },
          { name: 'Jab-cross drill', sets: 3, reps: '2 min', rest: '45s' },
          { name: 'Déplacements', sets: 3, reps: '2 min', rest: '30s' },
        ],
      },
      {
        title: 'Sac & HIIT',
        desc: 'Travail au sac : combinaisons, puissance. Suivi de circuit HIIT.',
        dur: [45, 50, 55],
        intensity: 85,
        exercises: [
          { name: 'Rounds au sac', sets: 5, reps: '3 min', rest: '60s' },
          { name: 'Burpees', sets: 3, reps: '12', rest: '30s' },
          { name: 'Mountain climbers', sets: 3, reps: '30s', rest: '15s' },
        ],
      },
      {
        title: 'Cardio boxe & gainage',
        desc: 'Circuit cardio inspiré boxe : corde, shadow, abdos',
        dur: [35, 40, 45],
        intensity: 75,
        exercises: [
          { name: 'Corde à sauter', sets: 3, reps: '3 min', rest: '45s' },
          { name: 'Shadow boxing', sets: 3, reps: '3 min', rest: '30s' },
          { name: 'Gainage planche', sets: 3, reps: '45s', rest: '15s' },
          { name: 'Crunchs', sets: 3, reps: '20', rest: '30s' },
        ],
      },
    ],
  },
  {
    key: 'perte-de-poids',
    title: 'Programme Perte de Poids',
    description: 'Programme fitness de 8 semaines combinant cardio HIIT, renforcement musculaire et conseils nutritionnels. 4 séances/semaine pour une perte de poids durable et saine.',
    sport: 'fitness',
    level: 'beginner',
    duration_weeks: 8,
    price: 0,
    coach_idx: 5,
    sessions_per_week: 4,
    workout_templates: [
      {
        title: 'HIIT Brûle-graisses',
        desc: 'Circuit haute intensité : 30s effort / 15s repos. Brûle un max de calories.',
        dur: [30, 35, 40],
        intensity: 88,
        exercises: [
          { name: 'Jumping jacks', sets: 1, reps: '30s', rest: '15s' },
          { name: 'Squats sautés', sets: 1, reps: '30s', rest: '15s' },
          { name: 'Mountain climbers', sets: 1, reps: '30s', rest: '15s' },
          { name: 'Burpees', sets: 1, reps: '30s', rest: '15s' },
          { name: 'Planche dynamique', sets: 1, reps: '30s', rest: '15s' },
        ],
      },
      {
        title: 'Renforcement full body',
        desc: 'Séance complète au poids du corps ou avec haltères légers',
        dur: [40, 45, 50],
        intensity: 65,
        exercises: [
          { name: 'Squats', sets: 3, reps: '15', rest: '45s' },
          { name: 'Pompes (genoux si besoin)', sets: 3, reps: '10-15', rest: '45s' },
          { name: 'Fentes alternées', sets: 3, reps: '12/jambe', rest: '45s' },
          { name: 'Rowing haltère', sets: 3, reps: '12', rest: '45s' },
          { name: 'Gainage', sets: 3, reps: '30s', rest: '30s' },
        ],
      },
      { title: 'Cardio modéré', desc: 'Marche rapide, vélo ou elliptique à allure modérée', dur: [35, 40, 45], intensity: 55 },
      { title: 'Yoga & étirements', desc: 'Récupération active, étirements et relaxation', dur: [25, 30, 35], intensity: 30 },
    ],
  },
];

// ── Generate workouts ───────────────────────────────────────────────────────
function generateWorkouts(program, programId) {
  const workouts = [];
  const templates = program.workout_templates;
  const weeks = program.duration_weeks;
  const sessionsPerWeek = program.sessions_per_week;

  // Map day indices to day numbers (Mon=1..Sun=7)
  const daySlots = {
    3: [1, 3, 5],
    4: [1, 2, 4, 6],
    5: [1, 2, 3, 5, 6],
    6: [1, 2, 3, 4, 5, 6],
  };
  const days = daySlots[sessionsPerWeek] || daySlots[3];

  for (let week = 1; week <= weeks; week++) {
    for (let s = 0; s < sessionsPerWeek; s++) {
      const template = templates[s % templates.length];
      // Progressive duration: pick from array based on week progression
      const durArr = template.dur;
      const durIdx = Math.min(
        Math.floor((week / weeks) * durArr.length),
        durArr.length - 1
      );
      const duration = durArr[durIdx];

      // Progressive intensity
      const baseIntensity = template.intensity || 70;
      const weekProgress = week / weeks;
      // Taper last 2 weeks for endurance programs
      let intensity = baseIntensity;
      if (weeks >= 10 && week > weeks - 2) {
        intensity = Math.round(baseIntensity * 0.7);
      } else {
        intensity = Math.round(baseIntensity * (0.85 + 0.15 * weekProgress));
      }
      intensity = Math.min(100, Math.max(20, intensity));

      const workout_data = {};
      if (template.exercises) {
        workout_data.exercises = template.exercises;
      }
      workout_data.type = program.sport;
      workout_data.notes = template.desc;

      workouts.push({
        id: uuid(`${program.key}-w${week}-d${s}`),
        program_id: programId,
        week_number: week,
        day_number: days[s % days.length],
        title: template.title,
        description: `Semaine ${week} — ${template.desc}`,
        workout_data,
        duration_minutes: duration,
        intensity_percent: intensity,
      });
    }
  }

  return workouts;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  try {
    console.log('🏋️ Seeding training programs...\n');

    let totalPrograms = 0;
    let totalWorkouts = 0;
    let totalEnrollments = 0;

    for (const prog of PROGRAMS) {
      const programId = uuid(`program-${prog.key}`);
      const coachId = COACHES[prog.coach_idx % COACHES.length];

      // Insert program
      await sql`
        INSERT INTO training_programs (id, coach_id, title, description, sport, level, duration_weeks, is_published, price, periodization_type)
        VALUES (
          ${programId},
          ${coachId},
          ${prog.title},
          ${prog.description},
          ${prog.sport},
          ${prog.level},
          ${prog.duration_weeks},
          true,
          ${prog.price},
          'linear'
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          sport = EXCLUDED.sport,
          level = EXCLUDED.level,
          duration_weeks = EXCLUDED.duration_weeks,
          is_published = EXCLUDED.is_published,
          price = EXCLUDED.price
      `;
      totalPrograms++;
      console.log(`  ✅ ${prog.title} (${prog.sport}, ${prog.duration_weeks}w, ${prog.price}€)`);

      // Generate and insert workouts
      const workouts = generateWorkouts(prog, programId);
      for (const w of workouts) {
        await sql`
          INSERT INTO program_workouts (id, program_id, week_number, day_number, title, description, workout_data, duration_minutes, intensity_percent)
          VALUES (
            ${w.id}, ${w.program_id}, ${w.week_number}, ${w.day_number},
            ${w.title}, ${w.description}, ${JSON.stringify(w.workout_data)},
            ${w.duration_minutes}, ${w.intensity_percent}
          )
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            workout_data = EXCLUDED.workout_data,
            duration_minutes = EXCLUDED.duration_minutes,
            intensity_percent = EXCLUDED.intensity_percent
        `;
      }
      totalWorkouts += workouts.length;
      console.log(`     → ${workouts.length} workouts inserted`);
    }

    // ── Enrollments ────────────────────────────────────────────────────────
    console.log('\n📝 Creating enrollments...\n');

    // Spread enrollments to make some programs look popular
    const enrollmentPlan = [
      { key: 'marathon-paris', count: 8 },
      { key: 'marathon-debutant', count: 5 },
      { key: 'force-hypertrophie', count: 7 },
      { key: 'perte-de-poids', count: 10 },
      { key: 'trail-utmb', count: 3 },
      { key: 'ironman-full', count: 2 },
      { key: 'crossfit-wod', count: 6 },
      { key: 'yoga-flexibilite', count: 4 },
      { key: 'semi-marathon', count: 5 },
      { key: 'cyclisme-etape-tour', count: 3 },
      { key: 'boxe-conditioning', count: 4 },
      { key: 'spartan-race', count: 3 },
      { key: 'triathlon-sprint', count: 2 },
      { key: 'natation-perfectionnement', count: 2 },
      { key: 'trail-initiation', count: 3 },
    ];

    for (const plan of enrollmentPlan) {
      const programId = uuid(`program-${plan.key}`);
      for (let i = 0; i < plan.count; i++) {
        const athleteId = USER_IDS[i % USER_IDS.length];
        const statuses = ['active', 'active', 'active', 'completed', 'paused'];
        const status = statuses[i % statuses.length];
        const currentWeek = status === 'completed'
          ? PROGRAMS.find(p => p.key === plan.key).duration_weeks
          : Math.floor(Math.random() * 5) + 1;

        try {
          await sql`
            INSERT INTO program_enrollments (program_id, athlete_id, status, current_week, current_day)
            VALUES (${programId}, ${athleteId}, ${status}, ${currentWeek}, ${Math.floor(Math.random() * 5) + 1})
            ON CONFLICT (program_id, athlete_id) DO NOTHING
          `;
          totalEnrollments++;
        } catch (e) {
          // Skip if FK constraint fails (athlete not in auth.users)
          if (!e.message.includes('violates foreign key')) throw e;
        }
      }
      console.log(`  📊 ${plan.key}: up to ${plan.count} enrollments`);
    }

    console.log(`\n✨ DONE!`);
    console.log(`   Programs: ${totalPrograms}`);
    console.log(`   Workouts: ${totalWorkouts}`);
    console.log(`   Enrollments: ${totalEnrollments}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    await sql.end();
  }
}

main();
