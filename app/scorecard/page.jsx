'use client'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─────────────────────────────────────────────
// DATA  (unchanged from original scorecard)
// ─────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'prospect-info',
    label: 'Prospect Information',
    shortLabel: 'Prospect',
    secClass: 'sec1',
    fillClass: 'sec1-fill',
    max: 60,
    questions: [
      'Do we know (and can we influence) the key decision makers?',
      "Is this opportunity aligned with the prospect's business strategy?",
      'Has the budget been formally approved and funded?',
      'Do we understand the business need or pain driving this bid?',
      'Are requirements clearly defined, and are they technically feasible?',
      'Do we know the evaluation criteria and how it will be weighted?',
      'Are there serious business/technical/financial issues behind the scene?',
      'Do we know the proposal time frame, and is it realistic?',
      'Has the prospect already made a "buy or build" decision?',
      'Is low price a major factor in selecting the winning bid?',
      'Are there penalties for not delivering on time or within budget?',
      'Are the contract terms and conditions acceptable to us?',
    ],
  },
  {
    id: 'internal-info',
    label: 'Internal Information',
    shortLabel: 'Internal',
    secClass: 'sec2',
    fillClass: 'sec2-fill',
    max: 75,
    questions: [
      'Is this opportunity in sync with our own strategic direction?',
      'Do we have strong management support and sponsorship?',
      'Do we have the resources, talent, and will to win this opportunity?',
      'Do we have the resources and ability to deliver, if we win?',
      'Can we realistically manage the risks, if we win?',
      'If additional resources are needed, can we get what we need?',
      'How well are we known within this business sector?',
      'Do we have a successful track record with similar opportunities?',
      'Do we have a relationship with this prospect, and is it favorable?',
      'Are partners needed, and if so, will they complicate our situation?',
      'Do we have differentiators that improve our odds of winning?',
      'Can we afford the investment needed to pursue this opportunity?',
      'Will winning put any of our existing business at risk?',
      'Can we contractually protect our intellectual property?',
      'Are there consequences to us of losing or not bidding?',
    ],
  },
  {
    id: 'market-info',
    label: 'Market / Competitive Information',
    shortLabel: 'Market',
    secClass: 'sec3',
    fillClass: 'sec3-fill',
    max: 40,
    questions: [
      'Do we know who the other competitive bidders are, if any?',
      'Is a competitor an incumbent, and does that pose a threat?',
      'Is a competitor favored by prospect decision makers or influencers?',
      'Are we at a distinct competitive disadvantage from the start?',
      'Does this solution involve new or unproven technologies?',
      'Will winning enhance our reputation and market positioning?',
      'Will winning open up new market opportunities for us?',
      'Will winning give us an advantage over our competitors?',
    ],
  },
]

const TIERS = [
  { minPct: 0,  cls: 'tier-no',       ringCls: 'tier-no',      dot: '#e74c3c', badge: '🔴 Do Not Pursue',          headline: 'The odds are stacked against winning this bid.',      desc: 'Multiple critical gaps indicate this pursuit is unlikely to succeed or deliver value. Focus energy on better-qualified opportunities.' },
  { minPct: 26, cls: 'tier-caution',  ringCls: 'tier-caution', dot: '#f39c12', badge: '🟡 Proceed with Caution',    headline: 'Significant risks require careful consideration.',     desc: 'There are enough uncertainties and disadvantages to warrant a serious review before committing. Address key gaps before deciding.' },
  { minPct: 51, cls: 'tier-likely',   ringCls: 'tier-likely',  dot: '#27ae60', badge: '🟢 Likely Worth Pursuing',   headline: 'This opportunity has solid potential.',               desc: 'You have reasonable competitive standing and internal readiness. Prioritize closing remaining knowledge gaps to strengthen your bid.' },
  { minPct: 76, cls: 'tier-strong-r', ringCls: 'tier-strong',  dot: '#0693e3', badge: '🔵 Strong Pursuit Candidate',headline: 'You are well-positioned to win this bid.',            desc: 'Strong alignment across prospect, internal, and competitive dimensions. Commit your best team and resources to this opportunity.' },
]

function getTier(score) {
  const pct = (score / 175) * 100
  return [...TIERS].reverse().find(t => pct >= t.minPct) || TIERS[0]
}

const TOTAL_Q = 35
const Q_INDEX = []
SECTIONS.forEach((sec, si) => sec.questions.forEach((_, qi) => Q_INDEX.push({ secIdx: si, qIdxInSec: qi })))

// Precomputed 1-based question numbers per section
let _n = 0
const SECTION_Q_NUMS = SECTIONS.map(sec => sec.questions.map(() => ++_n))

const CIRC = 2 * Math.PI * 45

// ─────────────────────────────────────────────
// SCORE PANE COMPONENT
// ─────────────────────────────────────────────
function ScorePane({ total, secScores, dealKillerCount, tier, scores }) {
  const offset = CIRC - (total / 175) * CIRC
  return (
    <>
      <div className="sp-header">
        <div className="sp-title">Live Pursuit Score</div>
        <div className="sp-ring-wrap">
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle className="sp-ring-track" cx="55" cy="55" r="45" />
            <circle
              className={`sp-ring-fill${total > 0 ? ` ${tier.ringCls}` : ''}`}
              cx="55" cy="55" r="45"
              style={{ strokeDasharray: CIRC, strokeDashoffset: offset }}
            />
          </svg>
          <div className="sp-ring-text">
            <div className="sp-ring-score">{total}</div>
            <div className="sp-ring-max">/ 175</div>
          </div>
        </div>
        <div className="sp-tier-badge">{total === 0 ? 'Not started' : tier.badge}</div>
      </div>

      <div className="sp-sections">
        {SECTIONS.map((s, i) => (
          <div key={s.id} className="sp-section-row">
            <div className="sp-section-label">
              <span>{s.shortLabel}</span>
              <span className="sp-sec-pts">{secScores[i]} / {s.max}</span>
            </div>
            <div className="sp-section-bar-bg">
              <div className={`sp-section-bar-fill ${s.fillClass}`} style={{ width: `${(secScores[i] / s.max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="sp-killer-row">
        <div className={`sp-killer-badge${dealKillerCount === 0 ? ' clear' : ''}`}>
          <span className="killer-dot" />
          <span>
            {dealKillerCount > 0
              ? `${dealKillerCount} deal killer${dealKillerCount > 1 ? 's' : ''} flagged!`
              : 'No deal killers flagged'}
          </span>
        </div>
      </div>

      <div className="sp-progress-row">
        <div className="sp-progress-dots">
          {Array.from({ length: TOTAL_Q }, (_, i) => (
            <div
              key={i + 1}
              className={`sp-dot sec${Q_INDEX[i].secIdx + 1}${scores[i + 1] !== undefined ? ' answered' : ''}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function ScorecardPage() {
  const router = useRouter()
  const resultRef = useRef(null)

  const [scores, setScores]           = useState({})
  const [killers, setKillers]         = useState({})
  const [submitted, setSubmitted]     = useState(false)
  const [triedSubmit, setTriedSubmit] = useState(false)
  const [oppTitle, setOppTitle]       = useState('')
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [floatVisible, setFloatVisible] = useState(false)

  const answered = useMemo(() => Object.keys(scores).length, [scores])

  const secScores = useMemo(() =>
    [0, 1, 2].map(si =>
      Object.entries(scores).reduce((sum, [k, v]) => {
        const qi = parseInt(k, 10) - 1
        return Q_INDEX[qi].secIdx === si ? sum + v : sum
      }, 0)
    ), [scores])

  const total           = useMemo(() => secScores.reduce((a, b) => a + b, 0), [secScores])
  const dealKillerCount = useMemo(() => Object.values(killers).filter(Boolean).length, [killers])
  const tier            = useMemo(() => getTier(total), [total])
  const progressPct     = (answered / TOTAL_Q) * 100

  // Auto-show result when all questions answered
  useEffect(() => {
    if (answered === TOTAL_Q && !submitted) {
      const t = setTimeout(() => setSubmitted(true), 400)
      return () => clearTimeout(t)
    }
  }, [answered, submitted])

  // Scroll to result when it appears
  useEffect(() => {
    if (submitted && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [submitted])

  // Floating bar on scroll
  useEffect(() => {
    const handler = () => setFloatVisible(window.scrollY > 120)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handlePillClick = useCallback((qNum, val) => {
    setScores(prev => ({ ...prev, [qNum]: val }))
    setTriedSubmit(false)
  }, [])

  const handleKillerChange = useCallback((qNum, checked) => {
    setKillers(prev => ({ ...prev, [qNum]: checked }))
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (answered < TOTAL_Q) {
      setTriedSubmit(true)
      for (let i = 1; i <= TOTAL_Q; i++) {
        if (scores[i] === undefined) {
          document.querySelector(`[data-q="${i}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          break
        }
      }
      return
    }
    setSubmitted(true)
  }

  function resetForm() {
    setScores({})
    setKillers({})
    setSubmitted(false)
    setTriedSubmit(false)
    setOppTitle('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function printResults() {
    const oppTitleVal = oppTitle.trim() || 'Untitled Opportunity'
    const pct   = ((total / 175) * 100).toFixed(1)
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const ones  = Object.values(scores).filter(v => v === 1).length
    const unks  = Object.values(scores).filter(v => v === 0).length

    const qData = Array.from({ length: TOTAL_Q }, (_, i) => ({
      num: i + 1,
      text: SECTIONS[Q_INDEX[i].secIdx].questions[Q_INDEX[i].qIdxInSec],
      val: scores[i + 1] !== undefined ? scores[i + 1] : null,
      isKiller: killers[i + 1] || false,
      secIdx: Q_INDEX[i].secIdx,
    }))

    const PILL = { 5: 'pill-5', 4: 'pill-4', 3: 'pill-3', 2: 'pill-2', 1: 'pill-1', 0: 'pill-0' }
    const PLBL = { 5: '5', 4: '4', 3: '3', 2: '2', 1: '1', 0: 'Unk' }
    const BAR_COLORS = ['#7a00df', '#0693e3', '#9b51e0']

    const secQHTML = SECTIONS.map((sec, si) =>
      `<div class="pr-q-section sec${si + 1}">
        <h3>${sec.label}</h3>
        <table class="pr-q-table">
          <thead><tr><th>#</th><th>Question</th><th>Score</th><th>Flag</th></tr></thead>
          <tbody>${qData.filter(q => q.secIdx === si).map(q =>
            `<tr>
              <td style="color:#8898bb;width:24px">${q.num}</td>
              <td>${q.text}</td>
              <td><span class="pr-score-pill ${PILL[q.val] || 'pill-0'}">${PLBL[q.val] ?? '—'}</span></td>
              <td>${q.isKiller ? '<span class="pr-killer-flag">⚠ DK</span>' : ''}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`).join('')

    const secBarsHTML = SECTIONS.map((sec, si) =>
      `<div class="pr-sec-row">
        <div class="pr-sec-name">${sec.label}</div>
        <div class="pr-sec-bar-bg"><div class="pr-sec-bar-fill" style="width:${Math.round((secScores[si] / sec.max) * 100)}%;background:${BAR_COLORS[si]}"></div></div>
        <div class="pr-sec-pts">${secScores[si]} / ${sec.max}</div>
      </div>`).join('')

    document.getElementById('print-report').innerHTML = `
      <div class="pr-header">
        <div class="pr-header-left">
          <div class="pr-logo">YRCI · Bid Pursuit</div>
          <div class="pr-title">Bid Pursuit Scorecard</div>
          <div class="pr-opp">${oppTitleVal}</div>
        </div>
        <div class="pr-header-right">
          <div class="pr-date">${today}</div>
          <div class="pr-score-big">${total}</div>
          <div class="pr-score-max">out of 175 &nbsp;·&nbsp; ${pct}%</div>
        </div>
      </div>
      <div class="pr-tier ${tier.cls}">
        <div class="pr-tier-badge">${tier.badge}</div>
        <div class="pr-tier-text"><h3>${tier.headline}</h3><p>${tier.desc}</p></div>
      </div>
      ${dealKillerCount > 0 ? `<div class="pr-killer-alert visible">⚠ ${dealKillerCount} potential deal killer${dealKillerCount > 1 ? 's' : ''} identified — proceed with extreme caution.</div>` : ''}
      <div class="pr-metrics">
        <div class="pr-metric"><div class="pm-val">${pct}%</div><div class="pm-label">Pursuit Value</div></div>
        <div class="pr-metric"><div class="pm-val">${secScores[0]}/60</div><div class="pm-label">Prospect Info</div></div>
        <div class="pr-metric"><div class="pm-val">${secScores[1]}/75</div><div class="pm-label">Internal Info</div></div>
        <div class="pr-metric"><div class="pm-val">${secScores[2]}/40</div><div class="pm-label">Market / Comp</div></div>
        <div class="pr-metric"><div class="pm-val">${ones}</div><div class="pm-label">Rated 1</div></div>
        <div class="pr-metric"><div class="pm-val">${unks}</div><div class="pm-label">Unknown</div></div>
        <div class="pr-metric"><div class="pm-val">${dealKillerCount}</div><div class="pm-label">Deal Killers</div></div>
        <div class="pr-metric"><div class="pm-val">35</div><div class="pm-label">Total Factors</div></div>
      </div>
      <div class="pr-sections"><h3>Section Scores</h3>${secBarsHTML}</div>
      ${secQHTML}
      <div class="pr-footer">
        <span>© YRCI · Bid Pursuit Scorecard</span>
        <span>Generated ${today}</span>
      </div>`

    window.print()
  }

  const pct  = ((total / 175) * 100).toFixed(1)
  const ones = Object.values(scores).filter(v => v === 1).length
  const unks = Object.values(scores).filter(v => v === 0).length

  return (
    <>
      {/* Floating progress bar */}
      <div id="float-progress" className={floatVisible ? 'visible' : ''}>
        <span className="fp-logo">YRCI</span>
        <div className="fp-bar-bg"><div className="fp-bar-fill" style={{ width: `${progressPct}%` }} /></div>
        <span className="fp-label">{answered}/35</span>
        <span className="fp-tier-dot" style={{ background: total > 0 ? tier.dot : '#dde4f0' }} />
      </div>

      {/* Mobile drawer */}
      <div className={`score-drawer-overlay${drawerOpen ? ' open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <div className={`score-drawer${drawerOpen ? ' open' : ''}`}>
        <div className="score-drawer-handle" />
        <div className="score-pane-inner">
          <ScorePane total={total} secScores={secScores} dealKillerCount={dealKillerCount} tier={tier} scores={scores} />
        </div>
      </div>
      <button className="score-pane-toggle" onClick={() => setDrawerOpen(true)}>
        <span className="toggle-score">{total}</span>
        <span className="toggle-lbl">/ 175</span>
      </button>

      <header>
        <div className="logo">YRCI · Bid Pursuit</div>
        <h1>Bid Pursuit Scorecard</h1>
        <p>Rate each factor 1–5 (or Unknown) to calculate your pursuit value and decide whether to bid.</p>
        <button className="logout-btn" onClick={handleLogout}>Sign out</button>
      </header>

      <div className="page-layout">
        <div className="form-col">

          <div className="opp-title-wrap">
            <label htmlFor="opportunity-title">Opportunity Title</label>
            <input
              type="text"
              id="opportunity-title"
              value={oppTitle}
              onChange={e => setOppTitle(e.target.value)}
              placeholder="Enter opportunity name or description…"
            />
          </div>

          <div className="legend-wrap">
            <div className="legend-title">Scoring Legend</div>
            <div className="legend-items">
              {[[5,'Strong competitive advantage'],[4,'Moderate competitive advantage'],[3,'Neutral'],[2,'Moderate competitive disadvantage'],[1,'Serious competitive disadvantage']].map(([v, label]) => (
                <div key={v} className="legend-item">
                  <span className="legend-pill">{v}</span> {label}
                </div>
              ))}
              <div className="legend-item">
                <span className="legend-pill" style={{ fontSize: 10 }}>Unk</span> Unknown
              </div>
            </div>
          </div>

          <div className="progress-wrap">
            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${progressPct}%` }} /></div>
            <div className="progress-label">{answered} of {TOTAL_Q} answered</div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {SECTIONS.map((sec, si) => (
              <div key={sec.id} className="section-card">
                <div className={`section-title ${sec.secClass}`}>{sec.label} ({sec.questions.length} questions)</div>
                {sec.questions.map((qText, qi) => {
                  const gn = SECTION_Q_NUMS[si][qi]
                  const isUnanswered = triedSubmit && scores[gn] === undefined
                  return (
                    <div key={gn} className={`question${isUnanswered ? ' unanswered' : ''}`} data-q={gn}>
                      <div className="question-text">
                        <span className="question-number">{gn}</span>
                        {qText}
                      </div>
                      <div className="rating-row">
                        {[5, 4, 3, 2, 1].map(v => (
                          <label
                            key={v}
                            className={`rating-pill${scores[gn] === v ? ' selected' : ''}`}
                            onClick={() => handlePillClick(gn, v)}
                          >
                            <input type="radio" name={`q${gn}_score`} value={v} onChange={() => {}} checked={scores[gn] === v} readOnly />
                            {v}
                          </label>
                        ))}
                        <label
                          className={`rating-pill unk-pill${scores[gn] === 0 ? ' selected' : ''}`}
                          onClick={() => handlePillClick(gn, 0)}
                        >
                          <input type="radio" name={`q${gn}_score`} value={0} onChange={() => {}} checked={scores[gn] === 0} readOnly />
                          Unk
                        </label>
                      </div>
                      <label className="deal-killer-wrap">
                        <input
                          type="checkbox"
                          checked={killers[gn] || false}
                          onChange={e => handleKillerChange(gn, e.target.checked)}
                        />
                        <span className="dk-toggle" />
                        <span className="dk-label">Potential Deal Killer?</span>
                      </label>
                      <div className="validation-msg">Please rate this factor to continue.</div>
                    </div>
                  )
                })}
              </div>
            ))}

            <div className="submit-wrap">
              <button type="submit" className="btn-submit">Calculate Pursuit Score</button>
              <p className="submit-note">Rate all 35 factors to see your full results.</p>
            </div>
          </form>

          {submitted && (
            <div id="result" ref={resultRef} className={tier.cls} style={{ display: 'block' }}>
              <div className="result-score">{total}</div>
              <div className="result-out-of">out of 175</div>
              <div className="result-badge">{tier.badge}</div>
              <div className="result-headline">{tier.headline}</div>
              <div className="result-description">{tier.desc}</div>
              {dealKillerCount > 0 && (
                <div className="result-killers" style={{ display: 'block' }}>
                  ⚠ {dealKillerCount} potential deal killer{dealKillerCount > 1 ? 's' : ''} identified — proceed with extreme caution.
                </div>
              )}
              <div className="result-breakdown">
                {[
                  { val: `${pct}%`,            label: 'Pursuit Value'  },
                  { val: `${secScores[0]}/60`, label: 'Prospect Info'  },
                  { val: `${secScores[1]}/75`, label: 'Internal Info'  },
                  { val: `${secScores[2]}/40`, label: 'Market / Comp'  },
                  { val: ones,                 label: 'Rated 1'        },
                  { val: unks,                 label: 'Unknown'        },
                  { val: dealKillerCount,      label: 'Deal Killers'   },
                ].map(b => (
                  <div key={b.label} className="breakdown-item">
                    <div className="bd-val">{b.val}</div>
                    <div className="bd-label">{b.label}</div>
                  </div>
                ))}
              </div>
              <div className="result-actions">
                <button className="btn-print" onClick={printResults}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  Print / Save as PDF
                </button>
                <button className="btn-retry" onClick={resetForm}>Retake Assessment</button>
              </div>
            </div>
          )}

        </div>

        <aside className="score-pane">
          <div className="score-pane-inner">
            <ScorePane total={total} secScores={secScores} dealKillerCount={dealKillerCount} tier={tier} scores={scores} />
          </div>
        </aside>
      </div>

      <footer>© YRCI · Bid Pursuit Scorecard</footer>
      <div id="print-report" />
    </>
  )
}
