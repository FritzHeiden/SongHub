# 04 - Delivery Phases and Acceptance

## 1. Delivery Strategy
Deliver the full vision in phased milestones so each release is usable, reviewable, and testable.

## 2. Phase Definitions

### Phase A - ACL Foundation
Scope:
1. PHASE-A-001: User-resource ownership model.
2. PHASE-A-002: Group-resource ownership model.
3. PHASE-A-003: Private-by-default user-owned songs.
4. PHASE-A-004: Group-owned songs editable by group members.
5. PHASE-A-005: Share grants for viewer and editor.
6. PHASE-A-006: Permission enforcement for all song resources.
7. PHASE-A-007: Audit events for permission and ownership changes.

Exit criteria:
1. PHASE-A-EXIT-001: Owner can grant and revoke viewer and editor access.
2. PHASE-A-EXIT-002: Viewer cannot complete content-modifying actions.
3. PHASE-A-EXIT-003: Editor can modify content but cannot alter sharing.
4. PHASE-A-EXIT-004: Group members can view and edit group-owned songs.
5. PHASE-A-EXIT-005: Unauthorized attempts are denied in 100 percent of authorization tests.

### Phase B - Canonical Song Page
Scope:
1. PHASE-B-001: Song metadata section.
2. PHASE-B-002: Tabs listing section.
3. PHASE-B-003: Notes section.
4. PHASE-B-004: External links section.
5. PHASE-B-005: Activity and history section.
6. PHASE-B-006: Ownership and collaboration context section.
7. PHASE-B-007: Copy actions section.

Exit criteria:
1. PHASE-B-EXIT-001: Song page displays all mandatory sections.
2. PHASE-B-EXIT-002: Authorized users can perform only allowed actions.
3. PHASE-B-EXIT-003: Section-level changes generate activity records.
4. PHASE-B-EXIT-004: Group ownership and copy actions are visible when applicable.

### Phase C - Basic Tab Editor
Scope:
1. PHASE-C-001: Edit imported tabs.
2. PHASE-C-002: Create and edit custom tabs.
3. PHASE-C-003: Save tab changes with version events.
4. PHASE-C-004: Duplicate tabs for alternate variants.
5. PHASE-C-005: Preserve content consistency during copy workflows.

Exit criteria:
1. PHASE-C-EXIT-001: Authorized users can create custom tabs from scratch.
2. PHASE-C-EXIT-002: Imported tabs can be edited and saved.
3. PHASE-C-EXIT-003: Version events exist for every save operation.
4. PHASE-C-EXIT-004: Tab content remains intact when copied between ownership modes.

### Phase D - Sharing Experience and History Quality
Scope:
1. PHASE-D-001: Improved collaborator management UX.
2. PHASE-D-002: Clear ownership and access indicators.
3. PHASE-D-003: Complete activity coverage and consistency checks.
4. PHASE-D-004: Administrator intervention pathways for moderation.
5. PHASE-D-005: Group membership and ownership management UX quality.
6. PHASE-D-006: Collaboration notification quality.

Exit criteria:
1. PHASE-D-EXIT-001: Users can identify who has access and why.
2. PHASE-D-EXIT-002: Revocation effects appear by next authorization check.
3. PHASE-D-EXIT-003: Activity feed is complete for required action categories.
4. PHASE-D-EXIT-004: Users can complete both copy directions successfully in end-to-end testing.
5. PHASE-D-EXIT-005: Collaboration notifications are delivered for required event types.

## 3. Cross-Phase Non-Functional Requirements
1. NFR-001: Authorization outcomes are consistent across all entry points.
2. NFR-002: Ownership and sharing relationships maintain integrity.
3. NFR-003: Security-sensitive actions produce auditable history.
4. NFR-004: Existing song and tab data remains accessible after migration.
5. NFR-005: Open questions must be tracked and resolved before phase exit where relevant.

## 4. Testing Requirements
Automated requirements:
1. TEST-AUTO-001: Permission matrix tests for owner, editor, viewer, group member, group manager, and administrator.
2. TEST-AUTO-002: Resource-level create, read, update, and delete authorization tests.
3. TEST-AUTO-003: Share grant lifecycle tests for create, modify, and revoke.
4. TEST-AUTO-004: Activity event coverage tests for required categories.
5. TEST-AUTO-005: Migration correctness tests for pre-existing data.
6. TEST-AUTO-006: Group membership access tests for group-owned songs.
7. TEST-AUTO-007: Copy workflow tests for group-to-private and private-to-group scenarios.
8. TEST-AUTO-008: Copy independence tests proving source and target diverge after copy.
9. TEST-AUTO-009: Notes privacy tests for shared versus personal notes.
10. TEST-AUTO-010: Notification trigger coverage for required collaboration events.

Manual verification requirements:
1. TEST-MAN-001: End-to-end owner workflow from song creation to sharing.
2. TEST-MAN-002: Editor collaboration workflow including tab and notes edits.
3. TEST-MAN-003: Viewer read-only workflow.
4. TEST-MAN-004: Revocation and post-revocation behavior checks.
5. TEST-MAN-005: Group member workflow on group-owned songs.
6. TEST-MAN-006: Private copy creation from a group-owned song.
7. TEST-MAN-007: Private-to-group copy and independent update verification.
8. TEST-MAN-008: Notification visibility checks for share and transfer events.

## 5. Definition of Done (Overall)
1. DOD-001: All mandatory requirements are implemented or explicitly deferred with rationale.
2. DOD-002: All phase exit criteria are met.
3. DOD-003: Automated and manual verification requirements pass.
4. DOD-004: User-facing behavior is documented in release notes.
5. DOD-005: Open questions impacting delivered phase are resolved or explicitly deferred.

## 6. Deferred Capabilities
The following may be addressed in future phases:
1. DEFER-001: Real-time simultaneous co-editing.
2. DEFER-002: Advanced conflict resolution and merge tooling.
3. DEFER-003: Fine-grained field-level permission customization.
