# 01 - Product Scope

## 1. Objective
Provide a complete multi-user song workspace where users can manage personal songs, maintain tabs, and share song content with controlled permissions.

## 2. Product Goals
1. SCOPE-001: Enable personal song ownership.
2. SCOPE-002: Enable group ownership for collaborative song management.
3. SCOPE-003: Enable sharing with explicit permissions.
4. SCOPE-004: Provide a canonical song page with all relevant song information.
5. SCOPE-005: Support tab editing for imported and custom tabs.
6. SCOPE-006: Support notes and external references per song.
7. SCOPE-007: Support controlled copy workflows between personal and group libraries.
8. SCOPE-008: Provide clear library and search segmentation for personal, group, and shared content.
9. SCOPE-009: Provide user notifications for collaboration-critical actions.

## 3. Target Users
1. ROLE-001: Song owner creates and manages user-owned songs and tabs.
2. ROLE-002: Shared collaborator receives direct viewer or editor grants.
3. ROLE-003: Group member collaborates on songs owned by their group.
4. ROLE-004: Group manager manages group membership and group collaboration settings.
5. ROLE-005: Administrator has global oversight and moderation permissions.

## 4. Core Domain Concepts
1. DOMAIN-001: User is an authenticated identity with one or more roles.
2. DOMAIN-002: Group is a user collection that can own songs.
3. DOMAIN-003: Song is the canonical music entity containing metadata and related resources.
4. DOMAIN-004: Tab is a playable or readable representation attached to a song.
5. DOMAIN-005: Note is a text annotation linked to a song.
6. DOMAIN-006: External link is a URL reference linked to a song.
7. DOMAIN-007: Share grant is an explicit permission assignment to a user.
8. DOMAIN-008: Activity event is an auditable action related to song content or permissions.

## 5. Feature Scope
In scope:
1. FEAT-001: Users and permissioned access.
2. FEAT-002: Personal song library.
3. FEAT-003: Group library with group-owned songs.
4. FEAT-004: Sharing songs with users.
5. FEAT-005: Song information page.
6. FEAT-006: Basic tab editor.
7. FEAT-007: Custom tab creation.
8. FEAT-008: Song notes.
9. FEAT-009: Arbitrary external links.
10. FEAT-010: Activity history for major actions.
11. FEAT-011: Copy song from group to private library.
12. FEAT-012: Copy song from private library to a group library.
13. FEAT-013: Library and search filters for private, group, and directly shared songs.
14. FEAT-014: Collaboration notifications for permission and ownership changes.

Out of scope for initial phase:
1. NONGOAL-001: Real-time simultaneous co-editing.
2. NONGOAL-002: Advanced merge/conflict resolution user interface.
3. NONGOAL-003: Public anonymous sharing.

## 6. High-Level User Journeys
1. JOURNEY-001: Create a personal song and keep it private.
2. JOURNEY-002: Add one or more tabs to that song.
3. JOURNEY-003: Create or join a group and collaborate on group-owned songs.
4. JOURNEY-004: Share the song with another user as viewer or editor.
5. JOURNEY-005: Collaborate on song notes and metadata within granted permissions.
6. JOURNEY-006: Attach external resources such as YouTube and Spotify links.
7. JOURNEY-007: Review activity history to understand what changed and by whom.
8. JOURNEY-008: Create a private copy from a group-owned song.
9. JOURNEY-009: Copy a private song into a group-owned library.
10. JOURNEY-010: Filter and discover songs by ownership and sharing context.

## 7. Global Requirements
1. GLOBAL-001: Newly created user-owned songs are visible only to owner and administrator.
2. GLOBAL-002: Access to non-owned songs requires explicit authorization or administrator privileges.
3. GLOBAL-003: All song-related surfaces must enforce the same authorization outcomes.
4. GLOBAL-004: Share, ownership, copy, and edit actions must create activity records.
5. GLOBAL-005: Core actions must be discoverable without technical knowledge.
6. GLOBAL-006: Members of a song-owning group can view and edit that group's songs in phase 1 and this policy is non-configurable in phase 1.
7. GLOBAL-007: Group-to-private copy produces an independent personal song.
8. GLOBAL-008: Private-to-group copy produces an independent group-owned song.
9. GLOBAL-009: Library and search views must include ownership-aware filters and must not leak unauthorized songs.
10. GLOBAL-010: Collaboration-critical actions must trigger user notifications.
