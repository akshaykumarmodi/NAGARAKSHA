import { hoursAgo, calculateDeadline } from '../utils/timeUtils.js'

// High-reliability inline SVG illustrations for sample issue photos & resolution proof
export const SAMPLE_IMAGES = {
  pothole1: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23334155"/><path d="M0 260 L600 260" stroke="%23cbd5e1" stroke-width="4" stroke-dasharray="15,15"/><ellipse cx="320" cy="240" rx="140" ry="60" fill="%230f172a"/><ellipse cx="330" cy="245" rx="110" ry="40" fill="%23020617"/><circle cx="270" cy="235" r="15" fill="%23475569"/><text x="40" y="60" fill="%23f8fafc" font-family="sans-serif" font-weight="bold" font-size="22">CIVIC-SAMPLE: Deep Road Pothole</text><text x="40" y="90" fill="%2394a3b8" font-family="sans-serif" font-size="14">Location: Hillview 5th Cross • Hazard: 2-Wheelers at night</text></svg>`,
  
  garbage1: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f1f5f9"/><rect x="180" y="160" width="240" height="180" rx="8" fill="%2315803d"/><path d="M160 160 L440 160" stroke="%2314532d" stroke-width="8"/><circle cx="220" cy="220" r="28" fill="%23ea580c"/><rect x="280" y="190" width="70" height="90" fill="%23e2e8f0"/><polygon points="340,320 400,280 430,340" fill="%2364748b"/><text x="40" y="60" fill="%230f172a" font-family="sans-serif" font-weight="bold" font-size="22">CIVIC-SAMPLE: Overflowing Dumpster</text><text x="40" y="90" fill="%23475569" font-family="sans-serif" font-size="14">Location: Sector 4 Market • Stench affecting residential area</text></svg>`,
  
  garbageDuplicate: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f8fafc"/><rect x="190" y="170" width="220" height="170" rx="6" fill="%23166534"/><circle cx="230" cy="230" r="30" fill="%23f97316"/><rect x="290" y="200" width="80" height="100" fill="%23cbd5e1"/><text x="40" y="60" fill="%230f172a" font-family="sans-serif" font-weight="bold" font-size="22">CIVIC-SAMPLE: Waste Spillage Near School Gate</text><text x="40" y="90" fill="%2364748b" font-family="sans-serif" font-size="14">Location: Sector 4 Main Road • Reported by School Teacher</text></svg>`,
  
  streetlight1: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23090d16"/><line x1="300" y1="120" x2="300" y2="380" stroke="%23475569" stroke-width="12"/><path d="M300 120 C300 70, 360 70, 370 100" fill="none" stroke="%23475569" stroke-width="8"/><circle cx="370" cy="110" r="16" fill="%23334155"/><path d="M360 110 L350 140 L375 140 L365 170" stroke="%23f59e0b" stroke-width="3" fill="none"/><text x="40" y="60" fill="%23f8fafc" font-family="sans-serif" font-weight="bold" font-size="22">CIVIC-SAMPLE: Dark Streetlight & Dangling Wire</text><text x="40" y="90" fill="%2394a3b8" font-family="sans-serif" font-size="14">Location: Oakridge Ward 8 • Pedestrians avoiding stretch</text></svg>`,

  waterLeak1: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f0f9ff"/><ellipse cx="300" cy="270" rx="200" ry="70" fill="%2338bdf8"/><ellipse cx="300" cy="270" rx="140" ry="45" fill="%230284c7"/><line x1="280" y1="180" x2="320" y2="240" stroke="%230369a1" stroke-width="16"/><text x="40" y="60" fill="%230f172a" font-family="sans-serif" font-weight="bold" font-size="22">CIVIC-SAMPLE: Drinking Water Pipeline Burst</text><text x="40" y="90" fill="%230369a1" font-family="sans-serif" font-size="14">Location: Riverdale Lane • Clean water flooding road for 12 hours</text></svg>`,

  resolvedEvidence: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e293b"/><rect x="0" y="240" width="600" height="160" fill="%230f172a"/><rect x="220" y="230" width="180" height="80" rx="12" fill="%23030712" stroke="%2322c55e" stroke-width="4"/><circle cx="530" cy="70" r="34" fill="%2322c55e"/><path d="M518 70 L527 79 L544 60" fill="none" stroke="%23ffffff" stroke-width="4" stroke-linecap="round"/><text x="40" y="60" fill="%23f8fafc" font-family="sans-serif" font-weight="bold" font-size="22">RESOLUTION PROOF: Fresh Cold-Mix Asphalt Patch</text><text x="40" y="90" fill="%2386efac" font-family="sans-serif" font-size="14">Contractor Team: Roads Div 3 • Tested with static roller load</text></svg>`
}

export function generateSeedData() {
  const tOverdue = hoursAgo(54);     // Created 54 hrs ago with 48h SLA -> Overdue
  const tDuplicate1 = hoursAgo(18);   // Existing garbage report
  const tDuplicate2 = hoursAgo(3);    // New similar garbage report
  const tReview = hoursAgo(12);       // Resolution submitted, awaiting reviewer verification
  const tInProgress = hoursAgo(8);    // In progress
  const tResolved = hoursAgo(72);     // Fully resolved earlier

  const complaints = [
    {
      id: 'CFX-2026-1001',
      title: 'Dangerous 2-foot crater pothole near primary school crosswalk',
      description: 'Massive pothole opened up right after heavy rains. Multiple two-wheelers have skidded and students from the nearby primary school cross here daily. Urgent patching required before a serious injury happens.',
      category: 'Pothole/Road Damage',
      area: 'Oakridge Ward 8, Opp. City Primary School',
      department: 'Roads & Infrastructure Department',
      priority: 'Critical',
      slaHours: 12,
      createdAt: tOverdue,
      deadline: calculateDeadline(tOverdue, 12),
      status: 'Escalated',
      photoUrl: SAMPLE_IMAGES.pothole1,
      isDemo: true,
      duplicateIds: [],
      resolutionData: null,
      analysis: {
        engineType: 'Rule-based demo analysis',
        suggestedCategory: 'Pothole/Road Damage',
        categoryConfidence: 'High (94%)',
        recommendedDepartment: 'Roads & Infrastructure Department',
        recommendedPriority: 'Critical',
        slaHours: 12,
        reasoning: [
          'Detected high hazard indicators ("crater", "school", "injury risk", "skidded").',
          'Assigned emergency priority (12-hour response window).',
          'SLA exceeded by 42 hours without worker sign-off → Auto-Escalated to Zonal Chief Engineer.'
        ],
        possibleDuplicates: [],
        hasDuplicates: false,
        recommendedNextAction: 'Emergency crew dispatch and traffic safety cones required immediately.'
      }
    },
    {
      id: 'CFX-2026-1002',
      title: 'Commercial garbage bin overflowing onto walkway',
      description: 'The green municipal dumpster at Sector 4 has not been emptied for 4 days. Waste has spilled all over the pedestrian pavement and stray animals are scattering bags. Intense stench.',
      category: 'Garbage',
      area: 'Sector 4 Market Main Road, near Metro Pillar 142',
      department: 'Sanitation Department',
      priority: 'Medium',
      slaHours: 48,
      createdAt: tDuplicate1,
      deadline: calculateDeadline(tDuplicate1, 48),
      status: 'In Progress',
      photoUrl: SAMPLE_IMAGES.garbage1,
      isDemo: true,
      duplicateIds: ['CFX-2026-1005'],
      resolutionData: null,
      analysis: {
        engineType: 'Rule-based demo analysis',
        suggestedCategory: 'Garbage',
        categoryConfidence: 'High (90%)',
        recommendedDepartment: 'Sanitation Department',
        recommendedPriority: 'Medium',
        slaHours: 48,
        reasoning: [
          'Vocabulary match: "garbage bin", "overflowing", "dumpster", "stench".',
          'Assigned standard 48-hour sanitary cleanup SLA.',
          'Identified linked duplicate report CFX-2026-1005 at the same market location.'
        ],
        possibleDuplicates: [],
        hasDuplicates: false,
        recommendedNextAction: 'Sanitation Truck Route 14 assigned for morning clearance.'
      }
    },
    {
      id: 'CFX-2026-1003',
      title: 'Major 6-inch drinking water main rupture leaking onto roadway',
      description: 'Clean drinking water is gushing out of an underground supply joint near Riverdale lane. Water pressure in surrounding apartments has dropped to zero and road is getting waterlogged.',
      category: 'Water Leakage',
      area: 'Riverdale Lane, Central Ward',
      department: 'Water Supply & Sewerage Board',
      priority: 'High',
      slaHours: 24,
      createdAt: tReview,
      deadline: calculateDeadline(tReview, 24),
      status: 'Awaiting Verification',
      photoUrl: SAMPLE_IMAGES.waterLeak1,
      isDemo: true,
      duplicateIds: [],
      resolutionData: {
        submittedAt: hoursAgo(2),
        submittedBy: 'Field Officer Sundar (Water Div)',
        notes: 'Underground sleeve clamp installed and high-pressure gasket replaced. Pipeline tested at 4.2 bar with zero seepage. Road dry.',
        evidencePhotoUrl: SAMPLE_IMAGES.resolvedEvidence,
        status: 'Pending Review'
      },
      analysis: {
        engineType: 'Rule-based demo analysis',
        suggestedCategory: 'Water Leakage',
        categoryConfidence: 'High (96%)',
        recommendedDepartment: 'Water Supply & Sewerage Board',
        recommendedPriority: 'High',
        slaHours: 24,
        reasoning: [
          'Detected resource loss keywords ("drinking water", "rupture", "pressure dropped").',
          'Assigned to Water Supply & Sewerage Board with 24-hour SLA.',
          'Worker submitted photo & notes. Awaiting municipal reviewer sign-off.'
        ],
        possibleDuplicates: [],
        hasDuplicates: false,
        recommendedNextAction: 'Reviewer should inspect photographic evidence and approve or reject resolution.'
      }
    },
    {
      id: 'CFX-2026-1004',
      title: 'Four consecutive streetlights dark creating hazardous blind spot',
      description: 'The entire block along 5th Cross Road is pitch dark after 7 PM. Wiring appeared to spark two nights ago during the storm. Women and evening joggers feel unsafe.',
      category: 'Streetlight',
      area: 'Hillview Colony, 5th Cross Road, Lane 3',
      department: 'Electrical & Lighting Department',
      priority: 'High',
      slaHours: 24,
      createdAt: tInProgress,
      deadline: calculateDeadline(tInProgress, 24),
      status: 'In Progress',
      photoUrl: SAMPLE_IMAGES.streetlight1,
      isDemo: true,
      duplicateIds: [],
      resolutionData: null,
      analysis: {
        engineType: 'Rule-based demo analysis',
        suggestedCategory: 'Streetlight',
        categoryConfidence: 'High (91%)',
        recommendedDepartment: 'Electrical & Lighting Department',
        recommendedPriority: 'High',
        slaHours: 24,
        reasoning: [
          'Electrical safety & safety concern flagged ("spark", "pitch dark", "unsafe").',
          'Assigned to Electrical Department with high priority 24h turnaround.'
        ],
        possibleDuplicates: [],
        hasDuplicates: false,
        recommendedNextAction: 'Electrician dispatched with hydraulic lift bucket truck.'
      }
    },
    {
      id: 'CFX-2026-1005',
      title: 'Piles of rotting fruit and plastic trash at Metro Pillar 142 market',
      description: 'Trash has accumulated near the metro station exit and vegetable stalls. Stench is horrible and blocking the footpath. Please send municipal sweepers.',
      category: 'Garbage',
      area: 'Sector 4 Market Main Road, near Metro Pillar 142',
      department: 'Sanitation Department',
      priority: 'Medium',
      slaHours: 48,
      createdAt: tDuplicate2,
      deadline: calculateDeadline(tDuplicate2, 48),
      status: 'Submitted',
      photoUrl: SAMPLE_IMAGES.garbageDuplicate,
      isDemo: true,
      duplicateIds: ['CFX-2026-1002'],
      resolutionData: null,
      analysis: {
        engineType: 'Rule-based demo analysis',
        suggestedCategory: 'Garbage',
        categoryConfidence: 'High (89%)',
        recommendedDepartment: 'Sanitation Department',
        recommendedPriority: 'Medium',
        slaHours: 48,
        reasoning: [
          'Identified 84% semantic similarity with active complaint CFX-2026-1002.',
          'Exact geographic match: "Sector 4 Market Main Road, Metro Pillar 142".',
          'Suggested Action: Link to parent complaint CFX-2026-1002 to avoid double crew dispatch.'
        ],
        possibleDuplicates: [
          {
            matchedId: 'CFX-2026-1002',
            matchedTitle: 'Commercial garbage bin overflowing onto walkway',
            matchedStatus: 'In Progress',
            score: 84,
            reasons: [
              'Identical Category: Garbage',
              'Geographic overlap: "sector 4", "market", "metro pillar 142"',
              'Shared narrative terms: "trash", "stench", "footpath/walkway"'
            ]
          }
        ],
        hasDuplicates: true,
        recommendedNextAction: 'Reviewer should link this complaint with CFX-2026-1002 or merge incident ticket.'
      }
    },
    {
      id: 'CFX-2026-1006',
      title: 'Broken stormwater drain cover replaced and sealed',
      description: 'Iron drainage grate was broken and left a gaping hole on pedestrian footpath. Repaired with reinforced steel mesh and concrete framing.',
      category: 'Pothole/Road Damage',
      area: 'Greenfield Park Promenade, Jogging Track East',
      department: 'Roads & Infrastructure Department',
      priority: 'Medium',
      slaHours: 48,
      createdAt: tResolved,
      deadline: calculateDeadline(tResolved, 48),
      status: 'Resolved',
      photoUrl: SAMPLE_IMAGES.resolvedEvidence,
      isDemo: true,
      duplicateIds: [],
      resolutionData: {
        submittedAt: hoursAgo(30),
        submittedBy: 'Maintenance Lead R. Nair',
        notes: 'Installed heavy-duty cast ductile iron grate with anti-theft hinge pin. Sealed with quick-setting mortar. Certified safe for foot traffic.',
        evidencePhotoUrl: SAMPLE_IMAGES.resolvedEvidence,
        status: 'Approved',
        approvedAt: hoursAgo(28),
        approvedBy: 'Superintending Engineer Priya Sundaram'
      },
      analysis: {
        engineType: 'Rule-based demo analysis',
        suggestedCategory: 'Pothole/Road Damage',
        categoryConfidence: 'Moderate (78%)',
        recommendedDepartment: 'Roads & Infrastructure Department',
        recommendedPriority: 'Medium',
        slaHours: 48,
        reasoning: [
          'Drain cover repair verified by engineering supervisor with photo evidence.',
          'Completed 20 hours ahead of SLA deadline.'
        ],
        possibleDuplicates: [],
        hasDuplicates: false,
        recommendedNextAction: 'Case closed and citizen notified via SMS.'
      }
    }
  ];

  const initialAuditLogs = [
    {
      id: 'LOG-5001',
      complaintId: 'CFX-2026-1001',
      type: 'ESCALATION',
      actor: 'NAGARAKSHAK SLA Sentinel',
      title: 'SLA Breach: Auto-Escalated to Zonal Chief',
      description: 'Complaint exceeded 12-hour critical response window by 42 hours without resolution. Escalation alert generated.',
      timestamp: hoursAgo(2)
    },
    {
      id: 'LOG-5002',
      complaintId: 'CFX-2026-1003',
      type: 'EVIDENCE_SUBMITTED',
      actor: 'Field Worker Sundar',
      title: 'Resolution Proof Uploaded for Verification',
      description: 'Worker reported pipeline clamp replacement and uploaded post-repair verification photo.',
      timestamp: hoursAgo(2)
    },
    {
      id: 'LOG-5003',
      complaintId: 'CFX-2026-1005',
      type: 'DUPLICATE_FLAGGED',
      actor: 'NAGARAKSHAK Intelligence Engine',
      title: 'Potential Duplicate Flagged (84% Match)',
      description: 'Matched with existing ticket CFX-2026-1002 in Sector 4 Market area.',
      timestamp: tDuplicate2
    },
    {
      id: 'LOG-5004',
      complaintId: 'CFX-2026-1006',
      type: 'RESOLUTION_APPROVED',
      actor: 'Engineer Priya Sundaram',
      title: 'Resolution Evidence Approved & Closed',
      description: 'Verified photographic evidence of repaired iron drainage grate. Ticket marked Resolved.',
      timestamp: hoursAgo(28)
    },
    {
      id: 'LOG-5005',
      complaintId: 'CFX-2026-1002',
      type: 'WORK_STARTED',
      actor: 'Inspector Rajesh Verma',
      title: 'Sanitation Crew Dispatched',
      description: 'Assigned Sanitation Truck 14 for container lifting and site bleaching.',
      timestamp: hoursAgo(10)
    }
  ];

  return { complaints, auditLogs: initialAuditLogs };
}
