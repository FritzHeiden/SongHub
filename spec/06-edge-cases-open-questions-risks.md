# 06 - Edge Cases, Open Questions, and Risks

## 1. Lifecycle Edge Cases
1. EDGE-001: User removed from group while actively collaborating on group-owned song.
Expected result: access removed by next authorization check.

2. EDGE-002: Group deletion while group still owns songs.
Expected result: operation blocked until owned songs are reassigned.

3. EDGE-003: Ownership transfer from user-owned to group-owned song.
Expected result: content preserved, access recalculated, activity recorded.

4. EDGE-004: Ownership transfer from group-owned to user-owned song.
Expected result: content preserved, group-derived access removed unless explicit shares are added.

5. EDGE-005: Revoked direct share on user who still belongs to owning group.
Expected result: direct-share access removed, group-derived access remains if valid.

6. EDGE-006: Song with orphan owner reference due to identity removal.
Expected result: non-administrator access denied until reassignment.

7. EDGE-007: Copy operation requested without sufficient target authorization.
Expected result: copy denied, no partial target song created.

8. EDGE-008: Concurrent copy and ownership transfer operations.
Expected result: one consistent result based on completed authorization at operation execution time.

## 2. Open Questions
1. OPEN-001: Should personal notes be optionally copyable by author choice when copying songs?
2. OPEN-002: Should group manager rights be assignable by group policy tiers in future phases?
3. OPEN-003: Should notifications support user-configurable mute preferences?
4. OPEN-004: Should lineage references be visible in song page UI or only in activity/history?
5. OPEN-005: Should share grants support time-bounded expiration windows?

## 3. Assumptions
1. ASSUME-001: Group-member editability for group-owned songs remains fixed in phase 1.
2. ASSUME-002: Administrator override is retained for moderation and recovery.
3. ASSUME-003: Notification delivery is best effort and does not gate authorization.
4. ASSUME-004: Copy is intended for reuse, not synchronization.

## 4. Risk Register
1. RISK-001: Permission ambiguity across ownership and sharing paths.
Mitigation: enforce decision-order and conflict rules in 05-glossary-and-decision-rules.md.

2. RISK-002: Users misunderstanding copy independence.
Mitigation: explicit copy-direction labels and post-copy confirmation messaging.

3. RISK-003: Group lifecycle operations causing hidden access drift.
Mitigation: mandatory activity entries and lifecycle validation checks.

4. RISK-004: Feature creep from unresolved open questions.
Mitigation: phase-gate open questions and defer non-blocking decisions explicitly.

## 5. Completion Criteria for This Document
1. EDGE-DONE-001: Every edge case has expected behavior.
2. EDGE-DONE-002: Open questions are tracked with IDs and ownership.
3. EDGE-DONE-003: Risks include explicit mitigations.
