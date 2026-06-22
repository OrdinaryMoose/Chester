  /btw is team lead consolidating the information instead of consolidator? the intent was to offload the team lead to preserve context but that doesn't seem to be happening with TL still taking majority of work

    Your read is substantially correct. Honest assessment:

    What the consolidator IS offloading: the full per-round transcripts. Each round the 4–5 members write long transcripts to disk; the consolidator reads all of those and emits the enumerate-only
    consolidator-output.md. The team-lead never reads those full transcripts. That offload is real and working.

    What it is NOT offloading (why TL context still balloons):

    - Member digests stream straight to the team-lead by protocol. The one-round-format has each member send the TL a digest directly. So the TL receives all 4–5 digests every round regardless of the
    consolidator — and those digests are not short (several have been 300–600 words). That's the dominant context leak, and the consolidator does nothing about it.
    - The team-lead authors every artifact — draft-spec, draft-plan, final spec, the analysis files, ledger updates. That's inherently in-context work and the consolidator role doesn't touch it.
    - The team-lead synthesizes from the streaming digests, often before the consolidator output even arrives. In practice the consolidator output has been landing after the TL already narrated the round's
    synthesis. So consolidator-output.md is functioning more as a disk record than as the TL's actual working input — which makes it partly redundant for context-preservation purposes.

    Net: transcript-reading is offloaded; digest-receipt, synthesis, and artifact authoring are not. So the TL remains the context bottleneck, exactly as you observed. The consolidator is preserving some context
    (no transcripts) but the bigger consumers — every digest plus all drafting — still land on the TL.

    What would actually fix it (worth capturing for the skill update):

    - Members write transcripts to disk and send the TL routing-only digests (one line: "position written, path X"), not full-content digests. The TL then works solely from consolidator-output.md, read once per
    round.
    - Gate TL synthesis on the consolidator output — TL should not narrate/synthesize from streaming digests at all; wait for the single consolidated artifact.
    - Consider offloading draft-artifact authoring (draft-spec/draft-plan) to a scribe subagent, leaving the TL to only adjudicate and route.

    This is precisely the kind of structural finding the end-of-plan-build capture artifact should record — the current process preserves less TL context than intended because the digest channel and the
    authoring burden bypass the consolidator entirely.
