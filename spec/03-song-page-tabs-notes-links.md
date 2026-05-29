# 03 - Song Page, Tabs, Notes, and Links Requirements

## 1. Song Page Purpose
Provide a single canonical view for all important information and actions related to one song.

## 2. Mandatory Song Page Sections (Phase 1)
1. SONG-SEC-001: Song metadata section.
2. SONG-SEC-002: Tabs section with all associated tabs.
3. SONG-SEC-003: Notes section.
4. SONG-SEC-004: External links section.
5. SONG-SEC-005: Activity and history section.
6. SONG-SEC-006: Ownership and collaboration context section.
7. SONG-SEC-007: Copy actions section.

## 3. Song Metadata Requirements
Required fields:
1. SONG-META-001: Song title.
2. SONG-META-002: Artist.

Optional fields:
1. SONG-META-003: Key.
2. SONG-META-004: Capo.
3. SONG-META-005: Tuning.
4. SONG-META-006: Tempo.
5. SONG-META-007: Genre.
6. SONG-META-008: Tags.

Behavior requirements:
1. SONG-META-009: Authorized users can edit metadata according to ACL.
2. SONG-META-010: Metadata changes are visible on next page refresh or reload.
3. SONG-META-011: Metadata edits generate activity records.
4. SONG-META-012: Song page displays ownership mode as user-owned or group-owned.

## 4. Tabs Requirements
General:
1. SONG-TAB-001: A song can have multiple tabs.
2. SONG-TAB-002: Tabs support imported and custom origins.
3. SONG-TAB-003: Tabs display origin and last-updated information.

Basic tab editor requirements (Phase 1):
1. SONG-TAB-004: Edit tab title.
2. SONG-TAB-005: Edit tab text or body content.
3. SONG-TAB-006: Edit basic tab metadata.
4. SONG-TAB-007: Save changes as current version.
5. SONG-TAB-008: Create a new custom tab from scratch.
6. SONG-TAB-009: Duplicate an existing tab to create alternate version.

Import requirements:
1. SONG-TAB-010: Users can import tabs from external providers.
2. SONG-TAB-011: Imported tabs are editable for authorized editors.
3. SONG-TAB-012: Import preserves attribution metadata when available.

Version requirements:
1. SONG-TAB-013: Each save operation creates a version event.
2. SONG-TAB-014: Users can view a version history summary.
3. SONG-TAB-015: Version history includes actor and timestamp.

## 5. Notes Requirements
1. SONG-NOTE-001: Notes are attached to songs.
2. SONG-NOTE-002: Notes support free-text content.
3. SONG-NOTE-003: Notes include author and last-updated metadata.
4. SONG-NOTE-004: Authorized users can create, edit, and delete notes.
5. SONG-NOTE-005: Note operations generate activity records.
6. SONG-NOTE-006: Notes are visible only to authorized song users.

Notes privacy model:
1. SONG-NOTE-007: Shared note type is visible to all users authorized on the song.
2. SONG-NOTE-008: Personal note type is visible only to its author and administrator.
3. SONG-NOTE-009: Personal notes are not copied into other users' views by sharing changes.

## 6. External Links Requirements
1. SONG-LINK-001: Users can attach arbitrary URLs to a song.
2. SONG-LINK-002: Link entries support:
- URL
- Label/title
- Provider/type (for example: YouTube, Spotify, Other)
- Optional description
3. SONG-LINK-003: Links must be validated for URL format.
4. SONG-LINK-004: Authorized users can create, edit, and delete links.
5. SONG-LINK-005: Link operations generate activity records.

## 7. Activity/History Requirements
1. SONG-ACT-001: Activity feed includes major actions:
- Song created/updated
- Tab created/updated/deleted
- Note created/updated/deleted
- Link created/updated/deleted
- Share granted/modified/revoked
- Group membership and ownership changes affecting song access
- Song copied from group to private
- Song copied from private to group
2. SONG-ACT-002: Each event includes actor, action type, timestamp, and target entity.
3. SONG-ACT-003: Activity feed is ordered newest first.
4. SONG-ACT-004: Authorized viewers can view activity for songs they can access.

## 8. Ownership and Collaboration Context Requirements
1. SONG-CTX-001: Song page displays owner identity as user or group.
2. SONG-CTX-002: Group-owned songs display owning group name.
3. SONG-CTX-003: Song page displays current user capability level for the song.

## 9. Copy Workflow Requirements
1. SONG-COPY-001: For group-owned songs, authorized users can create private copies.
2. SONG-COPY-002: For private songs, authorized users can copy songs into selected groups.
3. SONG-COPY-003: Copy preserves metadata, tabs, shared notes, and external links at copy time.
4. SONG-COPY-004: Personal notes are excluded from copy by default.
5. SONG-COPY-005: Copied song is independent from source after copy completes.
6. SONG-COPY-006: Copy does not transfer direct share grants.
7. SONG-COPY-007: Copy creates lineage reference from target to source.
8. SONG-COPY-008: Copy actions create activity entries on source and target songs.

## 10. User Experience Requirements
1. SONG-UX-001: Song page clearly displays current user permission level.
2. SONG-UX-002: Disabled actions explain why action is unavailable.
3. SONG-UX-003: Create and edit flows require minimal steps.
4. SONG-UX-004: Empty states guide users to add first tab, note, or link.
5. SONG-UX-005: Copy labels clearly indicate direction: group to private or private to group.

Library and search requirements:
1. SONG-UX-006: Library view has explicit sections for private, group-owned, and directly shared songs.
2. SONG-UX-007: Search supports filtering by ownership mode and access source.

Notification requirements:
1. SONG-NOTIFY-001: Users receive notification when granted or revoked song access.
2. SONG-NOTIFY-002: Users receive notification when ownership transfers affect access.
3. SONG-NOTIFY-003: Users receive notification when a song is copied into a group they belong to.

## 11. Acceptance Criteria
1. SONG-ACCEPT-001: Song page renders all mandatory sections.
2. SONG-ACCEPT-002: Authorized editor can update metadata, tabs, notes, and links.
3. SONG-ACCEPT-003: Viewer can view but cannot modify content.
4. SONG-ACCEPT-004: User can create and save custom tab from scratch.
5. SONG-ACCEPT-005: Imported tab can be edited and saved by authorized user.
6. SONG-ACCEPT-006: Activity feed includes all required event categories.
7. SONG-ACCEPT-007: Group-owned songs display owning group and user capability context.
8. SONG-ACCEPT-008: Authorized user can perform group-to-private copy.
9. SONG-ACCEPT-009: Authorized user can perform private-to-group copy.
10. SONG-ACCEPT-010: Source and copied songs diverge independently after copy.
11. SONG-ACCEPT-011: Personal notes are visible only to author and administrator.
