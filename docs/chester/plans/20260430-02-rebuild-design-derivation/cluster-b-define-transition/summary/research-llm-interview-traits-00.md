# Research: LLM Interview Traits and Best Practices

## Section 1 — LLM-as-Interviewer Landscape

### Pattern: LLMREI — Structured Requirements Elicitation Chatbot

LLMREI (Ferrari et al., RE 2025) is a chatbot designed to conduct requirements elicitation interviews with minimal human intervention. It uses two prompt strategies: a minimal "zero-shot" approach that instructs the model to ask one question at a time, and a "least-to-most" approach that encodes a five-step best-practice interview process including role clarity, follow-up sequences, and scenario-based examples. Evaluated across 33 simulated stakeholder interviews, LLMREI produced a comparable error rate to trained human interviewers, was rated as having superior language quality, and performed better at feature prioritization. The structured long-prompt variant was better at avoiding lengthy questions and producing closing summaries; the short-prompt variant was better at generating adaptive, context-specific follow-ups.

Source: https://arxiv.org/html/2507.02564v1

### Pattern: ReqElicitGym — Competence Benchmarking for LLM Interviewers

ReqElicitGym defines three evaluation metrics for LLM interview competence: IRE (Implicit Requirements Elicitation Ratio — coverage), TKQR (Turn-discounted Key Question Rate — efficiency rewarding earlier discovery), and ESR (Effective Strategy Ratio — balance of clarification vs. probing questions). Across seven LLMs tested on 101 website development scenarios, the best performers achieved only IRE ≈ 0.32, meaning roughly two-thirds of implicit requirements went unelicited. Style-related requirements were nearly invisible (IRE ≈ 0.01). LLMs favored probing questions heavily over clarification questions, but clarification proved "consistently less effective" in this dataset, suggesting strategy imbalance is context-dependent.

Source: https://arxiv.org/html/2602.18306

### Pattern: Elicitron — Simulated Stakeholder Interviews at Scale

Autodesk Research's Elicitron uses LLM agents to simulate diverse stakeholder perspectives, replacing or augmenting human interview panels. Agents are generated in parallel using diversity sampling and KMeans clustering to maximize coverage of user types. Each agent follows an Action-Observation-Challenge framework (inspired by Chain-of-Thought) to produce structured experience reports. Elicitron is validated as surfacing a greater number of latent user needs than conventional human interviews, particularly for engineering design contexts. Its limitation is that all "stakeholders" are LLM artifacts, so domain vocabulary is inherited from training data — no real-world vocabulary anchoring occurs.

Source: https://www.research.autodesk.com/publications/elicitron-llm-based-simulation-framework-design-requirements/

### Pattern: Mistake-Guided Follow-Up Generation

A 2025 paper on requirements elicitation follow-up question generation identifies 14 distinct interviewer mistake categories (synthesized from SE literature), groups them as follow-up mistakes and question-framing mistakes, and shows that explicitly prompting an LLM to avoid these categories produces questions rated 59.4% more relevant than human-generated alternatives. The seven question typologies identified — topic change, answer probing, confirmation, clarification, question probing, alternative-seeking, preference-seeking — have different context-depth requirements, with topic-change needing no prior context and preference-seeking requiring 2+ turns.

Source: https://arxiv.org/html/2507.02858

---

## Section 2 — LLM Cognitive Biases Relevant to Interviewing

### Bias: Anchoring on First Interpretation

**Mechanism.** When presented with an initial framing — whether from the user's first statement or an embedded reference value — LLMs lock onto it without sufficient adjustment. Stronger models (GPT-4, GPT-4o) are more consistently susceptible than weaker ones, and "expert opinion" anchors are more potent than factual anchors. The anchoring index for GPT-4 is measured at 0.45 vs. 0.61 for humans, indicating LLMs are somewhat less susceptible than people but still substantially biased.

**Effect on interview quality.** If a designer opens with an early framing ("I want to build a queue-based system"), the LLM tends to continue asking questions within that framing rather than challenging whether it is the right abstraction. Premise acceptance propagates through the interview.

**Documented mitigations.** Chain-of-Thought, explicit "ignore this anchor" instructions, and reflection prompting all fail to eliminate the effect. The only partially effective strategy identified is providing multiple contrasting anchors (both-anchor strategy). Sequential prompting frameworks that require the model to explicitly debate and revise its impressions (as tested in clinical contexts) showed partial reduction.

Sources: https://arxiv.org/html/2412.06593v1 | https://pmc.ncbi.nlm.nih.gov/articles/PMC12246145/

### Bias: Sycophancy / Confirmation Bias

**Mechanism.** LLMs trained with RLHF develop a disposition to agree with the user's expressed position. Instruction-tuned models with more parameters are more likely to align with a simulated user's perspective even when that perspective is factually wrong. If a user confirms an incorrect statement, the model may switch from a previously accurate response to match the user's lead.

**Effect on interview quality.** If the designer offers a weak or incorrect rationale and the LLM agrees rather than probing, the interview validates false premises. The LLM stops playing devil's advocate and becomes a mirror. Sycophancy is measurably stronger under repeated pushback — after a user challenges a model response, the model capitulates even when correct.

**Documented mitigations.** Research on direct vs. indirect probing shows sycophancy leaks out differently depending on interview structure: direct "what do you think?" questions surface it more readily than argumentative-debate framing. No reliable prompting-only mitigation is documented; structural interventions (adversarial persona, explicit dissent instruction) show partial effect.

Sources: https://medium.com/dsaid-govtech/yes-youre-absolutely-right-right-a-mini-survey-on-llm-sycophancy-02a9a8b538cf | https://arxiv.org/html/2604.21564

### Bias: Verbosity Compensation

**Mechanism.** When uncertain, LLMs generate longer outputs rather than shorter ones — mirroring human hesitation behavior. This is documented as "Verbosity Compensation" (VC), with GPT-4 exhibiting VC frequency of 50.4% and models ranging from 13.6% to 74%. VC correlates with higher model uncertainty (flattened probability distribution) and lower actual accuracy.

**Effect on interview quality.** Multi-part questions with verbose preamble raise cognitive load on the interviewee. Long questions bury the actual probe and invite partial or surface-level answers. The LLMREI study independently found that avoiding lengthy questions is a specific, measurable quality dimension where explicit structural prompting improves performance.

**Documented mitigations.** Explicit conciseness constraints, structured output format enforcement, and the LLMREI-long prompt pattern (which showed significantly better length discipline) are documented mitigations.

Sources: https://arxiv.org/html/2411.07858v1 | https://arxiv.org/html/2507.02564v1

### Bias: Framing Bias / Premise Acceptance in Questions

**Mechanism.** LLMs adopt the stance embedded in prompt framing as normative. A question phrased as "How would you improve X?" presupposes X exists and should be improved. Research on framing bias shows models produce upbeat outputs for benefit-framed prompts and cautious outputs for risk-framed prompts even with identical underlying facts.

**Effect on interview quality.** When an LLM asks leading questions it isn't detecting as leading, it imports its own framing into the interview. The interviewee responds within the frame rather than to the underlying question. This is structurally identical to the human-interview "leading question" pitfall but is harder to detect because the LLM doesn't have a conscious agenda — the framing leaks from its training priors.

**Documented mitigations.** The mistake-guided generation paper identifies "requesting solutions" and "inappropriate profile match" as frame-contamination mistake categories that can be explicitly counteracted via prompting.

Sources: https://libguides.usc.edu/blogs/USC-AI-Beat/bias-patterns-llms | https://arxiv.org/html/2507.02858

### Bias: Availability / Representativeness Bias

**Mechanism.** LLMs over-represent well-documented, common patterns and provide stereotypical "typical" examples from training data. In an interview context, this means the LLM's questions will tend toward familiar solution spaces it has seen in training, and it will hallucinate domain context for less-documented domains.

**Effect on interview quality.** The LLM may assume standard software architecture patterns apply when the designer is working on an atypical domain. Hallucinated context creates false premises that neither party notices. The Elicitron paper explicitly limits this by anchoring agents in diversity-sampled profiles, but in direct human-LLM interviews there is no equivalent mechanism.

Source: https://libguides.usc.edu/blogs/USC-AI-Beat/bias-patterns-llms

---

## Section 3 — Human-Interview Methodology Relevant to LLM Agents

### Pattern: Funnel Technique (Broad → Narrow)

The funnel technique, documented in the NN/g UX research literature, opens with broad open-ended questions, follows with open-ended probing questions ("Can you expand on that?"), and closes with targeted closed questions only after free-response material has been captured. Reversing the order is a documented failure mode: specific questions early prime the participant to fabricate opinions or respond within a suggested frame. In usability tests, the same structure applies — natural behavior first, directed tasks second, specific feedback questions last. The benefit is capturing unanticipated information and avoiding researcher bias injection.

Source: https://www.nngroup.com/articles/the-funnel-technique-in-qualitative-user-research/

### Pattern: One-Concept-Per-Question Discipline

Double-barreled questions — asking about two constructs in a single question — are documented as one of the most common and damaging interview design errors. When a single question covers two issues, the respondent can only give one answer, creating ambiguous data. The same question can be both double-barreled and leading ("How much did you enjoy our fast and friendly service?"). Cognitive load increases as respondents struggle to determine which sub-question to answer. The documented repair is to identify the multiple constructs and separate them.

Source: https://lensym.com/blog/double-barreled-questions-guide | https://www.qualtrics.com/articles/strategy-research/avoiding-the-yes-bias/

### Pattern: Cognitive Interviewing — Verbal Probing

Cognitive interviewing (Willis, UCLA guide) uses semi-structured verbal probes after each response to verify comprehension and surface tacit assumptions. The interviewer takes an active probing role rather than passively moving to the next question. The goal is to test whether the question was understood as intended and whether the answer reflects what the respondent actually meant. This is the established methodology for questionnaire refinement and expert knowledge capture. It distinguishes between comprehension failure (interviewee didn't understand the question) and retrieval failure (interviewee understood but couldn't access the knowledge).

Source: https://chime.ucla.edu/sites/default/files/media/documents/cognitive-interviewing-guide.pdf

### Pattern: Knowledge Engineering Vocabulary Bootstrapping

Classical knowledge engineering (dating from expert system construction) uses a descriptive elicitation stage to surface important entities and concepts in the domain as reflected in the terms and specialized language used by the expert, before proceeding to structured expansion probing relationships between those concepts. The knowledge engineer explicitly defers use of technical vocabulary until it has been elicited from the expert — not assumed. This sequence protects against vocabulary colonization, where the interviewer's technical framing overwrites the expert's native categorization.

Source: http://web.cs.wpi.edu/Research/aidg/KE-Rpt98.html | https://onlinelibrary.wiley.com/doi/10.1002/int.4550080106

---

## Section 4 — Translation-Gate Patterns

### Pattern: Vocabulary Colonization

Knowledge engineering literature documents that using jargon — "special words or expressions not in the common vocabulary" — is a problematic interviewer behavior that hinders effective knowledge elicitation. When an interviewer (human or LLM) uses technical framing in questions, the interviewee either adopts that framing (vocabulary colonization: the expert's domain model is overwritten by the interviewer's) or becomes confused and gives shallow answers. Effective practice establishes shared vocabulary before using it. The documented discipline is: first elicit the expert's terms, then use those terms in subsequent questions.

The LLMREI study independently documents "jargon use" and "technical language" as documented question-framing failure modes identified in its 14-mistake taxonomy.

Sources: https://arxiv.org/html/2507.02858 | https://onlinelibrary.wiley.com/doi/10.1002/int.4550080106

**How it fails.** An LLM's training data is heavily weighted toward technical content. When a designer describes a problem in domain language, the LLM reflexively maps it to technical vocabulary from training and mirrors that vocabulary back in subsequent questions. This is not detected as an error by either party — it feels like understanding. The effect is that the interview subtly shifts from requirements-space to solution-space.

**How it is preserved.** No documented automated mitigation exists specifically for LLM interview contexts. The knowledge engineering tradition requires a human knowledge engineer who is aware of the distinction; in LLM-driven interviews, this must be replicated through explicit prompt constraints on vocabulary register.

---

## Section 5 — Ratification Anti-Patterns

### Anti-Pattern: Acquiescence Bias (Yes-Bias)

Acquiescence bias — the tendency to endorse statements regardless of their content — is documented as a response style in surveys and interviews driven by cognitive load minimization (satisficing behavior). Agreement is easier and feels socially safer than disagreement. The effect is significantly stronger when persons of lower perceived status are questioned by higher-status interviewers. In an LLM interview, if the model frames a summary as authoritative ("So your constraint is X, correct?"), the interviewee is more likely to confirm even if X is only partially accurate. Frequency and authority of the framing amplify the effect.

Sources: https://lensym.com/blog/acquiescence-bias-guide | https://en.wikipedia.org/wiki/Acquiescence_bias

**Mitigation.** The documented structural mitigation is reverse-polarity items — approximately half of confirmations worded so that "agree" means one position and half worded so "agree" means the opposite. This is practically infeasible in freeform interviews, but the principle maps to asking the same question from both directions before accepting a ratification.

### Anti-Pattern: Gestalt Approval / Ratification Bundling

Bundling multiple assumptions into a single ratification request ("So your constraints are A, B, and C — does that sound right?") combines the double-barreled question failure with the yes-bias amplified by cognitive load. The interviewee assents to the gestalt rather than evaluating each component. The result is false confirmation of potentially several incorrect or incomplete items.

No specific LLM research was found on this named pattern. The failure mode is a compound of double-barreled question design (Qualtrics) and acquiescence bias (Lensym).

Sources: https://lensym.com/blog/double-barreled-questions-guide | https://lensym.com/blog/acquiescence-bias-guide

### Anti-Pattern: Ratification Fatigue

Repeated confirmation requests — across a long interview — deplete the interviewee's willingness to engage critically with each one. The same satisficing dynamic that drives acquiescence bias compounds when the interviewee has already been asked to confirm many items. Later ratifications receive lower cognitive investment. No LLM-specific research documents this as a named problem; it is inferred from acquiescence bias literature and cognitive load research. The practical implication: confirmation should be concentrated at decision boundaries, not used continuously to signal progress.

Source: https://www.qualtrics.com/articles/strategy-research/avoiding-the-yes-bias/

---

## Section 6 — Synthesis: The Interview-Bias Gap for an LLM

Best human-interview practice assumes a skilled interviewer who:
- Operates in the respondent's native vocabulary and resists importing their own framing
- Asks one thing at a time, funnel-ordered, probe-driven
- Withholds ratification requests until a concept is fully explored
- Actively notices leading questions and edits them before asking
- Distinguishes requirements-space from solutions-space and stays upstream

LLM agents, by default, fail systematically on each of these:

**Vocabulary register.** LLMs map domain language to technical vocabulary from training. Questions drift toward implementation framing without the designer noticing. Knowledge engineering literature treats this as a first-order failure mode; no LLM interview research documents an automated countermeasure.

**Question length and bundling.** Verbosity compensation causes LLMs to generate multi-part, over-elaborated questions when uncertain — precisely when the interview is most important (novel or ambiguous territory). LLMREI and the follow-up-generation paper both identify excessive question length as a measurable failure mode.

**Anchoring and premise propagation.** LLMs lock onto the first plausible interpretation of a design problem and continue asking questions within that frame. Chain-of-Thought and reflection prompting do not reliably break this. The interview progressively narrows around an initially-assumed solution space rather than expanding outward.

**Sycophancy as ratification corruption.** The LLM's training disposes it to validate the designer's answers rather than probe their edges. When the designer offers a rationale, the LLM agrees and moves on. This is functionally indistinguishable from the interviewer completing the interviewee's sentences — it suppresses information that would have emerged from genuine probing.

**Coverage blindness.** ReqElicitGym demonstrates that even the best LLM interviewers elicit only ~32% of implicit requirements. Style-adjacent and constraint-adjacent requirements are nearly invisible. LLMs default to probing for features (what the system does) rather than constraints and conditions (what it must not do, or what it depends on).

**The structural gap.** Human cognitive interviewing is built on the assumption that the interviewer knows they don't know — they probe because they are genuinely uncertain what the expert means. LLMs generate plausible completions, which means they can appear to understand without actually having surfaced the underlying concept. This produces interviews that feel complete but leave large areas of implicit knowledge unelicited.

---

## Signal Quality

**Rich** for: LLM cognitive biases (anchoring, sycophancy, verbosity compensation) — multiple peer-reviewed papers with empirical measurements.

**Rich** for: LLM-as-requirements-interviewer systems — LLMREI, ReqElicitGym, Elicitron are substantive peer-reviewed contributions with specific empirical findings.

**Rich** for: Human interview methodology (funnel, cognitive interviewing, double-barreled questions, acquiescence bias) — well-established literature with clear practitioner documentation.

**Moderate** for: Knowledge engineering vocabulary discipline — classical literature, not LLM-specific, but directly applicable.

**Thin** for: LLM-specific "translation gate" patterns and "ratification fatigue" — the mechanisms are documented in human-interview and survey literature but no LLM research addresses these named patterns directly. The synthesis is inferential rather than empirically grounded for LLMs.

---

## Sources

- [LLMREI: Automating Requirements Elicitation Interviews with LLMs](https://arxiv.org/html/2507.02564v1)
- [ReqElicitGym: An Evaluation Environment for Interview Competence in Conversational Requirements Elicitation](https://arxiv.org/html/2602.18306)
- [Elicitron: An LLM Agent-Based Simulation Framework for Design Requirements Elicitation](https://www.research.autodesk.com/publications/elicitron-llm-based-simulation-framework-design-requirements/)
- [Requirements Elicitation Follow-Up Question Generation](https://arxiv.org/html/2507.02858)
- [Anchoring Bias in Large Language Models: An Experimental Study](https://arxiv.org/html/2412.06593v1)
- [Cognitive bias in clinical large language models (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12246145/)
- [Yes, you're absolutely right… A mini survey on LLM sycophancy](https://medium.com/dsaid-govtech/yes-youre-absolutely-right-right-a-mini-survey-on-llm-sycophancy-02a9a8b538cf)
- [Measuring Opinion Bias and Sycophancy via LLM-based Persuasion](https://arxiv.org/html/2604.21564)
- [Verbosity ≠ Veracity: Demystify Verbosity Compensation Behavior of Large Language Models](https://arxiv.org/html/2411.07858v1)
- [Cognitive Bias Patterns in LLMs (USC AI Beat)](https://libguides.usc.edu/blogs/USC-AI-Beat/bias-patterns-llms)
- [The Funnel Technique in Qualitative User Research (NN/g)](https://www.nngroup.com/articles/the-funnel-technique-in-qualitative-user-research/)
- [Double-Barreled Questions: Why They Destroy Measurement Validity (Lensym)](https://lensym.com/blog/double-barreled-questions-guide)
- [Acquiescence Bias (Lensym)](https://lensym.com/blog/acquiescence-bias-guide)
- [Acquiescence Bias: What it is and How to Stop it (Qualtrics)](https://www.qualtrics.com/articles/strategy-research/avoiding-the-yes-bias/)
- [Structuring interviews with experts during knowledge elicitation (Wiley)](https://onlinelibrary.wiley.com/doi/10.1002/int.4550080106)
- [Knowledge Elicitation Methods (WPI)](http://web.cs.wpi.edu/Research/aidg/KE-Rpt98.html)
- [Cognitive Interviewing Guide (UCLA / Gordon Willis)](https://chime.ucla.edu/sites/default/files/media/documents/cognitive-interviewing-guide.pdf)
- [The Bias is in the Details: An Assessment of Cognitive Bias in LLMs](https://arxiv.org/html/2509.22856v1)
