import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from '@chakra-ui/react'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'

interface GroupItem {
  id: number
  name: string
  slug: string
}

interface MembershipItem {
  id: number
  group_id: number
  user_id: number
  role: 'member' | 'manager'
  username: string
}

interface SavedSongItem {
  filename: string
  artist: string
  name: string
  songContext?: {
    ownershipMode: 'user' | 'group'
    ownerGroupName: string | null
    userPermission: 'none' | 'viewer' | 'editor' | 'owner'
  }
}

interface ShareItem {
  username: string
  permission: 'viewer' | 'editor'
}

export default function CollaborationPage(): JSX.Element {
  const toast = useToast()
  const [loading, setLoading] = useState(true)

  const [groups, setGroups] = useState<GroupItem[]>([])
  const [songs, setSongs] = useState<SavedSongItem[]>([])

  const [newGroupName, setNewGroupName] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [groupMembers, setGroupMembers] = useState<MembershipItem[]>([])
  const [memberUsername, setMemberUsername] = useState('')
  const [memberRole, setMemberRole] = useState<'member' | 'manager'>('member')

  const [selectedSongFilename, setSelectedSongFilename] = useState('')
  const [songShares, setSongShares] = useState<ShareItem[]>([])
  const [shareUsername, setShareUsername] = useState('')
  const [sharePermission, setSharePermission] = useState<'viewer' | 'editor'>('viewer')
  const [targetGroupId, setTargetGroupId] = useState('')

  const selectedSong = useMemo(
    () => songs.find((song) => song.filename === selectedSongFilename),
    [songs, selectedSongFilename],
  )

  const canManageSelectedSong = selectedSong?.songContext?.userPermission === 'owner'

  const loadBase = async () => {
    setLoading(true)
    try {
      const [groupsRes, songsRes] = await Promise.all([
        fetch('/api/groups').then((r) => r.json()),
        fetch('/api/saved-tabs').then((r) => r.json()),
      ])

      const nextGroups = Array.isArray(groupsRes?.groups) ? groupsRes.groups : []
      const nextSongs = Array.isArray(songsRes?.tabs) ? songsRes.tabs : []

      setGroups(nextGroups)
      setSongs(nextSongs)

      if (!selectedGroupId && nextGroups[0]?.id) {
        setSelectedGroupId(String(nextGroups[0].id))
      }

      if (!selectedSongFilename && nextSongs[0]?.filename) {
        setSelectedSongFilename(nextSongs[0].filename)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadGroupMembers = async (groupId: string) => {
    if (!groupId) {
      setGroupMembers([])
      return
    }

    const res = await fetch(`/api/group-memberships?groupId=${encodeURIComponent(groupId)}`)
    if (!res.ok) {
      setGroupMembers([])
      return
    }

    const data = await res.json()
    setGroupMembers(Array.isArray(data?.memberships) ? data.memberships : [])
  }

  const loadSongShares = async (filename: string) => {
    if (!filename) {
      setSongShares([])
      return
    }

    const res = await fetch(`/api/song-shares?filename=${encodeURIComponent(filename)}`)
    if (!res.ok) {
      setSongShares([])
      return
    }

    const data = await res.json()
    setSongShares(Array.isArray(data?.shares) ? data.shares : [])
  }

  useEffect(() => {
    loadBase()
  }, [])

  useEffect(() => {
    loadGroupMembers(selectedGroupId)
  }, [selectedGroupId])

  useEffect(() => {
    loadSongShares(selectedSongFilename)
  }, [selectedSongFilename])

  const createGroup = async () => {
    if (!newGroupName.trim()) return
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName.trim() }),
    })

    if (!res.ok) {
      toast({ description: 'Gruppe konnte nicht erstellt werden', status: 'error', duration: 1800, position: 'top-right' })
      return
    }

    setNewGroupName('')
    toast({ description: 'Gruppe erstellt', status: 'success', duration: 1400, position: 'top-right' })
    await loadBase()
  }

  const addOrUpdateMember = async () => {
    if (!selectedGroupId || !memberUsername.trim()) return

    const res = await fetch('/api/group-memberships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId: Number(selectedGroupId),
        username: memberUsername.trim(),
        role: memberRole,
      }),
    })

    if (!res.ok) {
      toast({ description: 'Mitglied konnte nicht gespeichert werden', status: 'error', duration: 1800, position: 'top-right' })
      return
    }

    setMemberUsername('')
    toast({ description: 'Mitglied aktualisiert', status: 'success', duration: 1400, position: 'top-right' })
    await loadGroupMembers(selectedGroupId)
  }

  const removeMember = async (username: string) => {
    if (!selectedGroupId) return

    const res = await fetch(
      `/api/group-memberships?groupId=${encodeURIComponent(selectedGroupId)}&username=${encodeURIComponent(username)}`,
      { method: 'DELETE' },
    )

    if (!res.ok) {
      toast({ description: 'Mitglied konnte nicht entfernt werden', status: 'error', duration: 1800, position: 'top-right' })
      return
    }

    toast({ description: 'Mitglied entfernt', status: 'info', duration: 1400, position: 'top-right' })
    await loadGroupMembers(selectedGroupId)
  }

  const grantShare = async () => {
    if (!selectedSongFilename || !shareUsername.trim()) return

    const res = await fetch('/api/song-shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: selectedSongFilename,
        username: shareUsername.trim(),
        permission: sharePermission,
      }),
    })

    if (!res.ok) {
      toast({ description: 'Freigabe konnte nicht gesetzt werden', status: 'error', duration: 1800, position: 'top-right' })
      return
    }

    setShareUsername('')
    toast({ description: 'Freigabe gespeichert', status: 'success', duration: 1400, position: 'top-right' })
    await loadSongShares(selectedSongFilename)
  }

  const revokeShare = async (username: string) => {
    if (!selectedSongFilename) return

    const res = await fetch(
      `/api/song-shares?filename=${encodeURIComponent(selectedSongFilename)}&username=${encodeURIComponent(username)}`,
      { method: 'DELETE' },
    )

    if (!res.ok) {
      toast({ description: 'Freigabe konnte nicht entfernt werden', status: 'error', duration: 1800, position: 'top-right' })
      return
    }

    toast({ description: 'Freigabe entfernt', status: 'info', duration: 1400, position: 'top-right' })
    await loadSongShares(selectedSongFilename)
  }

  const transferSongToGroup = async () => {
    if (!selectedSongFilename || !targetGroupId) return

    const res = await fetch('/api/song-ownership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: selectedSongFilename, groupId: Number(targetGroupId) }),
    })

    if (!res.ok) {
      toast({ description: 'Übertragung zur Gruppe fehlgeschlagen', status: 'error', duration: 1800, position: 'top-right' })
      return
    }

    toast({ description: 'Song zur Gruppe übertragen', status: 'success', duration: 1500, position: 'top-right' })
    await loadBase()
  }

  return (
    <>
      <Head>
        <title>Collaboration - Song Hub</title>
      </Head>

      <Flex direction="column" px={0} py={4}>
        <Flex justify="space-between" align="center" mb={3}>
          <Heading size="md">Collaboration Center</Heading>
          <Button size="sm" onClick={loadBase} variant="outline">Neu laden</Button>
        </Flex>

        {loading ? (
          <Flex justify="center" mt={10}><Spinner /></Flex>
        ) : (
          <Tabs variant="enclosed" colorScheme="blue" isLazy>
            <TabList>
              <Tab>Groups</Tab>
              <Tab>Song Sharing</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <Stack spacing={4}>
                  <Box borderWidth="1px" borderRadius="md" p={4}>
                    <Heading size="sm" mb={3}>Neue Gruppe</Heading>
                    <Flex gap={2} flexWrap="wrap">
                      <Input
                        maxW="320px"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Gruppenname"
                      />
                      <Button colorScheme="blue" onClick={createGroup}>Gruppe erstellen</Button>
                    </Flex>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" p={4}>
                    <Heading size="sm" mb={3}>Mitglieder verwalten</Heading>
                    <FormControl maxW="320px" mb={3}>
                      <FormLabel fontSize="sm">Gruppe</FormLabel>
                      <Select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
                        <option value="">Gruppe wählen</option>
                        {groups.map((group) => (
                          <option key={group.id} value={String(group.id)}>{group.name}</option>
                        ))}
                      </Select>
                    </FormControl>

                    <Flex gap={2} flexWrap="wrap" mb={3} align="end">
                      <FormControl maxW="240px">
                        <FormLabel fontSize="sm">Username</FormLabel>
                        <Input value={memberUsername} onChange={(e) => setMemberUsername(e.target.value)} placeholder="username" />
                      </FormControl>
                      <FormControl maxW="180px">
                        <FormLabel fontSize="sm">Rolle</FormLabel>
                        <Select value={memberRole} onChange={(e) => setMemberRole(e.target.value as 'member' | 'manager')}>
                          <option value="member">member</option>
                          <option value="manager">manager</option>
                        </Select>
                      </FormControl>
                      <Button colorScheme="blue" onClick={addOrUpdateMember} isDisabled={!selectedGroupId}>Speichern</Button>
                    </Flex>

                    <Stack spacing={2}>
                      {groupMembers.map((member) => (
                        <Flex key={member.id} justify="space-between" align="center" borderWidth="1px" borderRadius="md" p={2}>
                          <Flex align="center" gap={2}>
                            <Text>{member.username}</Text>
                            <Badge colorScheme={member.role === 'manager' ? 'purple' : 'gray'}>{member.role}</Badge>
                          </Flex>
                          <Button size="xs" variant="ghost" colorScheme="red" onClick={() => removeMember(member.username)}>Entfernen</Button>
                        </Flex>
                      ))}
                      {!selectedGroupId && <Text color="gray.500" fontSize="sm">Bitte zuerst eine Gruppe wählen.</Text>}
                      {selectedGroupId && groupMembers.length === 0 && <Text color="gray.500" fontSize="sm">Keine Mitglieder gefunden oder keine Berechtigung.</Text>}
                    </Stack>
                  </Box>
                </Stack>
              </TabPanel>

              <TabPanel px={0}>
                <Stack spacing={4}>
                  <Box borderWidth="1px" borderRadius="md" p={4}>
                    <Heading size="sm" mb={3}>Song wählen</Heading>
                    <FormControl maxW="560px" mb={3}>
                      <FormLabel fontSize="sm">Song</FormLabel>
                      <Select value={selectedSongFilename} onChange={(e) => setSelectedSongFilename(e.target.value)}>
                        <option value="">Song wählen</option>
                        {songs.map((song) => (
                          <option key={song.filename} value={song.filename}>
                            {(song.artist || 'Unknown')} - {(song.name || song.filename)}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    {selectedSong?.songContext && (
                      <Flex gap={2} flexWrap="wrap">
                        {selectedSong.songContext.ownershipMode === 'group' ? (
                          <Badge colorScheme="purple">Group: {selectedSong.songContext.ownerGroupName || 'Unknown'}</Badge>
                        ) : (
                          <Badge colorScheme="gray">Private song</Badge>
                        )}
                        <Badge colorScheme="blue">Permission: {selectedSong.songContext.userPermission}</Badge>
                      </Flex>
                    )}
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" p={4}>
                    <Heading size="sm" mb={3}>Freigaben</Heading>
                    <Flex gap={2} flexWrap="wrap" align="end" mb={3}>
                      <FormControl maxW="240px">
                        <FormLabel fontSize="sm">Username</FormLabel>
                        <Input value={shareUsername} onChange={(e) => setShareUsername(e.target.value)} placeholder="username" />
                      </FormControl>
                      <FormControl maxW="180px">
                        <FormLabel fontSize="sm">Permission</FormLabel>
                        <Select value={sharePermission} onChange={(e) => setSharePermission(e.target.value as 'viewer' | 'editor')}>
                          <option value="viewer">viewer</option>
                          <option value="editor">editor</option>
                        </Select>
                      </FormControl>
                      <Button colorScheme="blue" onClick={grantShare} isDisabled={!selectedSongFilename || !canManageSelectedSong}>Grant</Button>
                    </Flex>

                    <Stack spacing={2}>
                      {songShares.map((share) => (
                        <Flex key={`${share.username}-${share.permission}`} justify="space-between" align="center" borderWidth="1px" borderRadius="md" p={2}>
                          <Flex align="center" gap={2}>
                            <Text>{share.username}</Text>
                            <Badge colorScheme={share.permission === 'editor' ? 'orange' : 'teal'}>{share.permission}</Badge>
                          </Flex>
                          <Button size="xs" variant="ghost" colorScheme="red" onClick={() => revokeShare(share.username)} isDisabled={!canManageSelectedSong}>Revoke</Button>
                        </Flex>
                      ))}
                      {!selectedSongFilename && <Text color="gray.500" fontSize="sm">Bitte zuerst einen Song wählen.</Text>}
                      {selectedSongFilename && songShares.length === 0 && <Text color="gray.500" fontSize="sm">Keine Freigaben gefunden oder keine Berechtigung.</Text>}
                    </Stack>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" p={4}>
                    <Heading size="sm" mb={3}>Song zur Gruppe übertragen</Heading>
                    <Flex gap={2} flexWrap="wrap" align="end">
                      <FormControl maxW="320px">
                        <FormLabel fontSize="sm">Zielgruppe</FormLabel>
                        <Select value={targetGroupId} onChange={(e) => setTargetGroupId(e.target.value)}>
                          <option value="">Gruppe wählen</option>
                          {groups.map((group) => (
                            <option key={group.id} value={String(group.id)}>{group.name}</option>
                          ))}
                        </Select>
                      </FormControl>
                      <Button colorScheme="purple" onClick={transferSongToGroup} isDisabled={!selectedSongFilename || !targetGroupId || !canManageSelectedSong}>Transfer</Button>
                    </Flex>
                  </Box>
                </Stack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Flex>
    </>
  )
}
