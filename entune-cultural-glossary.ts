// Cultural Health Concepts Glossary
// This file is loaded into the Claude API system prompt and used for cultural flag detection
// Sources: DSM-5 Glossary of Cultural Concepts of Distress, medical anthropology literature

export type CulturalConcept = {
  term: string;
  language: string;
  literal: string;
  clinicalContext: string;
  screenFor: string[];
  safetyNote: string | null;
  relatedTerms: string[];
};

export const culturalGlossary: CulturalConcept[] = [
  // ===== KOREAN =====
  {
    term: "화병",
    language: "ko-KR",
    literal: "Fire illness / Anger disease",
    clinicalContext:
      "Hwa-byung is a culturally recognized syndrome in Korean communities caused by chronic suppressed anger or resentment. Patients report a sensation of heat or fire in the chest, headaches, insomnia, palpitations, dry mouth, and epigastric mass sensation. It is formally included in the DSM-5 as a cultural concept of distress. It predominantly affects middle-aged and older Korean women.",
    screenFor: [
      "Major depressive disorder",
      "Generalized anxiety disorder",
      "Somatic symptom disorder",
      "PTSD (if trauma history present)",
    ],
    safetyNote: null,
    relatedTerms: ["홧병", "화가 나다", "울화가 치밀다"],
  },
  {
    term: "신병",
    language: "ko-KR",
    literal: "Spirit illness",
    clinicalContext:
      "Shin-byung is a Korean folk diagnosis characterized by anxiety, weakness, dizziness, insomnia, GI disturbances, and dissociative episodes. Traditionally attributed to possession by ancestral spirits. The patient may believe they are being called to become a shaman. Can represent somatization of depression or anxiety, or a dissociative disorder.",
    screenFor: [
      "Dissociative disorder",
      "Somatoform disorder",
      "Major depressive disorder",
      "Adjustment disorder",
    ],
    safetyNote:
      "Patient may seek spiritual healers (mudang) rather than medical care. Approach with cultural sensitivity — do not dismiss the belief system.",
    relatedTerms: ["신내림", "무병"],
  },
  {
    term: "한",
    language: "ko-KR",
    literal: "Deep grief / Collective sorrow",
    clinicalContext:
      "Han is a uniquely Korean cultural concept describing a deep, unresolved feeling of grief, resentment, regret, and suppressed sorrow — often accumulated over a lifetime or across generations. When a patient says '한이 맺혔어요' (han has knotted inside me), they are describing a profound emotional burden. This is not a clinical diagnosis but provides critical context for understanding the patient's emotional state.",
    screenFor: [
      "Major depressive disorder",
      "Complicated grief",
      "Chronic stress",
      "Suicidal ideation (assess if acute)",
    ],
    safetyNote:
      "Han can mask severe depression. If the patient describes han in combination with hopelessness or withdrawal, conduct a thorough safety assessment.",
    relatedTerms: ["한이 맺히다", "한이 풀리다", "원한"],
  },
  {
    term: "체했다",
    language: "ko-KR",
    literal: "Food is stuck / Indigestion blockage",
    clinicalContext:
      "A common Korean folk illness concept describing a sensation that food is stuck or blocked in the digestive system, causing nausea, bloating, chest pressure, and general malaise. Similar to 'empacho' in Latin American cultures. Often self-treated with acupressure (pricking the fingertips) or folk remedies before seeking medical care.",
    screenFor: [
      "GERD",
      "Functional dyspepsia",
      "Gastritis",
      "Cardiac causes (if chest pressure is prominent)",
    ],
    safetyNote:
      "Some patients prick their fingertips with needles as a folk treatment. Ask about home remedies used, and assess for infection risk if skin was broken.",
    relatedTerms: ["체하다", "소화가 안되다"],
  },
  {
    term: "기가 막히다",
    language: "ko-KR",
    literal: "Qi is blocked / Energy is stuck",
    clinicalContext:
      "Describes a feeling of being overwhelmed, suffocated, or rendered speechless by stress, frustration, or injustice. Rooted in traditional Korean medicine's concept of qi (vital energy) circulation. When a patient uses this phrase in a medical context, they may be describing acute stress, panic-like symptoms, or a feeling of emotional paralysis.",
    screenFor: [
      "Acute stress reaction",
      "Panic disorder",
      "Generalized anxiety",
    ],
    safetyNote: null,
    relatedTerms: ["기가 차다", "기운이 없다"],
  },
  {
    term: "속이 상하다",
    language: "ko-KR",
    literal: "Insides are hurt/damaged",
    clinicalContext:
      "A Korean expression describing emotional distress that manifests as physical stomach/gut discomfort. The patient feels emotionally wounded and it is 'hurting their insides.' Can indicate psychosomatic GI symptoms driven by emotional distress. Should not be interpreted as purely a GI complaint.",
    screenFor: [
      "Anxiety with somatic features",
      "Depression with somatic features",
      "Functional GI disorder",
    ],
    safetyNote: null,
    relatedTerms: ["속상하다", "마음이 아프다"],
  },
  {
    term: "열이 오르다",
    language: "ko-KR",
    literal: "Heat is rising",
    clinicalContext:
      "Describes a sensation of heat rising through the body, often to the face and head. Can indicate actual fever, but in Korean cultural context frequently describes emotional agitation, anger, or menopausal symptoms. Ask clarifying questions to distinguish between subjective heat sensation and measured fever.",
    screenFor: [
      "Menopausal symptoms",
      "Anxiety",
      "Hwa-byung (if accompanied by anger/suppression)",
      "Actual febrile illness",
    ],
    safetyNote: null,
    relatedTerms: ["화가 오르다", "얼굴이 달아오르다"],
  },
  {
    term: "몸이 무겁다",
    language: "ko-KR",
    literal: "Body feels heavy",
    clinicalContext:
      "While this can describe physical fatigue, in Korean cultural context it often indicates a holistic sense of malaise encompassing emotional and physical exhaustion. May reflect depression, chronic fatigue, or the physical manifestation of emotional burden. Do not interpret as only physical tiredness.",
    screenFor: [
      "Major depressive disorder",
      "Chronic fatigue syndrome",
      "Hypothyroidism",
      "Sleep disorders",
    ],
    safetyNote: null,
    relatedTerms: ["기운이 없다", "몸이 찌뿌둥하다"],
  },

  // ===== SPANISH =====
  {
    term: "nervios",
    language: "es-ES",
    literal: "Nerves",
    clinicalContext:
      "A broad idiom of distress common across Latin American communities describing a state of emotional distress and vulnerability. Symptoms include headaches, chest tightness, stomach disturbances, trembling, difficulty concentrating, tearfulness, and sleep disturbances. Not equivalent to a single DSM diagnosis — it can encompass anxiety, depression, PTSD, or somatic symptom disorder depending on context.",
    screenFor: [
      "Generalized anxiety disorder",
      "Major depressive disorder",
      "Somatic symptom disorder",
      "PTSD",
    ],
    safetyNote: null,
    relatedTerms: ["estar mal de los nervios", "nerviosismo"],
  },
  {
    term: "ataque de nervios",
    language: "es-ES",
    literal: "Attack of nerves",
    clinicalContext:
      "An acute, dramatic episode of emotional distress common among Caribbean and Latin American populations. Characterized by uncontrollable crying, screaming, trembling, a sensation of heat rising in the chest, verbal or physical aggression, and sometimes seizure-like episodes or fainting. Often triggered by grief, family conflict, or acute stress. Resembles panic disorder but is distinct — it typically occurs in a social context and may include dissociation and amnesia.",
    screenFor: [
      "Panic disorder",
      "Dissociative disorder",
      "Acute stress disorder",
      "PTSD",
    ],
    safetyNote:
      "The patient may appear to be having a seizure. Rule out epilepsy and other neurological conditions before attributing to cultural syndrome.",
    relatedTerms: ["ataque", "crisis de nervios"],
  },
  {
    term: "susto",
    language: "es-ES",
    literal: "Fright / Soul loss",
    clinicalContext:
      "A cultural explanation for illness attributed to a terrifying event that causes the soul to leave the body, leading to unhappiness, sickness, and social withdrawal. Symptoms include appetite loss, insomnia, listlessness, social withdrawal, and various somatic complaints. Formally included in the DSM-5. Clinically maps to depression, PTSD, and/or somatic symptom disorder.",
    screenFor: [
      "Major depressive disorder",
      "PTSD",
      "Somatic symptom disorder",
      "Adjustment disorder",
    ],
    safetyNote: null,
    relatedTerms: ["espanto", "miedo", "perdida del alma"],
  },
  {
    term: "empacho",
    language: "es-ES",
    literal: "Blocked / Stuck stomach",
    clinicalContext:
      "A folk illness describing food that is believed to be stuck or adhered to the stomach or intestinal wall, causing bloating, nausea, diarrhea, loss of appetite, and stomach pain. Very common in children. Often treated with traditional abdominal massage and folk remedies before seeking medical care.",
    screenFor: [
      "Functional dyspepsia",
      "Gastroenteritis",
      "Constipation",
      "Intestinal obstruction (if severe)",
    ],
    safetyNote:
      "CRITICAL: Some traditional remedies for empacho contain LEAD — particularly azarcón (lead tetroxide) and greta (lead oxide). These are used especially in Mexican communities. Ask about home remedies. If lead-based remedies were used, order blood lead levels immediately, especially in children.",
    relatedTerms: ["empachado"],
  },
  {
    term: "mal de ojo",
    language: "es-ES",
    literal: "Evil eye",
    clinicalContext:
      "A folk illness belief that sickness (fever, vomiting, excessive crying, irritability) can result from an admiring or envious gaze from another person, most commonly affecting infants and young children. The parent may attribute the child's symptoms to mal de ojo rather than infection or other medical causes.",
    screenFor: [
      "Evaluate the presenting symptoms on their own merits",
      "Febrile illness",
      "GI infection",
      "Dehydration (in infants)",
    ],
    safetyNote:
      "Parents may delay seeking medical care for a seriously ill child if they believe the cause is spiritual. Respect the belief while ensuring the child receives appropriate medical evaluation.",
    relatedTerms: ["ojo", "ojeo"],
  },
  {
    term: "bilis",
    language: "es-ES",
    literal: "Bile",
    clinicalContext:
      "A folk illness concept where intense anger or rage causes bile to 'overflow' into the system, leading to nausea, vomiting, bitter taste, headache, dizziness, and GI distress. Similar in concept to Korean hwa-byung. The patient may attribute physical symptoms directly to an anger-provoking event.",
    screenFor: [
      "Anxiety",
      "GERD",
      "Functional dyspepsia",
      "Hypertension (check BP if anger/agitation is prominent)",
    ],
    safetyNote: null,
    relatedTerms: ["derrame de bilis", "le subió la bilis"],
  },
  {
    term: "caída de mollera",
    language: "es-ES",
    literal: "Fallen fontanelle",
    clinicalContext:
      "A folk illness in infants where the soft spot (fontanelle) on the baby's head appears sunken. Culturally attributed to pulling the baby off the breast too quickly or bouncing the baby. Folk treatments include pushing up on the palate or holding the baby upside down.",
    screenFor: [
      "Dehydration (sunken fontanelle is a clinical sign of moderate-severe dehydration)",
      "Malnutrition",
      "Failure to thrive",
    ],
    safetyNote:
      "URGENT: A sunken fontanelle is a real clinical sign of dehydration in infants. While the cultural explanation differs, the symptom requires immediate medical evaluation. Do not dismiss — assess hydration status.",
    relatedTerms: ["mollera caída"],
  },
];

// Helper: get glossary entries by language
export function getGlossaryByLanguage(language: string): CulturalConcept[] {
  return culturalGlossary.filter((entry) => entry.language === language);
}

// Helper: get all terms as a flat list for inclusion in system prompt
export function getTermsList(language: string): string[] {
  return culturalGlossary
    .filter((entry) => entry.language === language)
    .flatMap((entry) => [entry.term, ...entry.relatedTerms]);
}
