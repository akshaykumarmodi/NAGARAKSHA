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

const SAMPLE_PRESETS = [
  {
    title: 'Burst water pipe flooding pedestrian lane',
    description: 'Clean drinking water is erupting from the main distribution pipe right beside the market entrance. Road is covered in 4 inches of water and water pressure in nearby houses has plummeted.',
    category: 'Water Leakage',
    area: 'Sector 4 Market Main Road, near Metro Pillar 142',
    photoKey: 'waterLeak1'
  },
  {
    title: 'Severe broken pavement with exposed rebar',
    description: 'Crater formed after rainstorm with steel reinforcement exposed. Vehicles are swerving into oncoming traffic to avoid it.',
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
]

export function ReportIssueView({ 
  existingComplaints = [], 
  onComplaintCreated, 
  setActiveTab 
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [area, setArea] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
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
    setErrors({})
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
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

    if (!title.trim()) errs.title = 'Please provide a clear complaint title'
    if (!description.trim() || description.length < 15) {
      errs.description = 'Please provide at least 15 characters describing the issue'
    }
    if (!area.trim()) errs.area = 'Please provide an area or landmark'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setIsSubmitting(true)

    // Simulate smart triage processing (300ms)
    setTimeout(() => {
      const uniqueNum = Math.floor(1000 + Math.random() * 9000)
      const newId = `CFX-2026-${uniqueNum}`
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
        isDemo: true,
        duplicateIds: []
      }

      // Execute AI engine orchestration
      const fullAnalysis = runCivicFixAnalysis(complaintDraft, existingComplaints)
      
      const finalTicket = {
        ...complaintDraft,
        department: fullAnalysis.recommendedDepartment,
        priority: fullAnalysis.recommendedPriority,
        slaHours: fullAnalysis.slaHours,
        deadline: calculateDeadline(complaintDraft.createdAt, fullAnalysis.slaHours),
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

          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Complaint Successfully Registered!</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            Your civic grievance has been analyzed by CivicFix AI, indexed into the municipal system, and routed for dispatch.
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
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#92400e' }}>
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
              <span>View in Complaints Board</span>
              <ArrowRight size={16} />
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleResetForm}
            >
              <span>Submit Another Complaint</span>
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
          <h1 style={{ fontSize: '1.85rem' }}>Report a Civic Issue</h1>
          <span className="badge badge-primary">Validated Citizen Portal</span>
        </div>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.92rem' }}>
          Provide clear details to assist municipal field engineers. As you type, CivicFix AI analyzes your report in real time.
        </p>

        {/* Demo Fast Prefill Pills */}
        <div style={{ marginTop: '1rem', background: '#ffffff', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            ⚡ Hackathon Quick Demos (Click to autofill sample scenario):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {SAMPLE_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="sample-pill"
                onClick={() => handleSelectPreset(p)}
              >
                + {p.category}: "{p.title.slice(0, 28)}..."
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Two-Column Form + Real-time Intelligence Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', maxWidth: '1080px', margin: '0 auto' }}>
        {/* Left: Input Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Complaint Title *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Deep crater pothole near primary school"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select 
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">-- Let CivicFix AI Auto-Detect --</option>
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <div className="form-hint">
                Leave blank to allow rule-based AI categorization from your description.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Area / Location / Landmark *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Sector 4 Market Main Road, near Metro Pillar 142"
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
              <label className="form-label">Detailed Description *</label>
              <textarea 
                className="form-textarea" 
                rows="4"
                placeholder="Describe the problem, severity, hazards, or impact on traffic/residents..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
              <div className="form-hint">
                Mention key details like safety hazards, children, elderly, or flooding.
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="form-group">
              <label className="form-label">Photographic Proof (Optional)</label>
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
                    Click to upload photo
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                    PNG, JPG, or SVG proof from site
                  </div>
                </label>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Triaging with CivicFix AI...</span>
              ) : (
                <>
                  <PlusCircle size={18} />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Live CivicFix Intelligence Preview */}
        <div>
          <div className="ai-intelligence-card" style={{ position: 'sticky', top: '5.5rem' }}>
            <div className="ai-header">
              <div className="ai-header-title">
                <Sparkles size={18} />
                <span>CivicFix Intelligence Assistant</span>
              </div>
              <span className="ai-label-pill">Rule-based demo analysis</span>
            </div>

            {!liveAnalysis ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                <Info size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.7 }} />
                <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>Real-Time Analysis Active</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  Start typing a title or description. The engine will evaluate category, priority, and check for existing duplicates live!
                </p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Category Classification
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>
                      {category || liveAnalysis.suggestedCategory}
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
                    Recommended Priority & SLA
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className={`badge ${
                      liveAnalysis.priority === 'Critical' ? 'badge-danger' : 
                      liveAnalysis.priority === 'High' ? 'badge-warning' : 'badge-neutral'
                    }`}>
                      {liveAnalysis.priority} Priority
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--slate-600)', fontWeight: 600 }}>
                      ⏱️ {liveAnalysis.slaHours} Hours SLA
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', lineHeight: 1.4 }}>
                    {liveAnalysis.reason}
                  </div>
                </div>

                {/* Live Duplicate Warning */}
                {liveAnalysis.duplicates && liveAnalysis.duplicates.length > 0 ? (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#92400e', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                      <AlertTriangle size={15} />
                      <span>Possible Duplicate Detected ({liveAnalysis.duplicates[0].score}% match)</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#78350f', lineHeight: 1.4 }}>
                      Matches existing ticket <strong>{liveAnalysis.duplicates[0].matchedId}</strong> ("{liveAnalysis.duplicates[0].matchedTitle.slice(0, 35)}...").
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                    <CheckCircle2 size={14} />
                    <span>No conflicting duplicates found in this area.</span>
                  </div>
                )}

                <div style={{ borderTop: '1px solid #ccfbf1', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--slate-500)', lineHeight: 1.4 }}>
                  CivicFix engine combines keyword tokenization, geographical sector clustering, and urgency heuristics.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
