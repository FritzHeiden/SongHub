# 02 - ACL and Sharing Requirements

## 1. Permission Model
Role summary matrix:

| Role | Read Song | Edit Song Content | Manage Shares | Manage Group Membership | Delete Song | Global Override |
| --- | --- | --- | --- | --- | --- | --- |
| Owner | Yes | Yes | Yes | No | Yes | No |
| Editor | Yes | Yes | No | No | No | No |
| Viewer | Yes | No | No | No | No | No |
| Group Member | Yes (for owned-group songs) | Yes (for owned-group songs) | No | No | No | No |
| Group Manager | Yes (for owned-group songs) | Yes (for owned-group songs) | Yes (for owned-group songs) | Yes | Yes (for owned-group songs) | No |
| Administrator | Yes | Yes | Yes | Yes | Yes | Yes |

Normative role requirements:
1. ACL-ROLE-001: Owner has full control over owned songs and related content.
2. ACL-ROLE-002: Editor can modify shared song content but cannot manage sharing or ownership.
3. ACL-ROLE-003: Viewer has read-only access.
4. ACL-ROLE-004: Group member can view and edit songs owned by groups they belong to.
5. ACL-ROLE-005: Group manager can manage group membership and collaboration settings for owned-group songs.
6. ACL-ROLE-006: Administrator has global override capabilities.

## 1.1 Ownership Modes
1. ACL-OWN-001: User-owned song is owned by exactly one user.
2. ACL-OWN-002: Group-owned song is owned by exactly one group.
3. ACL-OWN-003: Group-member editability for group-owned songs is mandatory and non-configurable in phase 1.

## 2. Resource Types Covered by ACL
1. ACL-RES-001: Song metadata.
2. ACL-RES-002: Tabs.
3. ACL-RES-003: Notes.
4. ACL-RES-004: External links.
5. ACL-RES-005: Sharing settings.
6. ACL-RES-006: Activity history visibility.
7. ACL-RES-007: Group membership and group ownership settings.

## 3. Default Access Rules
1. ACL-DEFAULT-001: Newly created user-owned songs are private to owner and administrator.
2. ACL-DEFAULT-002: Newly created group-owned songs are visible and editable by members of the owning group.
3. ACL-DEFAULT-003: No implicit access based on role alone, except administrator override.
4. ACL-DEFAULT-004: Permissions are denied by default when no matching rule grants access.

## 4. Share Grant Requirements
1. ACL-SHARE-001: Owner can grant viewer or editor access to specific users.
2. ACL-SHARE-002: Owner can upgrade or downgrade an existing share grant.
3. ACL-SHARE-003: Owner can revoke access at any time.
4. ACL-SHARE-004: Administrator can revoke any share grant when needed.
5. ACL-SHARE-005: Share actions must create activity entries.

## 4.1 Group Collaboration Requirements
1. ACL-GROUP-001: A group can own a song.
2. ACL-GROUP-002: Members of the owning group can view and edit that song.
3. ACL-GROUP-003: Non-members cannot access group-owned songs unless separately authorized.
4. ACL-GROUP-004: Membership changes affect access by the next authorization check.
5. ACL-GROUP-005: Membership and ownership changes create activity entries.

## 4.2 Permission Precedence Rules
1. ACL-PREC-001: Administrator override has highest precedence.
2. ACL-PREC-002: Ownership-based permissions take precedence over direct share grants.
3. ACL-PREC-003: Group-derived permissions take precedence over direct viewer grants.
4. ACL-PREC-004: If multiple grants exist, the highest effective permission applies.
5. ACL-PREC-005: Explicit revocation of direct share does not revoke access that still exists through valid group membership.
6. ACL-PREC-006: If group membership is removed, all group-derived permissions are removed by the next authorization check.

## 5. Action Matrix Requirements
Create operations:
1. ACL-ACT-C-001: User-owned song create allowed for user and administrator.
2. ACL-ACT-C-002: Group-owned song create allowed for group manager and administrator.
3. ACL-ACT-C-003: Tab create allowed for owner, editor, group member, and administrator.
4. ACL-ACT-C-004: Note create allowed for owner, editor, group member, and administrator.
5. ACL-ACT-C-005: External link create allowed for owner, editor, group member, and administrator.
6. ACL-ACT-C-006: Group-to-private copy allowed for authorized group readers and administrator.
7. ACL-ACT-C-007: Private-to-group copy allowed for private owner, authorized group manager, and administrator.

Read operations:
1. ACL-ACT-R-001: Song read allowed for owner, authorized direct share, authorized group member, and administrator.
2. ACL-ACT-R-002: Tab read allowed for same principals as song read.
3. ACL-ACT-R-003: Note read allowed for same principals as song read.
4. ACL-ACT-R-004: External link read allowed for same principals as song read.
5. ACL-ACT-R-005: Activity read allowed for same principals as song read.

Update operations:
1. ACL-ACT-U-001: Song metadata update allowed for owner, editor, authorized group member, and administrator.
2. ACL-ACT-U-002: Tab update allowed for owner, editor, authorized group member, and administrator.
3. ACL-ACT-U-003: Note update allowed for owner, editor, authorized group member, and administrator.
4. ACL-ACT-U-004: External link update allowed for owner, editor, authorized group member, and administrator.
5. ACL-ACT-U-005: Share settings update allowed for owner, authorized group manager, and administrator.
6. ACL-ACT-U-006: Group membership update allowed for group manager and administrator.

Delete operations:
1. ACL-ACT-D-001: Song delete allowed for owner, authorized group manager, and administrator.
2. ACL-ACT-D-002: Tab delete allowed for owner, editor, authorized group member, and administrator.
3. ACL-ACT-D-003: Note delete allowed for owner, editor, authorized group member, and administrator.
4. ACL-ACT-D-004: External link delete allowed for owner, editor, authorized group member, and administrator.
5. ACL-ACT-D-005: Share grant delete allowed for owner, authorized group manager, and administrator.

## 6. Ownership Rules
1. ACL-TRANSFER-001: Every song has exactly one active owner, either user or group.
2. ACL-TRANSFER-002: Ownership transfer is explicit and auditable.
3. ACL-TRANSFER-003: Transfer requires owner, authorized group manager, or administrator privileges.
4. ACL-TRANSFER-004: Prior owner permission after transfer defaults to editor unless explicitly changed.
5. ACL-TRANSFER-005: Transfer between ownership modes preserves full content.

## 6.1 Copy Rules
1. ACL-COPY-001: Group-to-private copy requires read access to source song.
2. ACL-COPY-002: Private-to-group copy requires private ownership of source and authorization to add content to target group.
3. ACL-COPY-003: Copy creates an independent target song with separate future edit history.
4. ACL-COPY-004: Copy preserves metadata, tabs, notes, and external links at copy time.
5. ACL-COPY-005: Direct share grants are not copied.
6. ACL-COPY-006: Source lineage metadata is retained for traceability.
7. ACL-COPY-007: Copy creates activity entries in source and target histories.

## 6.2 Group Lifecycle Rules
1. ACL-LIFE-001: Removing a user from group membership removes group-derived access by the next authorization check.
2. ACL-LIFE-002: If a group is deleted, its owned songs must be explicitly reassigned before deletion completes.
3. ACL-LIFE-003: Group ownership transfer must preserve song content and activity lineage.
4. ACL-LIFE-004: If an owner identity is deactivated, ownership must be reassigned through explicit administrative action.
5. ACL-LIFE-005: Orphan ownership states are invalid and must be blocked from normal access until corrected.

## 7. Revocation Behavior
1. ACL-REVOKE-001: Revoked users lose direct-share access by the next authorization check.
2. ACL-REVOKE-002: Revoked users do not appear in collaborator lists after revocation is processed.
3. ACL-REVOKE-003: Revocation does not remove historical activity events.
4. ACL-REVOKE-004: If user still has valid group-derived access, access remains under group permissions.

## 8. Visibility and Discovery Rules
1. ACL-VIS-001: Library views separate user-owned, group-owned, and directly shared songs.
2. ACL-VIS-002: Unauthorized private songs are not discoverable.
3. ACL-VIS-003: Search results include only authorized songs.
4. ACL-VIS-004: Group-owned songs are labeled with owning group context.

## 9. Security and Integrity Requirements
1. ACL-SEC-001: Permission checks are enforced for every operation type.
2. ACL-SEC-002: Permission denials return consistent outcomes.
3. ACL-SEC-003: Permission-affecting actions are auditable.
4. ACL-SEC-004: Share grants validate target identities.
5. ACL-SEC-005: Group assignments validate user and group existence.

## 10. ACL Acceptance Criteria
1. ACL-ACCEPT-001: Unauthorized users cannot read private songs in 100 percent of test cases.
2. ACL-ACCEPT-002: Viewers cannot perform any content-modifying action.
3. ACL-ACCEPT-003: Editors can modify content but cannot change sharing.
4. ACL-ACCEPT-004: Owners can grant, update, and revoke direct shares.
5. ACL-ACCEPT-005: Revocation effect is visible by the next authorization check.
6. ACL-ACCEPT-006: Administrators can audit and intervene for all songs.
7. ACL-ACCEPT-007: Group members can view and edit group-owned songs.
8. ACL-ACCEPT-008: Authorized users can create group-to-private copies.
9. ACL-ACCEPT-009: Authorized users can create private-to-group copies.
10. ACL-ACCEPT-010: Source and copied songs diverge independently after copy.
