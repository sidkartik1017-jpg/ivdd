export const HIGH_RISK_BREEDS = [
  "Dachshund",
  "French Bulldog",
  "Beagle",
  "Shih Tzu",
  "Pekingese",
  "Corgi",
  "Pembroke Welsh Corgi",
  "Basset Hound",
  "Cocker Spaniel",
  "Bichon Frise",
  "Poodle (Miniature)",
  "Lhasa Apso",
];

export const ALL_BREEDS = [
  ...HIGH_RISK_BREEDS,
  "Labrador Retriever",
  "Golden Retriever",
  "German Shepherd",
  "Border Collie",
  "Pug",
  "Chihuahua",
  "Jack Russell Terrier",
  "Boxer",
  "Rottweiler",
  "Australian Shepherd",
  "Cavalier King Charles Spaniel",
  "Yorkshire Terrier",
  "Mixed breed",
  "Other",
];

export const SYMPTOMS = [
  { id: "pain", label: "Back / neck pain" },
  { id: "hunched", label: "Hunched posture" },
  { id: "reluctant", label: "Reluctance to move" },
  { id: "wobbly", label: "Wobbly / uncoordinated gait" },
  { id: "dragging", label: "Dragging limbs" },
  { id: "knuckling", label: "Knuckling" },
  { id: "incontinence", label: "Loss of bladder / bowel control" },
];

export const NEURO_LABELS: Record<number, string> = {
  1: "Pain only",
  2: "Ambulatory paresis",
  3: "Non-ambulatory paresis",
  4: "Paralysis, deep pain intact",
  5: "No deep pain sensation",
};

export const DISC_LEVELS = [
  "C2-C3",
  "C3-C4",
  "C4-C5",
  "C5-C6",
  "C6-C7",
  "T11-T12",
  "T12-T13",
  "T13-L1",
  "L1-L2",
  "L2-L3",
  "L3-L4",
  "L4-L5",
  "L5-L6",
  "L6-L7",
  "L7-S1",
];

export type FormState = {
  name: string;
  dogId: string;
  breed: string;
  sex: string;
  ageMonths: string;
  weightKg: string;
  bcs: string;
  onset: string;
  region: string;
  discLevel: string;
  neuro: number;
  duration: string;
  symptoms: string[];
  discHeightIndex: string;
  t2SignalScore: string;
  textureEntropy: string;
  bulgeProb: string;
  endplateProxy: string;
  geneticRiskScore: string;
  mechanismRiskScore: string;
  imagingRiskScore: string;
  cddyFgf4Cfa12Copies: string;
  breedGeneticPrior: string;
};

export const BLANK_FORM: FormState = {
  name: "",
  dogId: "",
  breed: "",
  sex: "",
  ageMonths: "",
  weightKg: "",
  bcs: "",
  onset: "",
  region: "",
  discLevel: "",
  neuro: 3,
  duration: "",
  symptoms: [],
  discHeightIndex: "",
  t2SignalScore: "",
  textureEntropy: "",
  bulgeProb: "",
  endplateProxy: "",
  geneticRiskScore: "",
  mechanismRiskScore: "",
  imagingRiskScore: "",
  cddyFgf4Cfa12Copies: "",
  breedGeneticPrior: "",
};

export type RiskResult = {
  prob: number;
  level: "Low" | "Moderate" | "High";
  color: string;
  tint: string;
  headline: string;
  interpretation: string;
  nextStep: string;
};

export function computeRisk(f: FormState, hasMri: boolean): RiskResult {
  let score = 8;
  if (HIGH_RISK_BREEDS.includes(f.breed)) score += 30;
  const age = (parseFloat(f.ageMonths) || 0) / 12;
  if (age >= 3 && age <= 7) score += 10;
  else if (age > 7) score += 6;
  if (f.bcs === "Overweight") score += 12;
  if (f.onset === "Acute") score += 12;
  if (f.region && f.region.startsWith("Cervical")) score += 6;
  if (f.region && f.region.startsWith("Thoraco")) score += 10;
  score += (Number(f.neuro) - 1) * 11;
  const heavy = ["dragging", "knuckling", "incontinence", "wobbly"];
  f.symptoms.forEach((sym) => {
    score += heavy.includes(sym) ? 8 : 4;
  });
  const dur = parseFloat(f.duration) || 0;
  if (dur > 0 && dur <= 2 && f.onset === "Acute") score += 5;
  if (hasMri) score += 4;

  const prob = Math.max(4, Math.min(97, Math.round(score)));
  let level: RiskResult["level"];
  let color: string;
  let tint: string;
  let headline: string;
  let interpretation: string;
  let nextStep: string;

  if (prob < 34) {
    level = "Low";
    color = "#2FA36B";
    tint = "#E4F3EA";
    headline = "Signs point to a low IVDD risk";
    interpretation =
      "Based on what you've entered, your dog's current signs are consistent with a low likelihood of IVDD. Keep monitoring and avoid high-impact activity.";
    nextStep = "Monitor at home; book a routine check-up if signs change.";
  } else if (prob < 67) {
    level = "Moderate";
    color = "#C98A16";
    tint = "#FBEFD6";
    headline = "A moderate risk — worth a closer look";
    interpretation =
      "Several factors suggest an elevated chance of IVDD. Restrict jumping and stairs, and have a veterinarian evaluate your dog soon.";
    nextStep = "Consult your vet within 24–48 hours; strict rest meanwhile.";
  } else {
    level = "High";
    color = "#D2564B";
    tint = "#F7E2DF";
    headline = "High risk — seek veterinary care";
    interpretation =
      "The combination of breed, neurological signs and symptoms indicates a high likelihood of IVDD. Prompt assessment improves outcomes significantly.";
    nextStep = "Consult your vet within 24 hours — sooner if signs worsen.";
  }

  return { prob, level, color, tint, headline, interpretation, nextStep };
}

export function tintFor(level: string) {
  return level === "Low" ? "#E4F3EA" : level === "Moderate" ? "#FBEFD6" : "#F7E2DF";
}

export function botReply(text: string): string {
  const t = text.toLowerCase();
  if (/what is|what's|ivdd|disc disease|explain/.test(t))
    return "IVDD (Intervertebral Disc Disease) is when the cushioning discs between a dog's vertebrae bulge or rupture, pressing on the spinal cord. It ranges from back pain to paralysis, and is most common in long-backed breeds.";
  if (/breed|dachshund|corgi|frenchie|french bulldog|risk/.test(t))
    return "Chondrodystrophic breeds — Dachshunds, French Bulldogs, Corgis, Beagles, Shih Tzus, Basset Hounds — are far more prone to IVDD because their discs calcify early. SpineGuard weighs breed heavily in its estimate.";
  if (/grade|neuro|scale|1|2|3|4|5/.test(t))
    return "The neurological grade runs 1–5: 1 = pain only, 2 = walks but wobbly, 3 = can't walk but moves legs, 4 = paralysed with deep pain, 5 = no deep pain sensation. Higher grades need faster surgical assessment.";
  if (/symptom|sign|hunch|drag|knuckl|pain/.test(t))
    return "Watch for a hunched back, reluctance to jump or climb stairs, yelping when touched, wobbly hind legs, dragging paws (knuckling), or loss of bladder control. Sudden onset is a red flag.";
  if (/treat|surger|rest|help|do|next/.test(t))
    return "Mild cases often improve with strict crate rest and anti-inflammatories; severe or worsening cases may need surgery. Always confirm with your vet — early care makes a big difference.";
  if (/hi|hello|hey|thanks|thank/.test(t))
    return "Happy to help! Ask me anything about IVDD, breed risk, symptoms, or how to read your result.";
  return "I can explain IVDD, which breeds are high-risk, what neurological grades mean, warning signs to watch for, and next steps. What would you like to know?";
}

export type HistoryEntry = {
  id: string;
  name: string;
  breed: string;
  level: RiskResult["level"];
  prob: number;
  time: string;
  color: string;
  mriThumb?: string | null;
  snapshot?: FormState;
  result?: RiskResult;
};

export const SEED_HISTORY: HistoryEntry[] = [
  { id: "h1", name: "Pretzel", breed: "Dachshund", level: "High", prob: 82, time: "2h ago", color: "#D2564B" },
  { id: "h2", name: "Momo", breed: "French Bulldog", level: "Moderate", prob: 54, time: "Yesterday", color: "#C98A16" },
  { id: "h3", name: "Biscuit", breed: "Beagle", level: "Low", prob: 18, time: "2 days ago", color: "#2FA36B" },
  { id: "h4", name: "Waffles", breed: "Corgi", level: "Moderate", prob: 47, time: "4 days ago", color: "#C98A16" },
  { id: "h5", name: "Olive", breed: "Labrador", level: "Low", prob: 9, time: "Last week", color: "#2FA36B" },
];

export type ChatMessage = { id: string; from: "user" | "bot"; text: string };

export const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "m0",
    from: "bot",
    text: "Hi! I'm the SpineGuard assistant 🐾 Ask me about IVDD, high-risk breeds, or what a neurological grade means.",
  },
];
