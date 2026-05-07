● Observations

Locked: two strict CSV files per project (stock CSV + cuts CSV, kerf in cuts CSV); files round-trip cleanly between dashboard and disk. Three necessary conditions in the proof now.

The next-most-fragile area is how sections are numbered. Designer needs section IDs stable across runs (cut 1 always cut 1), but sections come from optimizer output — so program assigns them. The numbering    
rule is design substance.

Pulling on section ID stability — what determines section numbers, and how do they stay the same on re-run.

Information Package

Current facts. Stock IDs and cut requirement IDs are user-supplied, persisted in the CSV files. Section IDs are not — sections only exist after the optimizer runs. Each section is one cut requirement instance
produced from a stock piece. With a quantity-of-3 cut requirement, there are three sections from that one cut requirement.

Designer's stated discipline: cut 1 always cut 1, tube A always tube A. Sections must follow the same discipline — section 9 today should still be section 9 tomorrow if inputs haven't changed.

Prior art. Hobbyist tools generally handle section numbering one of three ways:
- Position-in-plan order — number sections 1, 2, 3... in the order they appear when reading tubes-by-cut, or cuts-by-tube. Easy. Unstable: any change to algorithm tie-break order shuffles every section ID.
- Deterministic key — derive section ID from the inputs (e.g. cut-requirement-ID + within-instance index). Section "C-3-2" = "third instance of cut requirement C-3." Stable across runs because identical inputs
  produce identical IDs. Reads slightly less friendly ("section C-3-2" vs "section 9").
- Sequential with stable ordering rule — sections numbered 1, 2, 3... but ordered by a fixed deterministic rule (e.g., sort by tube ID, then by position on tube). Stable as long as the ordering rule holds.    
  Reads naturally ("section 9").

Surface analysis. Section identity needs to survive three things:
- Designer adds a new cut requirement → existing sections shouldn't shuffle
- Designer changes a quantity → sections from unchanged cut requirements should keep their numbers
- Re-run with identical inputs → identical section numbers

The stability rule is what makes "is section 9 cut, yes or no?" usable as a build checklist. If the program reshuffles sections every time the designer tweaks an unrelated cut, the checklist becomes         
unreadable.

Alternate narrative. Trade-off between human-readable ("section 9") and stable ("section C-3-2"). Sequential numbering reads better but breaks if anything in the input changes that the ordering rule depends   
on. Composite IDs (cut-ID + index) are clunky but never break.

A middle path: sequential numbering ordered by user-supplied cut requirement ID, then by within-cut-requirement index. So sections are 1, 2, 3, ... and they stay stable as long as cut requirement IDs          
themselves don't shuffle (which they won't — user-supplied). Easy to read, robust against changes to algorithm tie-break. Only collapses if the designer renames a cut requirement ID.

There's a quieter concern: if the designer adds a new cut requirement with a smaller ID than existing ones (e.g. inserts cut-0 before cut-1), then sequential ordering by cut ID would shift every downstream    
section by one. Could be OK or not — depends on whether designer treats that as "new project" or expects continuity.

Commentary

My read: section numbering should be sequential 1, 2, 3, ... ordered deterministically by user-supplied cut-requirement ID, then by within-cut-instance index. Reads naturally for the build checklist ("section
9 = cut 9 first instance"). Stable against algorithm tie-break churn. Stable against designer adding a new cut requirement at a higher ID (the common case for going-concern projects where you add work).

The honest weakness: if you ever insert a new cut requirement with a lower ID than existing ones, downstream section numbers shift. Mitigation isn't free — you'd have to either (a) pick stable composite IDs   
("section C-3-2") and accept clunkier reading, or (b) accept that inserting low-numbered cuts is a "new chapter" event where you re-print the build checklist.

I lean toward sequential numbering with the discipline rule "add new cuts with higher IDs than existing ones." It honors how going-concern projects actually evolve — you accumulate cuts, you don't usually     
retroactively insert. If insertion happens, you accept a re-print of the checklist as the cost of restructuring.

What I want from you:
1. Sequential section 1, 2, 3, ... ordered by cut-requirement ID + within-instance index — works?
2. Or do you want composite-stable IDs (section C-3-2) instead, accepting the readability hit?
3. Aside — file pairing: how does the program know myproject-stock.csv and myproject-cuts.csv belong together? Naming prefix? Subfolder? Pick both files when opening?

What do you think?

→ Solve Step 06 