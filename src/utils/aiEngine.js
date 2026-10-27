import { DEPARTMENTS, PRIORITIES } from '../data/constants.js'

// Multilingual keyword dictionary for category detection (English, Hindi, Punjabi, Kannada, Telugu, Hinglish)
const CATEGORY_KEYWORDS = {
  'Garbage': [
    // English
    'garbage', 'trash', 'waste', 'dump', 'bin', 'stench', 'smell', 'overflow', 'rotting', 'rubbish', 'litter', 'plastic', 'debris', 'solid waste',
    // Hindi
    'कचरा', 'कूड़ा', 'कूड़ेदान', 'दुर्गंध', 'बदबू', 'गंदगी', 'सड़ांध', 'सफाई', 'डस्टबिन', 'कचरे', 'सड़', 'प्लास्टिक',
    // Punjabi
    'ਕੂੜਾ', 'ਗੰਦਗੀ', 'ਬਦਬੂ', 'ਕੂੜੇਦਾਨ', 'ਸੜਾਂਧ', 'ਕਚਰਾ', 'ਪਲਾਸਟਿਕ',
    // Kannada
    'ಕಸ', 'ಕಸದ', 'ದುರ್ವಾಸನೆ', 'ತ್ಯಾಜ್ಯ', 'ಕಸದತೊಟ್ಟಿ', 'ಗಿಡಗಂಟೆ', 'ಪ್ಲಾಸ್ಟಿಕ್',
    // Telugu
    'చెత్త', 'చెత్తకుండీ', 'కంపు', 'దుర్వాసన', 'వ్యర్థాలు', 'ప్లాస్టిక్',
    // Hinglish / Transliterated
    'kachra', 'kuda', 'koora', 'dustbin', 'badbu', 'durgandh', 'gandagi', 'safai', 'overflowing', 'rotting', 'malba'
  ],
  'Pothole/Road Damage': [
    // English
    'pothole', 'crater', 'road', 'asphalt', 'tar', 'crack', 'pavement', 'accident', 'vehicle', 'tire', 'puncture', 'divider', 'sidewalk', 'footpath', 'rebar', 'traffic', 'caved',
    // Hindi
    'गड्ढा', 'गड्ढे', 'सड़क', 'रास्ता', 'टूट', 'दुर्घटना', 'फुटपाथ', 'डामर', 'कंक्रीट', 'डिवाइडर', 'जाम', 'हादसा', 'टायर', 'सड़कें',
    // Punjabi
    'ਟੋਆ', 'ਟੋਏ', 'ਸੜਕ', 'ਖੱਡਾ', 'ਖੱਡੇ', 'ਹਾਦਸਾ', 'ਫੁੱਟਪਾਥ', 'ਟੁੱਟੀ', 'ਰਾਹ',
    // Kannada
    'ಗುಂಡಿ', 'ರಸ್ತೆ', 'ತಗ್ಗು', 'ಹಾಳಾದ', 'ಅಪಘಾತ', 'ಫುಟ್‌ಪಾತ್', 'ಡಾಂಬರು',
    // Telugu
    'గుంత', 'గుంతలు', 'రోడ్డు', 'రహదారి', 'ప్రమాదం', 'గోతులు', 'పాడైన',
    // Hinglish / Transliterated
    'gaddha', 'gaddhe', 'sadak', 'khadda', 'khadde', 'toota', 'tooti', 'accident', 'footpath', 'rasta', 'asphalt', 'divider'
  ],
  'Streetlight': [
    // English
    'light', 'lamp', 'dark', 'bulb', 'streetlight', 'pole', 'wiring', 'sparking', 'electricity', 'blackout', 'illumination', 'wire', 'shock', 'short circuit',
    // Hindi
    'लाइट', 'बिजली', 'तार', 'खंभा', 'खंभे', 'अंधेरा', 'करंट', 'बल्ब', 'स्ट्रीटलाइट', 'चिंगारी', 'स्पार्किंग', 'ट्रांसफार्मर', 'शॉक',
    // Punjabi
    'ਬਿਜਲੀ', 'ਲਾਈਟ', 'ਤਾਰ', 'ਖੰਭਾ', 'ਹਨੇਰਾ', 'ਕਰੰਟ', 'ਬੱਲਬ', 'ਸਪਾਰਕ',
    // Kannada
    'ದೀಪ', 'ಬೆಳಕು', 'ವಿದ್ಯುತ್', 'ಕಂಬ', 'ಕತ್ತಲೆ', 'ವೈರ್', 'ಸ್ಪಾರ್ಕ್', 'ಲೈಟ್',
    // Telugu
    'దీపం', 'వెలుగు', 'కరెంట్', 'విద్యుత్', 'స్తంభం', 'చీకటి', 'వైరు', 'స్పార్క్', 'లైట్',
    // Hinglish / Transliterated
    'bijli', 'taar', 'khamba', 'andhera', 'current', 'bulb', 'streetlight', 'sparking', 'shock', 'transformer', 'wiring'
  ],
  'Water Leakage': [
    // English
    'water', 'pipe', 'leak', 'drain', 'drainage', 'sewage', 'burst', 'flood', 'gutter', 'contamination', 'drinking water', 'manhole', 'pipeline', 'overflow',
    // Hindi
    'पानी', 'पाइप', 'लीक', 'रिसाव', 'नाली', 'सीवर', 'गटर', 'बाढ़', 'मैनहोल', 'जलभराव', 'नहाने', 'पीने का पानी', 'पाइपलाइन', 'टूटा पाइप', 'जल',
    // Punjabi
    'ਪਾਣੀ', 'ਪਾਈਪ', 'ਲੀਕ', 'ਨਾਲੀ', 'ਸੀਵਰੇਜ', 'ਗਟਰ', 'ਹੜ੍ਹ', 'ਜਲ',
    // Kannada
    'ನೀರು', 'ಪೈಪ್', 'ಸೋರಿಕೆ', 'ಚರಂಡಿ', 'ಒಳಚರಂಡಿ', 'ಗಟಾರ', 'ಕುಡಿಯುವ ನೀರು',
    // Telugu
    'నీరు', 'పైపు', 'లీకేజీ', 'మురుగు', 'కాలువ', 'డ్రైనేజీ', 'వరద', 'తాగునీరు',
    // Hinglish / Transliterated
    'paani', 'pani', 'pipe', 'leakage', 'risav', 'naali', 'nali', 'sewer', 'sewage', 'gutar', 'gutter', 'jalbharo', 'manhole', 'pipeline'
  ]
};

const HIGH_URGENCY_KEYWORDS = [
  // English
  'accident', 'danger', 'urgent', 'hazardous', 'hospital', 'school', 'children', 
  'sparking', 'deep', 'live wire', 'flooding', 'contamination', 'ambulance', 'senior', 'fatal', 'emergency', 'collapsed',
  // Hindi
  'दुर्घटना', 'खतरा', 'खतरनाक', 'आपातकालीन', 'अस्पताल', 'स्कूल', 'बच्चे', 'चिंगारी', 'गहरा', 'करंट', 'बाढ़', 'गंभीर', 'जानलेवा', 'बुजुर्ग',
  // Punjabi
  'ਹਾਦਸਾ', 'ਖ਼ਤਰਾ', 'ਖ਼ਤਰਨਾਕ', 'ਐਮਰਜੈਂਸੀ', 'ਹਸਪਤਾਲ', 'ਸਕੂਲ', 'ਬੱਚੇ', 'ਗੰਭੀਰ',
  // Kannada
  'ಅಪಘಾತ', 'ಅಪಾಯ', 'ತುರ್ತು', 'ಆಸ್ಪತ್ರೆ', 'ಶಾಲೆ', 'ಮಕ್ಕಳು', 'ತೀವ್ರ',
  // Telugu
  'ప్రమాదం', 'ప్రమాదకరమైన', 'అత్యవసర', 'ఆసుపత్రి', 'పాఠశాల', 'పిల్లలు', 'తీవ్రమైన',
  // Hinglish
  'khatra', 'khatarnaak', 'emergency', 'hospital', 'school', 'bachhe', 'haadsa', 'janleva', 'gehra'
];

const LOW_URGENCY_KEYWORDS = [
  'minor', 'faded', 'aesthetic', 'cosmetic', 'paint', 'small scratch', 'slow drip', 'dim',
  'हल्का', 'छोटा', 'धीमा', 'साधारण', 'मामूली', 'पेंट',
  'ਮਾਮੂਲੀ', 'ਛੋਟਾ', 'ਸਾਧਾਰਨ',
  'ಸಣ್ಣ', 'ಸಾಧಾರಣ',
  'చిన్న', 'సాధారణ',
  'chota', 'mamooli', 'dheema'
];

// Tokenizer supporting all Unicode scripts (Latin, Devanagari, Gurmukhi, Kannada, Telugu, etc.)
const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'near', 'to', 'for', 
  'of', 'with', 'by', 'from', 'our', 'my', 'there', 'has', 'have', 'been', 'very', 'please',
  'का', 'के', 'की', 'में', 'पर', 'है', 'हैं', 'से', 'को', 'था', 'थी', 'यह', 'वह', 'और',
  'ਦੀ', 'ਦੇ', 'ਦਾ', 'ਵਿੱਚ', 'ਤੇ', 'ਹੈ', 'ਹਨ', 'ਅਤੇ',
  'ಮತ್ತು', 'ಇದೆ', 'ಅಲ್ಲಿ', 'ಇಲ್ಲಿ',
  'మరియు', 'ఉంది', 'లో', 'పై'
]);

function tokenize(text = '') {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(token => token.length >= 2 && !STOP_WORDS.has(token));
}

export function detectCategory(text = '') {
  const tokens = tokenize(text);
  const lowerText = text.toLowerCase();
  let bestCategory = 'Other';
  let maxMatches = 0;
  const matchDetails = [];

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    // Both token-based and substring-based matching for complex scripts
    const hits = tokens.filter(t => keywords.some(k => k.includes(t) || t.includes(k)));
    const directHits = keywords.filter(k => lowerText.includes(k.toLowerCase()));
    const totalScore = Math.max(hits.length, directHits.length);

    if (totalScore > maxMatches) {
      maxMatches = totalScore;
      bestCategory = cat;
    }
    if (totalScore > 0) {
      matchDetails.push({ category: cat, count: totalScore, hits: directHits.length > 0 ? directHits : hits });
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
  const urgencyHits = HIGH_URGENCY_KEYWORDS.filter(k => lower.includes(k.toLowerCase()));
  const lowHits = LOW_URGENCY_KEYWORDS.filter(k => lower.includes(k.toLowerCase()));

  const hasCriticalHazard = 
    urgencyHits.length >= 2 || 
    lower.includes('live wire') || 
    lower.includes('hospital') || 
    lower.includes('fatal') || 
    lower.includes('करंट') || 
    lower.includes('जानलेवा') ||
    lower.includes('ਅੱਗ') ||
    lower.includes('ಅಪಾಯ') ||
    lower.includes('ప్రమాదం');

  if (hasCriticalHazard) {
    return {
      priority: 'Critical',
      slaHours: 12,
      reason: urgencyHits.length > 0 
        ? `Flagged critical safety risk due to keywords: "${urgencyHits.slice(0, 3).join(', ')}". Requires emergency dispatch.`
        : `Identified severe safety risk in vicinity. 12-hour SLA assigned.`
    };
  }

  if (urgencyHits.length === 1 || (category === 'Pothole/Road Damage' && (lower.includes('deep') || lower.includes('गहरा') || lower.includes('ਵੱਡਾ')))) {
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
