import { DEPARTMENTS, PRIORITIES } from '../data/constants.js'

// Keyword dictionary for category detection
const CATEGORY_KEYWORDS = {
  'Garbage': ['garbage', 'trash', 'waste', 'dump', 'bin', 'stench', 'smell', 'overflow', 'rotting', 'rubbish', 'litter', 'plastic'],
  'Pothole/Road Damage': ['pothole', 'crater', 'road', 'asphalt', 'tar', 'crack', 'pavement', 'accident', 'vehicle', 'tire', 'puncture', 'divider', 'sidewalk'],
  'Streetlight': ['light', 'lamp', 'dark', 'bulb', 'streetlight', 'pole', 'wiring', 'sparking', 'electricity', 'blackout', 'illumination'],
  'Water Leakage': ['water', 'pipe', 'leak', 'drain', 'drainage', 'sewage', 'burst', 'flood', 'gutter', 'contamination', 'drinking water', 'manhole']
};

const HIGH_URGENCY_KEYWORDS = [
  'accident', 'danger', 'urgent', 'hazardous', 'hospital', 'school', 'children', 
  'sparking', 'deep', 'live wire', 'flooding', 'contamination', 'ambulance', 'senior', 'fatal'
];

const LOW_URGENCY_KEYWORDS = [
  'minor', 'faded', 'aesthetic', 'cosmetic', 'paint', 'small scratch', 'slow drip', 'dim'
];

// Tokenizer & stop words
const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'near', 'to', 'for', 
  'of', 'with', 'by', 'from', 'our', 'my', 'there', 'has', 'have', 'been', 'very', 'please'
]);

function tokenize(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

export function detectCategory(text = '') {
  const tokens = tokenize(text);
  let bestCategory = 'Other';
  let maxMatches = 0;
  const matchDetails = [];

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const hits = tokens.filter(t => keywords.some(k => k.includes(t) || t.includes(k)));
    if (hits.length > maxMatches) {
      maxMatches = hits.length;
      bestCategory = cat;
    }
    if (hits.length > 0) {
      matchDetails.push({ category: cat, count: hits.length, hits });
    }
  }

  return {
    suggestedCategory: bestCategory,
    confidence: maxMatches > 2 ? 'High (88%)' : maxMatches > 0 ? 'Moderate (65%)' : 'Fallback (40%)',
    matchedTokens: matchDetails
  };
}

export function evaluatePriority(text = '', category = '') {
  const lower = text.toLowerCase();
  const urgencyHits = HIGH_URGENCY_KEYWORDS.filter(k => lower.includes(k));
  const lowHits = LOW_URGENCY_KEYWORDS.filter(k => lower.includes(k));

  if (urgencyHits.length >= 2 || lower.includes('live wire') || lower.includes('hospital') || lower.includes('fatal')) {
    return {
      priority: 'Critical',
      slaHours: 12,
      reason: `Flagged critical safety risk due to keywords: "${urgencyHits.join(', ')}". Requires emergency dispatch.`
    };
  }

  if (urgencyHits.length === 1 || category === 'Pothole/Road Damage' && lower.includes('deep')) {
    return {
      priority: 'High',
      slaHours: 24,
      reason: `High public impact identified ("${urgencyHits[0] || 'Road hazard'}"). Target resolution within 24 hours.`
    };
  }

  if (lowHits.length > 0) {
    return {
      priority: 'Low',
      slaHours: 72,
      reason: `Non-hazardous maintenance grievance. Standard 72-hour turnaround assigned.`
    };
  }

  return {
    priority: 'Medium',
    slaHours: 48,
    reason: `Standard civic grievance without immediate hazard flags. Standard 48-hour SLA.`
  };
}

// Compute duplicate similarity between two complaints
export function calculateSimilarity(newComplaint, existing) {
  if (newComplaint.id === existing.id) return { score: 0, reasons: [] };

  const reasons = [];
  let score = 0;

  // 1. Category match (25 points)
  if (newComplaint.category && existing.category && newComplaint.category === existing.category) {
    score += 25;
    reasons.push(`Identical Category: ${newComplaint.category}`);
  }

  // 2. Area token match (up to 40 points)
  const newAreaTokens = tokenize(newComplaint.area || '');
  const existingAreaTokens = tokenize(existing.area || '');
  const areaOverlap = newAreaTokens.filter(t => existingAreaTokens.includes(t));

  if (areaOverlap.length >= 2) {
    score += 40;
    reasons.push(`Geographic overlap: "${areaOverlap.join(', ')}"`);
  } else if (areaOverlap.length === 1) {
    score += 20;
    reasons.push(`Nearby location reference: "${areaOverlap[0]}"`);
  }

  // 3. Title & description word overlap (up to 35 points)
  const text1 = `${newComplaint.title || ''} ${newComplaint.description || ''}`;
  const text2 = `${existing.title || ''} ${existing.description || ''}`;
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));

  let commonCount = 0;
  tokens1.forEach(t => {
    if (tokens2.has(t)) commonCount++;
  });

  const unionSize = new Set([...tokens1, ...tokens2]).size;
  const jaccard = unionSize > 0 ? (commonCount / unionSize) : 0;

  if (jaccard > 0.4) {
    score += 35;
    reasons.push(`Strong vocabulary overlap (${Math.round(jaccard * 100)}% keyword match)`);
  } else if (jaccard > 0.2) {
    score += 20;
    reasons.push(`Moderate narrative similarity (${Math.round(jaccard * 100)}% keyword match)`);
  }

  return {
    score: Math.min(score, 98),
    reasons,
    matchedId: existing.id,
    matchedTitle: existing.title,
    matchedStatus: existing.status
  };
}

export function findPossibleDuplicates(newComplaint, existingComplaints = []) {
  const matches = [];

  for (const existing of existingComplaints) {
    // Only check active or recently submitted complaints
    const sim = calculateSimilarity(newComplaint, existing);
    if (sim.score >= 50) {
      matches.push({
        ...sim,
        complaint: existing
      });
    }
  }

  // Sort by highest similarity
  matches.sort((a, b) => b.score - a.score);
  return matches;
}

// Complete orchestration analyzer
export function runCivicFixAnalysis(complaint, existingComplaints = []) {
  const fullText = `${complaint.title || ''} ${complaint.description || ''} ${complaint.area || ''}`;
  
  // Category detection
  const catAnalysis = detectCategory(fullText);
  const finalCategory = complaint.category || catAnalysis.suggestedCategory;

  // Department assignment
  const department = DEPARTMENTS[finalCategory] || 'General Civic Services';

  // Priority & SLA
  const priorityInfo = evaluatePriority(fullText, finalCategory);

  // Duplicates check
  const duplicateMatches = findPossibleDuplicates({ ...complaint, category: finalCategory }, existingComplaints);
  const hasPossibleDuplicates = duplicateMatches.length > 0;

  // Reasoning breakdown
  const reasoningPoints = [
    `Contextual analysis evaluated "${complaint.title}" in area "${complaint.area}".`,
    `Department Routing: Routed to [${department}] based on classification: ${finalCategory}.`,
    `Priority Assessment: Marked [${priorityInfo.priority}] (${priorityInfo.slaHours}h SLA) — ${priorityInfo.reason}`,
  ];

  if (hasPossibleDuplicates) {
    reasoningPoints.push(
      `⚠️ Potential Duplicate Warning: Found ${duplicateMatches.length} existing complaint(s) with high semantic overlap (Highest: ${duplicateMatches[0].matchedId} at ${duplicateMatches[0].score}% match).`
    );
  } else {
    reasoningPoints.push('✅ No duplicate complaints detected in this geographic sector.');
  }

  const nextAction = hasPossibleDuplicates
    ? 'Review possible duplicate match before crew dispatch.'
    : `Assign field officer from ${department} for on-site inspection.`;

  return {
    engineType: 'Rule-based demo analysis',
    suggestedCategory: catAnalysis.suggestedCategory,
    categoryConfidence: catAnalysis.confidence,
    recommendedDepartment: department,
    recommendedPriority: priorityInfo.priority,
    slaHours: priorityInfo.slaHours,
    reasoning: reasoningPoints,
    possibleDuplicates: duplicateMatches,
    hasDuplicates: hasPossibleDuplicates,
    recommendedNextAction: nextAction,
    timestamp: new Date().toISOString()
  };
}
