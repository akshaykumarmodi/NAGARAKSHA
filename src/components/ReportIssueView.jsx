import React, { useState, useMemo } from 'react'
import { 
  PlusCircle, 
  Sparkles, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Info,
  Clock,
  Layers,
  Upload,
  X
} from 'lucide-react'
import { CATEGORIES, DEMO_SAMPLE_LOCATIONS } from '../data/constants'
import { detectCategory, evaluatePriority, findPossibleDuplicates, runCivicFixAnalysis } from '../utils/aiEngine'
import { SAMPLE_IMAGES } from '../data/seedData'
import { calculateDeadline } from '../utils/timeUtils'
import { useLanguage } from '../utils/LanguageContext'
import { validateEvidenceFile } from '../services/evidenceService'
import { 
  createEvidenceModel, 
  createStatusHistoryEntry, 
  createSlaEventModel, 
  COMPLAINT_STATUS, 
  USER_ROLES 
} from '../services/schema'

const MULTILINGUAL_PRESETS = {
  en: [
    {
      title: 'Burst water pipe flooding pedestrian lane',
      description: 'Clean drinking water is erupting from the main distribution pipe right beside the market entrance. Road is covered in 4 inches of water and water pressure in nearby houses has plummeted.',
      category: 'Water Leakage',
      area: 'Sector 4 Market Main Road, near Metro Pillar 142',
      photoKey: 'waterLeak1'
    },
    {
      title: 'Severe broken pavement with exposed rebar near primary school',
      description: 'Crater formed after rainstorm with steel reinforcement exposed. Vehicles are swerving into oncoming traffic to avoid accident.',
      category: 'Pothole/Road Damage',
      area: 'Oakridge Ward 8, Opp. City Primary School',
      photoKey: 'pothole1'
    },
    {
      title: 'Stinking trash accumulating near residential complex',
      description: 'Green waste container overflowing for three days. Rotting organic matter and plastic scattered everywhere.',
      category: 'Garbage',
      area: 'Hillview Colony, 5th Cross Road, Lane 3',
      photoKey: 'garbage1'
    }
  ],
  hi: [
    {
      title: 'बाज़ार मुख्य मार्ग पर पानी की पाइपलाइन फटने से भीषण जलभराव',
      description: 'सड़क के किनारे मुख्य पेयजल पाइपलाइन फूट गई है जिससे 4 इंच पानी भर गया है। आसपास के घरों में जल आपूर्ति ठप है।',
      category: 'Water Leakage',
      area: 'सेक्टर 4 मार्केट मेन रोड, मेट्रो पिलर 142 के पास',
      photoKey: 'waterLeak1'
    },
    {
      title: 'प्राइमरी स्कूल के पास सड़क में जानलेवा गहरा गड्ढा और सरिया निकला',
      description: 'बारिश के बाद गहरा गड्ढा बन गया है जिसमें नुकीला सरिया बाहर आ गया है। तेज रफ्तार वाहन दुर्घटना से बचने के लिए कट मार रहे हैं।',
      category: 'Pothole/Road Damage',
      area: 'ओकरिज वार्ड 8, सिटी प्राइमरी स्कूल के सामने',
      photoKey: 'pothole1'
    },
    {
      title: 'रिहायशी कॉलोनी के मुख्य द्वार पर 3 दिन से सड़ता हुआ कूड़ा और बदबू',
      description: 'ग्रीन डस्टबिन तीन दिनों से भरा पड़ा है। सड़ांध और कचरा सड़क पर फैल रहा है और बीमारी फैलने का खतरा है।',
      category: 'Garbage',
      area: 'हिलव्यू कॉलोनी, 5th क्रॉस रोड, लेन 3',
      photoKey: 'garbage1'
    }
  ],
  pa: [
    {
      title: 'ਮਾਰਕੀਟ ਮੁੱਖ ਮਾਰਗ ਕੋਲ ਪਾਣੀ ਦੀ ਪਾਈਪ ਲੀਕ ਹੋਣ ਕਾਰਨ ਭਾਰੀ ਜਲਭਰਾਵ',
      description: 'ਸੜਕ ਕੰਢੇ ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਦੀ ਮੁੱਖ ਪਾਈਪਲਾਈਨ ਟੁੱਟ ਗਈ ਹੈ। 4 ਇੰਚ ਪਾਣੀ ਭਰ ਗਿਆ ਹੈ ਅਤੇ ਘਰਾਂ ਵਿੱਚ ਪਾਣੀ ਦੀ ਸਪਲਾਈ ਬੰਦ ਹੋ ਗਈ ਹੈ।',
      category: 'Water Leakage',
      area: 'ਸੈਕਟਰ 4 ਮਾਰਕੀਟ ਮੇਨ ਰੋਡ, ਮੈਟਰੋ ਪਿਲਰ 142 ਕੋਲ',
      photoKey: 'waterLeak1'
    },
    {
      title: 'ਸਕੂਲ ਨੇੜੇ ਸੜਕ ਤੇ ਬਹੁਤ ਵੱਡਾ ਟੋਆ ਅਤੇ ਖ਼ਤਰਨਾਕ ਸਰੀਆ ਬਾਹਰ ਨਿਕਲਿਆ',
      description: 'ਮੀਂਹ ਤੋਂ ਬਾਅਦ ਡੂੰਘਾ ਟੋਆ ਬਣ ਗਿਆ ਹੈ ਜਿਸ ਨਾਲ ਹਾਦਸੇ ਦਾ ਖ਼ਤਰਾ ਹੈ। ਵਾਹਨਾਂ ਨੂੰ ਲੰਘਣ ਵਿੱਚ ਮੁਸ਼ਕਲ ਆ ਰਹੀ ਹੈ।',
      category: 'Pothole/Road Damage',
      area: 'ਓਕਰੀਜ ਵਾਰਡ 8, ਸਿਟੀ ਪ੍ਰਾਇਮਰੀ ਸਕੂਲ ਦੇ ਸਾਹਮਣੇ',
      photoKey: 'pothole1'
    },
    {
      title: 'ਕਾਲੋਨੀ ਦੇ ਗੇਟ ਕੋਲ 3 ਦਿਨਾਂ ਤੋਂ ਕੂੜੇ ਦਾ ਢੇਰ ਅਤੇ ਬਦਬੂ',
      description: 'ਕੂੜੇਦਾਨ ਤਿੰਨ ਦਿਨਾਂ ਤੋਂ ਭਰਿਆ ਹੋਇਆ ਹੈ। ਗੰਦਗੀ ਅਤੇ ਪਲਾਸਟਿਕ ਸੜਕ ਤੇ ਫੈਲ ਰਿਹਾ ਹੈ।',
      category: 'Garbage',
      area: 'ਹਿੱਲਵਿਊ ਕਾਲੋਨੀ, 5ਵੀਂ ਕਰਾਸ ਰੋਡ, ਲੇਨ 3',
      photoKey: 'garbage1'
    }
  ],
  kn: [
    {
      title: 'ಮಾರುಕಟ್ಟೆ ಮುಖ್ಯ ರಸ್ತೆಯಲ್ಲಿ ನೀರಿನ ಪೈಪ್ ಒಡೆದು ನೀರು ಸೋರಿಕೆ',
      description: 'ಮುಖ್ಯ ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್ ಒಡೆದು ರಸ್ತೆಯಲ್ಲಿ ನೀರು ನಿಂತಿದೆ. ಹತ್ತಿರದ ಮನೆಗಳಿಗೆ ನೀರಿನ ಸರಬರಾಜು ಸ್ಥಗಿತಗೊಂಡಿದೆ.',
      category: 'Water Leakage',
      area: 'ಸೆಕ್ಟರ್ 4 ಮಾರುಕಟ್ಟೆ ಮುಖ್ಯ ರಸ್ತೆ, ಮೆಟ್ರೋ ಪಿಲ್ಲರ್ 142 ಹತ್ತಿರ',
      photoKey: 'waterLeak1'
    },
    {
      title: 'ಶಾಲೆ ಹತ್ತಿರ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ ಬಿದ್ದಿದೆ ಅಪಾಯ ಸಂಭವಿಸಬಹುದು',
      description: 'ಮಳೆಯ ನಂತರ ರಸ್ತೆಯಲ್ಲಿ ಆಳವಾದ ಗುಂಡಿ ಬಿದ್ದಿದ್ದು ಕಬ್ಬಿಣದ ಸರಳುಗಳು ಹೊರಬಂದಿವೆ. ಅಪಘಾತದ ಅಪಾಯವಿದೆ.',
      category: 'Pothole/Road Damage',
      area: 'ಓಕರಿಡ್ಜ್ ವಾರ್ಡ್ 8, ಸಿಟಿ ಪ್ರೈಮರಿ ಶಾಲೆ ಎದುರು',
      photoKey: 'pothole1'
    },
    {
      title: 'ವಸತಿ ಕಾಲೋನಿ ಬಳಿ ಮೂರು ದಿನಗಳಿಂದ ಕೊಳೆಯುತ್ತಿರುವ ಕಸದ ರಾಶಿ',
      description: 'ಕಸದ ತೊಟ್ಟಿ ತುಂಬಿ ತುಳುಕುತ್ತಿದ್ದು ತೀವ್ರ ದುರ್ವಾಸನೆ ಬೀರುತ್ತಿದೆ. ಪ್ಲಾಸ್ಟಿಕ್ ಹಾಗೂ ತ್ಯಾಜ್ಯ ರಸ್ತೆಯಲ್ಲಿ ಚೆಲ್ಲಾಪಿಲ್ಲಿಯಾಗಿದೆ.',
      category: 'Garbage',
      area: 'ಹಿಲ್‌ವ್ಯೂ ಕಾಲೋನಿ, 5ನೇ ಕ್ರಾಸ್ ರಸ್ತೆ, ಲೇನ್ 3',
      photoKey: 'garbage1'
    }
  ],
  te: [
    {
      title: 'మార్కెట్ మెయిన్ రోడ్డులో తాగునీటి పైపులైన్ పగిలి నీరు వృధా',
      description: 'ప్రధాన పంపిణీ పైపులైన్ పగిలి రోడ్డంతా నీటితో నిండిపోయింది. కాలనీ వాసులకు నీటి సరఫరా నిలిచిపోయింది.',
      category: 'Water Leakage',
      area: 'సెక్టార్ 4 మార్కెట్ మెయిన్ రోడ్డు, మెట్రో పిల్లర్ 142 దగ్గర',
      photoKey: 'waterLeak1'
    },
    {
      title: 'పాఠశాల సమీపంలో రోడ్డుపై ప్రమాదకరమైన పెద్ద గుంత',
      description: 'వర్షం తర్వాత రోడ్డుపై పెద్ద గోతి పడి ఇనుప చువ్వలు బయటకు వచ్చాయి. ప్రమాదాలు జరిగే అవకాశం ఉంది.',
      category: 'Pothole/Road Damage',
      area: 'ఓక్రిడ్జ్ వార్డ్ 8, సిటీ ప్రైమరీ స్కూల్ ఎదురుగా',
      photoKey: 'pothole1'
    },
    {
      title: 'కాలనీ మెయిన్ గేట్ వద్ద మూడు రోజులుగా పేరుకుపోయిన చెత్త దుర్వాసన',
      description: 'చెత్తకుండీ నిండిపోయి రోడ్డుపై వ్యర్థాలు చెల్లాచెదురుగా పడి ఉన్నాయి. తీవ్ర దుర్వాసన వస్తోంది.',
      category: 'Garbage',
      area: 'హిల్ వ్యూ కాలనీ, 5వ క్రాస్ రోడ్డు, లేన్ 3',
      photoKey: 'garbage1'
    }
  ]
}

export function ReportIssueView({ 
  existingComplaints = [], 
  onComplaintCreated, 
  setActiveTab,
  currentUser
}) {
  const { lang, t, tCat, tPriority } = useLanguage()
  const currentPresets = MULTILINGUAL_PRESETS[lang] || MULTILINGUAL_PRESETS.en
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [area, setArea] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [fileMeta, setFileMeta] = useState(null)
  const [errors, setErrors] = useState({})
  const [submittedTicket, setSubmittedTicket] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Real-time rule-based AI preview
  const liveAnalysis = useMemo(() => {
    if (!title && !description) return null
    const text = `${title} ${description} ${area}`
    const cat = detectCategory(text)
    const prio = evaluatePriority(text, category || cat.suggestedCategory)
    const duplicates = findPossibleDuplicates(
      { title, description, area, category: category || cat.suggestedCategory },
      existingComplaints
    )
    return {
      suggestedCategory: cat.suggestedCategory,
      confidence: cat.confidence,
      priority: prio.priority,
      slaHours: prio.slaHours,
      reason: prio.reason,
      duplicates
    }
  }, [title, description, area, category, existingComplaints])

  const handleSelectPreset = (p) => {
    setTitle(p.title)
    setDescription(p.description)
    setCategory(p.category)
    setArea(p.area)
    setPhotoUrl(SAMPLE_IMAGES[p.photoKey] || '')
    setFileMeta({
      fileName: `${p.photoKey}.svg`,
      fileSize: 45000,
      fileType: 'image/svg+xml'
    })
    setErrors({})
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validation = validateEvidenceFile(file)
      if (!validation.valid) {
        setErrors(prev => ({ ...prev, photo: validation.error }))
        return
      }
      setErrors(prev => {
        const next = { ...prev }
        delete next.photo
        return next
      })
      setFileMeta({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'image/jpeg'
      })
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}

    if (!title.trim()) errs.title = t('err_title_req', 'Please provide a clear complaint title')
    if (!description.trim() || description.length < 15) {
      errs.description = t('err_desc_min', 'Please provide at least 15 characters describing the issue')
    }
    if (!area.trim()) errs.area = t('err_area_req', 'Please provide an area or landmark')

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setIsSubmitting(true)

    // Simulate smart triage processing (300ms)
    setTimeout(() => {
      const uniqueNum = Math.floor(1000 + Math.random() * 9000)
      const newId = `CFX-2026-${uniqueNum}`
      const citizenId = `CIT-2026-${Math.floor(1000 + Math.random() * 9000)}`
      const finalCategory = category || (liveAnalysis ? liveAnalysis.suggestedCategory : 'Other')
      
      const complaintDraft = {
        id: newId,
        title: title.trim(),
        description: description.trim(),
        category: finalCategory,
        area: area.trim(),
        photoUrl: photoUrl || SAMPLE_IMAGES.garbageDuplicate,
        createdAt: new Date().toISOString(),
        status: 'Submitted',
        isDemo: false, // User-created tickets are not presentation demo seed tickets
        duplicateIds: []
      }

      // Execute AI engine orchestration
      const fullAnalysis = runCivicFixAnalysis(complaintDraft, existingComplaints)
      
      // Determine distinct AI verification workflow status
      let initialStatus = COMPLAINT_STATUS.AI_VERIFIED
      let statusReason = 'Automated AI Verification passed. Directly assigned to Authority Dispatch Queue.'

      if (fullAnalysis.possibleDuplicates && fullAnalysis.possibleDuplicates.length > 0) {
        initialStatus = COMPLAINT_STATUS.FLAGGED_FOR_REVIEW
        statusReason = `Potential duplicate flagged (${fullAnalysis.possibleDuplicates[0].score}% match with ${fullAnalysis.possibleDuplicates[0].matchedId}).`
      } else if (!photoUrl || fullAnalysis.categoryConfidence === 'Low') {
        initialStatus = COMPLAINT_STATUS.NEEDS_MORE_EVIDENCE
        statusReason = 'Grievance recorded; flagged as Needs More Evidence for photographic or geolocation proof.'
      }

      // Generate Relational Evidence Metadata
      const evidence = [
        createEvidenceModel({
          complaintId: newId,
          fileName: fileMeta?.fileName || 'citizen_evidence.jpg',
          fileType: fileMeta?.fileType || 'image/jpeg',
          fileSizeBytes: fileMeta?.fileSize || (photoUrl ? photoUrl.length : 180000),
          url: photoUrl || SAMPLE_IMAGES.garbageDuplicate,
          uploadedBy: citizenId,
          uploadedAt: complaintDraft.createdAt,
          verificationStatus: initialStatus === COMPLAINT_STATUS.AI_VERIFIED ? 'AI Verified' : 'Pending Check'
        })
      ]

      // Generate Status History
      const statusHistory = [
        createStatusHistoryEntry({
          complaintId: newId,
          fromStatus: null,
          toStatus: initialStatus,
          changedBy: 'NAGARAKSHAK AI Triage Sentinel',
          actorRole: USER_ROLES.SYSTEM,
          reason: statusReason,
          timestamp: complaintDraft.createdAt
        })
      ]

      // Generate SLA Event
      const slaEvents = [
        createSlaEventModel({
          complaintId: newId,
          eventType: 'DEADLINE_ASSIGNED',
          timestamp: complaintDraft.createdAt,
          hoursRemaining: fullAnalysis.slaHours,
          actor: 'NAGARAKSHAK Intelligence Engine',
          notes: `Deterministic SLA response deadline initialized to ${fullAnalysis.slaHours} hours.`
        })
      ]

      const finalTicket = {
        ...complaintDraft,
        citizenId: currentUser?.citizenId || citizenId,
        citizenName: currentUser?.name || 'Resident (Ward 42)',
        citizenPhone: currentUser?.maskedPhone || '+91 98765-XXXXX',
        citizenContactMasked: currentUser?.maskedPhone || '+91 98765-XXXXX',
        citizenWard: area.trim(),
        department: fullAnalysis.recommendedDepartment,
        priority: fullAnalysis.recommendedPriority,
        slaHours: fullAnalysis.slaHours,
        deadline: calculateDeadline(complaintDraft.createdAt, fullAnalysis.slaHours),
        status: initialStatus,
        aiVerification: {
          status: initialStatus,
          verifiedAt: complaintDraft.createdAt,
          confidence: fullAnalysis.categoryConfidence,
          suggestedCategory: fullAnalysis.suggestedCategory,
          recommendedDepartment: fullAnalysis.recommendedDepartment,
          recommendedPriority: fullAnalysis.recommendedPriority,
          slaHours: fullAnalysis.slaHours,
          reasoning: fullAnalysis.reasoning
        },
        evidence,
        statusHistory,
        slaEvents,
        analysis: fullAnalysis,
        duplicateIds: fullAnalysis.possibleDuplicates.map(d => d.matchedId)
      }

      onComplaintCreated(finalTicket)
      setSubmittedTicket(finalTicket)
      setIsSubmitting(false)
    }, 350)
  }

  const handleResetForm = () => {
    setTitle('')
    setDescription('')
    setCategory('')
    setArea('')
    setPhotoUrl('')
    setFileMeta(null)
    setErrors({})
    setSubmittedTicket(null)
  }

  // If submitted successfully, show detailed confirmation card
  if (submittedTicket) {
    return (
      <div className="container" style={{ padding: '3.5rem 1.5rem', maxWidth: '780px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', borderTop: '6px solid var(--success)' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{t('registered_success')}</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            {t('registered_sub')}
          </p>

          <div style={{ background: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>TICKET ID</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--navy-900)' }}>
                  {submittedTicket.id}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>ROUTED DEPARTMENT</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {submittedTicket.department}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>PRIORITY & SLA</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#d97706' }}>
                  {submittedTicket.priority} ({submittedTicket.slaHours}h SLA)
                </div>
              </div>
            </div>

            {submittedTicket.analysis && submittedTicket.analysis.hasDuplicates && (
              <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--warning)' }}>
                <strong>⚠️ Possible Duplicate Notice:</strong> Our engine detected high similarity with ticket{' '}
                <code>{submittedTicket.analysis.possibleDuplicates[0].matchedId}</code>. A reviewer will verify if these can be combined.
              </div>
            )}

            <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)', borderTop: '1px solid var(--slate-200)', paddingTop: '0.85rem' }}>
              <strong>Explainable AI Reasoning:</strong> {submittedTicket.analysis.reasoning[1]} {submittedTicket.analysis.reasoning[2]}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setActiveTab('complaints')}
            >
              <span>{t('view_in_board')}</span>
              <ArrowRight size={16} />
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleResetForm}
            >
              <span>{t('submit_another')}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      {/* Top Title & Demo Quickfill */}
      <div style={{ maxWidth: '820px', margin: '0 auto 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: '1.85rem' }}>{t('report_title')}</h1>
          <span className="badge badge-primary">{t('validated_citizen_portal', 'Validated Citizen Portal')}</span>
        </div>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.92rem' }}>
          {t('report_sub')}
        </p>

        {/* Demo Fast Prefill Pills */}
        <div style={{ marginTop: '1rem', background: 'var(--bg-card)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            ⚡ {t('hackathon_quick_demos', 'Quick Autofill Scenarios (Click to autofill):')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {currentPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="sample-pill"
                onClick={() => handleSelectPreset(p)}
              >
                + {tCat(p.category)}: "{p.title.slice(0, 28)}..."
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Two-Column Form + Real-time Intelligence Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem', maxWidth: '1080px', margin: '0 auto' }}>
        {/* Left: Input Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('field_title')}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={t('field_title_placeholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('field_category')}</label>
              <select 
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">{t('field_category_auto')}</option>
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{tCat(c.label)}</option>
                ))}
              </select>
              <div className="form-hint">
                {t('field_hint_cat', 'Leave blank to allow rule-based AI categorization from your description.')}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('field_area')}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={t('place_area_landmark', 'e.g. Sector 4 Market Main Road, near Metro Pillar 142')}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
              {errors.area && <div className="form-error">{errors.area}</div>}
              
              <div className="pill-group">
                {DEMO_SAMPLE_LOCATIONS.map((loc, i) => (
                  <button 
                    key={i} 
                    type="button" 
                    className="sample-pill"
                    onClick={() => setArea(loc)}
                  >
                    {loc.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('field_desc')}</label>
              <textarea 
                className="form-textarea" 
                rows="4"
                placeholder={t('place_desc_details', 'Describe the problem, severity, hazards, or impact on traffic/residents...')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
              <div className="form-hint">
                {t('field_hint_desc', 'Mention key details like safety hazards, children, elderly, or flooding.')}
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="form-group">
              <label className="form-label">{t('field_photo')}</label>
              {photoUrl ? (
                <div className="photo-preview-wrap">
                  <img src={photoUrl} alt="Complaint preview" />
                  <button 
                    type="button" 
                    onClick={() => setPhotoUrl('')}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(15,23,42,0.8)', color: '#ffffff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="photo-dropzone">
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                  <Upload size={24} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                    {t('click_upload')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                    {t('png_jpg_proof', 'PNG, JPG, or SVG proof from site')}
                  </div>
                </label>
              )}
              {errors.photo && <div className="form-error" style={{ marginTop: '0.4rem' }}>{errors.photo}</div>}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>{t('triaging_btn')}</span>
              ) : (
                <>
                  <PlusCircle size={18} />
                  <span>{t('submit_complaint_btn')}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Live NAGARAKSHAK Intelligence Preview */}
        <div>
          <div className="ai-intelligence-card" style={{ position: 'sticky', top: '5.5rem' }}>
            <div className="ai-header">
              <div className="ai-header-title">
                <Sparkles size={18} />
                <span>NAGARAKSHAK</span>
              </div>
              <span className="ai-label-pill">{t('rule_based_demo', 'Rule-based demo analysis')}</span>
            </div>

            {!liveAnalysis ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                <Info size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.7 }} />
                <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>{t('real_time_active', 'Real-Time Analysis Active')}</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {t('real_time_desc', 'Start typing a title or description. The engine will evaluate category, priority, and check for existing duplicates live!')}
                </p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    {t('category_classification', 'Category Classification')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>
                      {tCat(category || liveAnalysis.suggestedCategory)}
                    </span>
                    {!category && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--teal-600)', fontWeight: 600 }}>
                        {liveAnalysis.confidence}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    {t('recommended_prio_sla', 'Recommended Priority & SLA')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className={`badge ${
                      liveAnalysis.priority === 'Critical' ? 'badge-danger' : 
                      liveAnalysis.priority === 'High' ? 'badge-warning' : 'badge-neutral'
                    }`}>
                      {tPriority(liveAnalysis.priority)} {t('priority', 'Priority')}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--navy-800)', fontWeight: 600 }}>
                      ⏱️ {liveAnalysis.slaHours} {t('hours_sla', 'Hours SLA')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--navy-700)', lineHeight: 1.4 }}>
                    {liveAnalysis.reason}
                  </div>
                </div>

                {/* Live Duplicate Warning */}
                {liveAnalysis.duplicates && liveAnalysis.duplicates.length > 0 ? (
                  <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--warning)', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                      <AlertTriangle size={15} />
                      <span>{t('duplicate_warning', 'Possible Duplicate Detected')} ({liveAnalysis.duplicates[0].score}% match)</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--navy-800)', lineHeight: 1.4 }}>
                      Matches existing ticket <strong>{liveAnalysis.duplicates[0].matchedId}</strong> ("{liveAnalysis.duplicates[0].matchedTitle.slice(0, 35)}...").
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                    <CheckCircle2 size={14} />
                    <span>{t('no_conflicts_found', 'No conflicting duplicates found in this area.')}</span>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--slate-500)', lineHeight: 1.4 }}>
                  {t('triage_ai_desc', 'NAGARAKSHAK engine combines keyword tokenization, geographical sector clustering, and urgency heuristics.')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
