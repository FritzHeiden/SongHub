# 05 - Glossary and Decision Rules

## 1. Glossary
1. GLOSS-001: User-owned song - song whose owner is a user identity.
2. GLOSS-002: Group-owned song - song whose owner is a group identity.
3. GLOSS-003: Owner - principal with full control over owned song.
4. GLOSS-004: Editor - principal with content edit rights but no sharing control.
5. GLOSS-005: Viewer - principal with read-only rights.
6. GLOSS-006: Group member - user belonging to a group and inheriting group-song collaboration rights.
7. GLOSS-007: Group manager - user authorized to manage group membership and group-level collaboration settings.
8. GLOSS-008: Administrator - principal with global override and moderation powers.
9. GLOSS-009: Direct share - explicit permission grant from owner to specific user.
10. GLOSS-010: Group-derived access - permission inherited from membership in owning group.
11. GLOSS-011: Personal note - note visible only to its author and administrator.
12. GLOSS-012: Shared note - note visible to all users authorized for the song.
13. GLOSS-013: Copy operation - creation of a new independent song from an existing source song.
14. GLOSS-014: Lineage reference - metadata linking copied song to source song for traceability.
15. GLOSS-015: Authorization check - evaluation step that determines allow or deny for a requested action.

## 2. Permission Decision Order
1. RULE-ORDER-001: Evaluate administrator override first.
2. RULE-ORDER-002: Validate ownership mode and owner principal.
3. RULE-ORDER-003: Evaluate ownership-based permissions.
4. RULE-ORDER-004: Evaluate group-derived permissions.
5. RULE-ORDER-005: Evaluate direct-share permissions.
6. RULE-ORDER-006: Combine valid grants and apply highest effective permission.
7. RULE-ORDER-007: If no valid grant applies, deny by default.

## 3. Conflict Resolution Rules
1. RULE-CONFLICT-001: Higher-permission grant supersedes lower-permission grant for same principal.
2. RULE-CONFLICT-002: Revoking direct share does not remove independent group-derived access.
3. RULE-CONFLICT-003: Removing group membership removes all group-derived permissions.
4. RULE-CONFLICT-004: Ownership transfer recalculates all effective permissions after transfer.
5. RULE-CONFLICT-005: If ownership state is invalid or orphaned, deny all non-administrator operations until corrected.

## 4. Copy Decision Rules
1. RULE-COPY-001: Copy target is always a new independent song identity.
2. RULE-COPY-002: Copy preserves metadata, tabs, shared notes, and external links at copy time.
3. RULE-COPY-003: Personal notes are excluded from copy unless explicitly requested by author and policy allows it.
4. RULE-COPY-004: Direct shares are excluded from copy.
5. RULE-COPY-005: Copy records source-to-target lineage reference.
6. RULE-COPY-006: Copy creates activity events on source and target.

## 5. Notification Decision Rules
1. RULE-NOTIFY-001: Trigger notification on share grant.
2. RULE-NOTIFY-002: Trigger notification on share revoke.
3. RULE-NOTIFY-003: Trigger notification on ownership transfer affecting user access.
4. RULE-NOTIFY-004: Trigger notification when song is copied into a group a user belongs to.
5. RULE-NOTIFY-005: Notification failure must not silently alter authorization outcomes.
