export type AppRole = 'user' | 'contributor' | 'admin'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export type PlaceCategory = {
  id: string
  slug: string
  nameEn: string
  nameSi: string
  color: string
  icon: string
  sortOrder: number
  _count?: { places: number }
}

export type User = {
  id: string
  email: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  role: AppRole
  createdAt: string
}

export type EvidenceMedia = {
  id: string
  mediaType: 'image' | 'youtube'
  url: string
  youtubeId: string | null
}

export type PlaceVisit = {
  id: string
  visitedAt: string
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

export type PlaceComment = {
  id: string
  placeId: string
  body: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  upvoteCount: number
  downvoteCount: number
  myVote: 'up' | 'down' | null
  isMine: boolean
}

export type CommentVoteResult = {
  commentId: string
  myVote: 'up' | 'down' | null
  upvoteCount: number
  downvoteCount: number
}

export type HauntedPlace = {
  id: string
  title: string
  description: string
  categoryId: string
  category: PlaceCategory
  spookinessRating: number
  latitude: number
  longitude: number
  nearestCity: string
  status: SubmissionStatus
  rejectionReason: string | null
  createdAt: string
  media: EvidenceMedia[]
  createdBy?: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  } | null
  _count?: { visits: number }
  visits?: PlaceVisit[]
  myVisit?: PlaceVisit | null
  comments?: PlaceComment[]
}

export type VisitResult = {
  success: boolean
  distance?: number
  requiredWithinMeters?: number
  message: string
}

export type LeaderboardEntry = {
  rank: number
  visitCount: number
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  } | null
}
