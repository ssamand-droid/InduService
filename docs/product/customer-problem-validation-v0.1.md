# InduService — Target Customer & Core Problem Validation v0.1

**Status:** DESK-RESEARCH SYNTHESIS + TESTABLE HYPOTHESES — NOT CUSTOMER-VALIDATED  
**Last reviewed:** 2026-10-20  
**Owner:** Product / Founder  
**Related master plan:** `docs/architecture/InduService-Architecture-Execution-Master-Plan-v1.0.md`  
**Decision rule:** Do not describe the target segment, pain, pricing, or product-market fit as “validated” until the evidence gates in this document have been passed.

---

## 1. Executive decision

### 1.1 Recommended beachhead hypothesis

Start validation with **small-to-mid-sized manufacturing plants that operate production-critical machinery, experience recurring maintenance/repair needs, and sometimes rely on external technicians or suppliers**. Prioritize, as a *test cohort rather than a settled market choice*:

1. Food and beverage production / packaging
2. Plastics processing and packaging
3. Other discrete/process manufacturers with production-critical equipment

The first customer should not be defined merely by industry or employee count. The useful selection criteria are operational: downtime matters, maintenance work repeats, work is coordinated across multiple people or suppliers, and the plant can identify a budget owner.

### 1.2 Core problem hypothesis

> When a production-critical machine fails or needs preventive service, the factory may have difficulty coordinating diagnosis, the right technician, compatible spare parts, approvals, execution evidence, and follow-up in one traceable process. The result may be longer time to restore production, repeated calls/messages, uncertain status and cost, weak maintenance history, and avoidable rework.

This is deliberately a **hypothesis**, not a claim that every factory experiences all these problems. It may turn out that the highest-value problem is narrower—for example, finding a qualified service provider quickly, sourcing the right spare part, or keeping internal preventive maintenance on schedule.

### 1.3 Initial product wedge

Test a narrow workflow before presenting InduService as a broad marketplace + CMMS + procurement + field-service suite:

**Factory submits a structured service request → InduService qualifies it → suitable provider responds with scope/price/time → factory approves → provider records work and evidence → factory confirms completion.**

Spare-parts sourcing can be tested as a linked use case when interviews show it is part of the same urgent incident. Full CMMS, predictive maintenance, subscriptions, broad ERP integration, and complex financial settlement should not be assumed necessary for the first release.

### 1.4 What the research currently supports

- Maintenance digitization is an established software category: providers such as MaintainX and Fiix publish plans covering work orders, preventive maintenance, assets, parts, purchasing and reporting. This confirms existing alternatives and a competitive category; it does **not** prove demand for InduService in its target geography. [MaintainX pricing](https://www.getmaintainx.com/pricing) · [Fiix pricing](https://fiixsoftware.com/cmms/pricing/)
- A 2024 literature review specifically identifies adoption challenges and opportunities for smart maintenance in SMEs. This supports investigating the SME segment, not assuming SMEs will buy. [IFAC-PapersOnLine review](https://www.sciencedirect.com/science/article/abs/pii/S2405896324015763)
- A 2024 maintenance engineering report summary describes continued use of spreadsheets and paper alongside CMMS. Its results apply to the report's surveyed population, not automatically to Iranian, Iraqi, Gulf, or all global factories. [RS 2024 Maintenance Engineering Report summary](https://www.controlsdrivesautomation.com/RS-2024-Maintenance-Engineering-Report)
- A 2025 U.S. manufacturing survey published by L2L reports substantial downtime among its respondents. It is vendor-sponsored research focused on U.S. manufacturing and must not be used as a universal cost benchmark or a local-market estimate. [L2L report summary](https://www.l2l.com/blog/2025-report-manufacturing-downtime)
- The World Bank maintains Iran indicators on firms experiencing electrical outages and sales lost due to outages. These are relevant context for production continuity, but electrical outages are not the same thing as machine-maintenance failures, and the country pages alone do not establish InduService demand. [Firms experiencing outages — Iran](https://data.worldbank.org/indicator/IC.ELC.OUTG.ZS?locations=IR) · [Sales lost due to outages — Iran](https://data.worldbank.org/indicator/IC.FRM.OUTG.ZS?locations=IR)

**Bottom line:** The problem category is plausible and the software category exists. Target-country demand, urgency, preferred buyer, ability to pay, current workaround, supplier-side participation, and a defensible entry segment remain **unvalidated**.

---

## 2. Customer is not one persona

InduService has at least two sides to any service marketplace and may later have a third (parts suppliers). They must be validated separately.

| Role | Likely person | Job to be done | What must be learned |
|---|---|---|---|
| Economic buyer | Plant manager, factory owner, operations director, maintenance manager (varies by company) | Restore production reliably; control cost and operational risk | Who owns budget? What event justifies spending? Which approval is required? |
| Daily problem owner | Maintenance manager, chief engineer, maintenance planner, shift supervisor | Prioritize jobs, find technicians/parts, track work and history | Where does the current process break down? Which data is missing? |
| Requester / user | Production supervisor, line operator, warehouse or utility staff | Report a fault and know what happens next | Can they submit a useful request quickly from the shop floor? |
| Service provider | Independent technician, service company, OEM/authorized agent | Receive qualified leads, scope jobs, quote, schedule, document and get paid | Will they respond through the platform? What fees, trust and payment terms are acceptable? |
| Parts supplier | Industrial spare-parts distributor / importer / manufacturer | Receive accurate requests and quote compatible parts | Can the platform obtain reliable specs, availability, lead time and warranty terms? |
| Blocker / control function | Procurement, finance, IT, legal, quality, HSE | Control vendor, purchasing, security and compliance risks | What prevents adoption even if the maintenance team wants it? |

**Validation implication:** A positive interview with a maintenance engineer is not proof that the plant will pay. A factory-side buyer and a service-provider-side participant must both be tested. The platform can fail even when factories have pain if providers will not quote or fulfil jobs; it can also fail if providers join but factories do not trust the quality, price or accountability.

---

## 3. Candidate customer segments and prioritization

The following is a **provisional test ranking**, not a measured market ranking. Score segments after interviews, not before.

| Candidate segment | Why it may fit | Main risk / disconfirming possibility | Priority for discovery |
|---|---|---|---|
| Food, beverage and packaging plants | Production depends on lines, utilities, filling/packing equipment; a service incident can affect output and delivery commitments | Large plants may already have approved vendors and internal systems; smaller plants may lack budget or formal procurement | **A — first cohort to test** |
| Plastics processors and packaging converters | Repeated machine and mold maintenance; specialist technicians and compatible parts can matter | Some may rely on a tight local technician network and prefer direct calls | **A — first cohort to test** |
| General manufacturing SMEs | Broad need for repair and maintenance coordination | Too broad; equipment, purchasing behavior and willingness to pay vary widely | B — use as comparison group |
| Large multi-site industrial enterprises | Higher complexity, more assets, governance and reporting needs | Long procurement/security/integration cycles; existing CMMS/EAM/ERP may be entrenched | C — not the initial wedge unless access is unusually strong |
| Workshops and very small factories | Easier access and potentially fast decisions | Low incident volume, low contract value, informal habits, weak repeatability | B/C — test only as a contrast |
| Service companies / independent technicians | Need to acquire customers, qualify requests and manage quote/work evidence | May not want transparent competition, fees, or platform control over customer relationship | Parallel supply-side cohort |
| Spare-parts sellers | Need better-qualified inquiries and purchase intent | Inventory accuracy, counterfeit/compatibility risk, credit terms and availability data can be difficult | Parallel experiment after factory interviews |

### Segment selection scorecard

Score each candidate segment from 1 to 5 after evidence collection:

- Incident frequency and severity
- Measurable cost of downtime / delay / rework
- Frequency of external-service use
- Difficulty finding a qualified technician
- Difficulty identifying and sourcing compatible parts
- Fragmentation of current workflow (calls, messaging apps, spreadsheets, paper)
- Buyer authority and budget availability
- Repeat purchase potential
- Ability to reach decision-makers at reasonable cost
- Availability of enough trustworthy service providers
- Willingness to test and pay
- Sales cycle and operational/legal friction (reverse score: lower friction is better)

Do not turn these scores into a “market size” claim. They are a decision aid for selecting the first cohort. Record the interview, quote, artifact, or observed behavior behind every score.

---

## 4. Problem tree: what may actually hurt

### P1 — Time to restore production

Potential symptoms:
- It takes too long to identify the right technician or service company.
- The request lacks machine model, fault description, photos, site details or urgency.
- The provider needs multiple calls to understand the job.
- The factory cannot tell when the provider will arrive or when production can restart.

**Proof required:** recent incident timeline with timestamps; compare time from detection to qualified response, arrival, repair start and production hand-back. Separate waiting for technician, waiting for parts, diagnosis, repair, and production validation.

### P2 — Spare-parts uncertainty

Potential symptoms:
- Part identification is incomplete or incompatible.
- Multiple suppliers are contacted manually.
- Availability, delivery date, authenticity, warranty or return terms are unclear.
- The factory buys the wrong part or waits for a quote.

**Proof required:** a recent parts request, number of suppliers contacted, quote turnaround, lead-time variation, wrong-part/return events, and the person responsible for confirming compatibility. Do not assume the platform can guarantee authenticity or compatibility without a verified supply chain and technical review.

### P3 — Fragmented coordination and weak traceability

Potential symptoms:
- Requests and approvals are spread across phone calls, messaging apps, paper, spreadsheets and separate vendor systems.
- Nobody has a reliable view of status, owner, promised date, scope or approved cost.
- Work reports, photos, used parts and sign-off are not consistently retained.

**Proof required:** ask the participant to walk through the latest real incident and, with permission, show a redacted work order, spreadsheet, message thread, service report or purchase request. Do not ask for confidential production data unnecessarily.

### P4 — Reactive rather than planned maintenance

Potential symptoms:
- Preventive tasks are missed or completed without a reliable record.
- Asset history is unavailable when a failure recurs.
- Maintenance planning is difficult because of limited staff, data or time.

**Proof required:** scheduled vs completed PM tasks, missed-task reasons, repeat failure records, backlog and whether the team has authority and time to act on the information. This problem may point toward CMMS rather than a service marketplace; do not conflate the two.

### P5 — Service quality, scope and accountability

Potential symptoms:
- Quote scope is ambiguous; additional work or cost appears later.
- The factory cannot compare offers on the same basis.
- Completion, acceptance, warranty and rework responsibilities are disputed.
- The factory is reluctant to use an unfamiliar provider.

**Proof required:** recent disputes, rework, unplanned extra charges, vendor qualification rules, acceptance evidence and warranty process. A platform workflow can improve traceability but cannot by itself guarantee technical quality.

### P6 — Provider-side business friction

Potential symptoms:
- Technicians receive vague, low-quality leads.
- Travel and diagnostic effort are unpaid or not priced properly.
- Scheduling, quote follow-up, collections and customer records are manual.
- Providers fear a platform will commoditize their expertise or take the customer relationship.

**Proof required:** provider interviews about lead quality, quote conversion, unpaid diagnosis, travel, utilization, collection time, repeat customers and acceptable platform economics.

### The problem to avoid claiming

Do not say “factories have no maintenance software,” “all factories lose large sums to downtime,” “technicians cannot be found,” or “spare parts are always hard to source” without local, segment-specific evidence. A factory with a capable internal team and a mature CMMS may not need the first version of InduService.

---

## 5. Current alternatives and competition

The competitor is not only another software platform. It is the entire current workaround:

1. Internal technician / maintenance team
2. Known technician contacted directly by phone or messaging app
3. OEM or authorized service contract
4. Procurement's approved vendor list and manual RFQ
5. Spreadsheet, paper work order, maintenance log or shared messaging group
6. Existing CMMS/EAM/ERP or a local maintenance application
7. Informal parts network, distributor or equipment importer
8. Doing nothing / delaying the repair / operating until failure

Commercial software products such as MaintainX and Fiix offer combinations of work orders, PM, assets, inventory, purchasing and reporting, with free and paid tiers. This creates a strong competitive constraint: InduService should not compete by merely recreating generic work orders. Its possible differentiation is **a trusted, locally relevant path from a factory's service need to a qualified provider/part, with comparable offers and accountable fulfilment**—but only if interviews demonstrate that sourcing/coordination is a bigger unmet need than internal maintenance tracking.

### Questions to answer about alternatives
- What is used today and who pays for it?
- What works well enough that the customer will not change?
- What is the last workaround that failed?
- What is the cost of switching, onboarding assets and training users?
- Does the factory need another system, or only a better service network and a lightweight request/quote workflow?
- If a CMMS already exists, would InduService integrate with it, serve only external work, or be rejected as duplicate?

---

## 6. Proposed value proposition to test

Do not use one broad claim for every persona. Test alternatives in plain language.

**Factory-side proposition A — faster qualified response**  
“Submit one structured service request and receive a response from a relevant, screened service provider, with scope, price and expected timing recorded.”

**Factory-side proposition B — accountable external maintenance**  
“Keep the quote, approval, job evidence, completion confirmation and service history for external maintenance in one traceable workflow.”

**Factory-side proposition C — service plus parts**  
“When a machine fails, coordinate diagnosis, service and compatible spare-parts sourcing through one request, with availability and lead time confirmed before approval.”

**Factory-side proposition D — preventive maintenance**  
“Plan recurring maintenance and keep evidence that scheduled tasks were completed.”

**Provider-side proposition E — qualified leads**  
“Receive better-described industrial service requests, submit comparable quotes, document the work and build repeat business.”

Ask participants to rank the propositions only after discussing a real past event. Verbal enthusiasm is weak evidence. Stronger evidence is sharing a real case, introducing the budget owner, providing a redacted example, agreeing to a pilot, or paying a pilot fee.

---

## 7. Discovery protocol

### 7.1 Sample and recruitment

**Initial discovery target:** 20–30 interviews over 3–5 weeks, adjusted for access and saturation:
- 12–18 factory-side interviews, including the economic buyer and maintenance/problem owner where possible
- 6–8 service-provider interviews
- 3–5 parts suppliers or procurement stakeholders

These are proposed research targets, not statistically representative sample sizes. Use purposive sampling to compare different company sizes, equipment types, and maintenance maturity. Do not interview only personal contacts who are likely to agree.

For the first cohort, seek a mix of:
- Food/beverage/packaging
- Plastics processing
- One comparison segment from general manufacturing
- Plants that use a CMMS and plants that rely mainly on manual processes
- Plants with internal technicians and plants that outsource at least some work

Record geography and currency explicitly. The primary launch geography is **still undecided** and must be chosen based on reachable customers, legal/payment realities, supplier coverage and willingness to pay—not on assumptions from the founder's network alone.

### 7.2 Interview rules

- Ask about the **last actual incident**, not what the person thinks might happen.
- Do not pitch the product before understanding the existing workflow.
- Ask for ranges and examples; do not pressure participants to reveal confidential figures.
- Separate fact (“the technician arrived after 9 hours”) from interpretation (“our process is inefficient”).
- Ask what they did, how long it took, who was involved, what it cost, and what happened next.
- Record evidence with permission; anonymize names, plant data, supplier details and sensitive documents.
- Do not treat a survey response or a polite “sounds useful” as willingness to pay.

### 7.3 Factory interview script

1. Tell me about the most recent unplanned machine stop or urgent service need.
2. Which machine/line was affected, and what was the operational consequence?
3. When was the problem detected? When did a qualified person respond, arrive, begin work and hand the machine back to production?
4. Who was contacted first, and how were other technicians or suppliers found?
5. How many calls/messages/quotes were needed? What information had to be repeated?
6. Was a spare part needed? How was it identified, availability checked and compatibility approved?
7. What was the total cost, including service, parts, travel, overtime, scrap/rework, and production impact if known? Which part is measured versus estimated?
8. How was scope and price approved? Was there a purchase order or approved-vendor requirement?
9. How were the repair, parts used, photos, report, acceptance and warranty recorded?
10. What was the most frustrating step? What was merely inconvenient versus commercially serious?
11. How often did a similar event occur over the last 3–6 months?
12. What system or workaround do you use today? What does it do well?
13. Have you tried to solve this before? What did you spend, and why did it succeed or fail?
14. Who controls the budget for this problem? What would have to be true for that person to approve a new service?
15. May we review a redacted example of the request, quote, work order or report?
16. Would you nominate one real upcoming job for a small pilot? Who else must approve it?

### 7.4 Service-provider interview script

1. What types of machines and jobs do you actually support, and in which locations?
2. Where do new factory customers come from today?
3. What makes an inquiry quote-ready versus too vague to price?
4. How much time is spent qualifying a request, visiting the site, diagnosing and preparing a quote?
5. Which diagnostic or travel activities are unpaid?
6. How often do you quote and lose? Why?
7. What information must be known before you commit to a date and price?
8. How do you record parts, hours, photos, customer approval, completion and warranty?
9. What is the usual payment/collection process and where do disputes occur?
10. Would you accept platform leads? What would make you refuse?
11. Which fee model would you consider: subscription, qualified lead fee, transaction commission, or customer-paid coordination fee? Why?
12. What customer relationship, price transparency, liability, quality or payment concerns would stop you joining?
13. Can you nominate a real job to process through a pilot?

### 7.5 Evidence sheet for every interview

Capture:
- Interview ID/date, segment, geography, role, company size band
- Equipment/process type and maintenance maturity
- Most recent real incident and timeline
- Current workflow and alternatives
- Measured cost vs estimate vs unknown
- Frequency / repeatability
- Decision-maker, budget owner and procurement blockers
- Evidence artifacts seen (with permission) and redaction status
- Most painful step in the participant's own words
- Existing solution strengths
- What would disprove the hypothesis
- Pilot commitment and next action
- Researcher's confidence and unresolved questions

---

## 8. Validation experiments and pass/fail gates

### Experiment 1 — Problem interviews

**Question:** Is the proposed problem frequent, costly and inadequately solved for the selected segment?

Pass to the next stage only if:
- At least 8 of the first 12 factory interviews describe a recent, specific incident matching the hypothesized workflow problem (not just general agreement).
- At least 6 of those 12 can identify a concrete consequence or delay and explain the current workaround.
- At least 5 identify external service sourcing, quote/approval coordination, parts uncertainty or completion accountability as a top-three issue.
- The pattern is present across more than one company, not driven by one unusually large incident.

These thresholds are **provisional decision rules**, not industry benchmarks. If they fail, narrow or replace the problem instead of changing the data to fit the hypothesis.

### Experiment 2 — Existing-workflow artifact review

With consent, review at least 5 redacted examples across different plants: service requests, quote comparisons, job reports, parts RFQs, work orders or PM records.

**Pass signal:** repeated gaps are visible in request completeness, response time, quote comparability, approval traceability, completion evidence or history.  
**Fail signal:** current processes are already consistent, measurable and satisfactory for the target workflow.

### Experiment 3 — Concierge pilot (manual before automation)

Run 3–5 real jobs with factories and a small vetted provider pool. Manually coordinate through the proposed workflow before building more software. Log timestamps, quote responses, scope changes, completion evidence, customer acceptance and disputes.

**Suggested pilot measures:**
- Time to first qualified provider response
- Number of providers contacted per job
- Percentage of requests receiving a usable quote
- Quote turnaround time
- Time from approval to arrival / work start
- Job completion and customer acceptance rate
- Rework/dispute rate
- Customer and provider repeat-use intent backed by a concrete next job
- Actual willingness to pay and who pays

Set baseline and target with the customer before each pilot. Do not claim causal savings without a defensible baseline and comparable cases.

### Experiment 4 — Willingness to pay

Do not ask only “Would you pay?” Instead:
- Ask what the customer currently spends and from which budget.
- Offer a clearly scoped, time-bounded paid pilot with price and deliverables.
- Ask the buyer to approve it, sign a pilot letter, issue a PO, or pay a deposit where commercially and legally appropriate.
- Test who pays: factory subscription, fee per completed job, supplier commission, paid sourcing service, or a hybrid.
- Record objections and compare them with the real alternative's cost.

**Strong signal:** at least 2 unrelated factories agree to a paid pilot or equivalent concrete purchasing step, and at least 3 providers agree to fulfil pilot jobs under explicit terms.  
**Weak signal:** compliments, survey interest, email sign-ups, or “contact me later” without a defined job or decision date.

### Experiment 5 — Segment comparison

Compare the first cohort against at least one adjacent segment. Choose the beachhead by a combination of pain intensity, repeat frequency, access, budget, sales-cycle friction, provider availability and pilot conversion—not by the largest theoretical industry size.

---

## 9. How to estimate the economic pain

Do not copy a global downtime-cost figure into the local business case. Calculate per incident with the factory and label the source of every number.

A basic estimate:

**Incident cost = lost contribution margin during stoppage + scrap/rework + overtime/expediting + service/travel + parts/consumables + other documented costs.**

Avoid double counting. If the plant cannot reliably estimate lost production, record downtime hours and the operational consequence separately instead of inventing a monetary figure. Distinguish:
- Machine stop time
- Waiting for diagnosis/provider
- Waiting for parts
- Active repair time
- Restart / quality validation time
- Production loss actually realized vs theoretical capacity

The value InduService can claim is only the portion it can plausibly influence—e.g. shorter sourcing/response time or less coordination effort—not the entire downtime cost. Validate this with the pilot.

---

## 10. Geography and go-to-market decision

The launch geography is an open decision. Candidate markets may include Iran, Iraq and selected Gulf markets because of potential industrial access, but **no choice is validated by the current desk research**.

For each geography, assess:
- Number of reachable target plants, not just national factory counts
- Founder/team access and cost to reach the buyer
- Density and quality of available providers by equipment category
- Language, contracts, liability, tax and invoicing requirements
- Payment collection and platform fee feasibility
- Data hosting, security and customer procurement constraints
- Cross-border service logistics, spare-parts imports and warranty responsibility
- Competitive alternatives and local trust networks
- Ability to conduct 3–5 real pilot jobs quickly

A country-level industrial statistic is not enough to estimate a serviceable market. Build a named prospect list and provider map. Estimate serviceable opportunity from reachable plants × plausible annual jobs per plant × realistic revenue per job/contract, using observed pilot values rather than arbitrary assumptions.

---

## 11. Decision framework

At the end of discovery, choose one of four outcomes:

- **Proceed:** recurring urgent problem, clear buyer, reachable segment, providers available, real pilot demand and evidence of willingness to pay.
- **Narrow:** problem is real only for one machine family, industry, job type or geography.
- **Pivot the wedge:** internal PM/CMMS, spare-parts sourcing, external service coordination, or provider lead generation is the stronger first problem.
- **Stop / defer:** incidents are infrequent, existing alternatives work well, no budget owner emerges, provider supply is unreliable, or pilots do not convert.

A failed hypothesis is a useful result. Do not preserve the broad product vision by forcing every feature into the first release.

---

## 12. What is not yet validated (continuation register)

- [ ] Launch geography and first city/industrial cluster
- [ ] Industry beachhead: beverage/packaging vs plastics vs another segment
- [ ] Exact company-size / asset-criticality threshold
- [ ] Most painful job-to-be-done: sourcing provider, parts, workflow accountability, or preventive maintenance
- [ ] Buyer and budget owner for each selected segment
- [ ] Current workaround prevalence in the chosen geography
- [ ] Local incident frequency and cost range
- [ ] Factory willingness to share a job and run a pilot
- [ ] Service-provider participation and willingness to accept platform terms
- [ ] Parts supplier data quality, compatibility, availability and warranty feasibility
- [ ] Pricing, payer, commission model and collection method
- [ ] Legal / contractual allocation of technical responsibility, warranty, safety and disputes
- [ ] Pilot baseline, success metrics and comparison method
- [ ] Customer acquisition channel and sales-cycle length
- [ ] Whether a CMMS is needed in the first release or should remain a later module

### Required artifacts before marking this work “validated”
- [ ] 20–30 interview records or a documented reason to stop earlier
- [ ] Segment scorecard with evidence attached to each score
- [ ] At least 5 anonymized workflow artifacts where permission is granted
- [ ] Named list of reachable pilot factories and providers
- [ ] Pilot design, terms, baseline and measurement plan
- [ ] Concrete paid-pilot or purchasing evidence
- [ ] PRD update based on findings and explicit approval of the beachhead

---

## 13. Source register and limitations

1. **IFAC-PapersOnLine (2024)**, *Challenges and Solutions to Adopt Smart Maintenance in SMEs: A Literature Review and Research Agenda*. Useful for framing SME adoption barriers/opportunities; it is a literature review, not a survey proving local demand. https://www.sciencedirect.com/science/article/abs/pii/S2405896324015763
2. **MaintainX**, current pricing/features page. Useful for identifying category features and an existing alternative; vendor marketing, not independent market research. https://www.getmaintainx.com/pricing
3. **Fiix**, current pricing/features page. Useful for competitive alternatives and monetization context; vendor marketing, not independent market research. https://fiixsoftware.com/cmms/pricing/
4. **RS 2024 Maintenance Engineering Report summary**, reporting surveyed maintenance practices. Sample and scope should be checked in the original report before using precise percentages; do not generalize to the chosen launch market. https://www.controlsdrivesautomation.com/RS-2024-Maintenance-Engineering-Report
5. **L2L 2025 downtime survey summary**, U.S.-focused, vendor-published research. Use only as contextual evidence that downtime is studied as an operational issue; do not apply its cost figures to another country or customer segment. https://www.l2l.com/blog/2025-report-manufacturing-downtime
6. **World Bank Enterprise Survey indicators for Iran**, electricity-outage indicators. Useful context only; electricity outages are not the same as equipment maintenance failures, and the pages must be inspected for exact year/value before any numeric claim. https://data.worldbank.org/indicator/IC.ELC.OUTG.ZS?locations=IR and https://data.worldbank.org/indicator/IC.FRM.OUTG.ZS?locations=IR

**Evidence quality policy:** Public secondary sources support the plausibility of the problem category and the existence of alternatives. They do not validate InduService's chosen customer, local market size, customer acquisition cost, product-market fit, or willingness to pay. Those require primary evidence from the target market.

---

## 14. Current conclusion

**Recommendation:** approve this document as the discovery protocol and working hypothesis, not as proof of market demand. Start with reachable food/beverage/packaging and plastics plants only as a test cohort; compare them with at least one adjacent segment. Focus on the last real external maintenance incident and run a concierge pilot before broad implementation.

**Current status:** PROPOSED / PENDING CUSTOMER EVIDENCE  
**Confidence:** Moderate that maintenance coordination and production continuity are credible problem areas in manufacturing; low-to-moderate that the proposed beachhead and marketplace wedge are the best first choice; low that willingness to pay or local market size is established.  
**Next action:** recruit interviewees, run the discovery protocol, record evidence, then revise the first-release PRD and master-plan continuation register.
