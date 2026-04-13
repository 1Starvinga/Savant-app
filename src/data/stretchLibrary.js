// Savant Stretch Method — static stretch library
// Each stretch maps to a body region and technique type

export const BODY_REGIONS = {
  LOWER_BODY: 'Lower Body',
  UPPER_BODY: 'Upper Body',
  SPINE: 'Spine',
  HIPS: 'Hips & Glutes',
  SHOULDERS: 'Shoulders',
}

export const TECHNIQUE_TYPES = {
  STATIC: 'Static',
  PNF: 'PNF',
  DYNAMIC: 'Dynamic',
  ASSISTED: 'Assisted',
}

export const stretchLibrary = [
  {
    id: 'hamstring-supine',
    name: 'Supine Hamstring Stretch',
    region: BODY_REGIONS.LOWER_BODY,
    technique: TECHNIQUE_TYPES.ASSISTED,
    duration: 90,
    description: 'Client lies supine. Practitioner elevates the leg, maintaining dorsiflexion throughout the hold.',
    cues: [
      'Keep the pelvis neutral — no posterior tilt',
      'Maintain soft knee on the working leg',
      'Breathe into the back of the thigh',
    ],
    contraindications: ['Acute hamstring tear', 'Sciatica flare-up'],
  },
  {
    id: 'hip-flexor-lunge',
    name: 'Kneeling Hip Flexor Stretch',
    region: BODY_REGIONS.HIPS,
    technique: TECHNIQUE_TYPES.STATIC,
    duration: 60,
    description: 'Client in a half-kneeling position. Posterior pelvic tilt is emphasized to isolate the iliopsoas.',
    cues: [
      'Tuck the pelvis under — no anterior flare',
      'Squeeze the glute of the rear leg',
      'Tall spine, ribcage down',
    ],
    contraindications: ['Knee pain on contact surface'],
  },
  {
    id: 'thoracic-rotation',
    name: 'Thoracic Rotation',
    region: BODY_REGIONS.SPINE,
    technique: TECHNIQUE_TYPES.DYNAMIC,
    duration: 45,
    description: 'Client side-lying with hips stacked. Practitioner guides the top arm through a rotation arc.',
    cues: [
      'Keep hips stacked and still',
      'Eyes follow the moving hand',
      'Exhale into the rotation',
    ],
    contraindications: ['Acute disc herniation', 'Recent spinal surgery'],
  },
  {
    id: 'shoulder-cross-body',
    name: 'Cross-Body Shoulder Stretch',
    region: BODY_REGIONS.SHOULDERS,
    technique: TECHNIQUE_TYPES.ASSISTED,
    duration: 60,
    description: 'Client seated or supine. Practitioner draws the arm across the midline targeting the posterior capsule.',
    cues: [
      'Depress the shoulder blade — no shrugging',
      'Keep the elbow at shoulder height',
      'Gentle overpressure at end range',
    ],
    contraindications: ['Shoulder impingement (acute)', 'Recent rotator cuff repair'],
  },
]
