export interface TeamMember {
  id: number;
  email: string;
  displayName?: string | null;
}

export interface Team {
  id: number;
  name: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
}

export interface CreateTeamDto {
  name: string;
  memberIds?: number[];
}

export interface MatchTeamSummary {
  id: number;
  name: string;
}

export interface MatchScore {
  home: number | null;
  away: number | null;
}

export interface Match {
  id: number;
  date: string;
  createdAt: string;
  place: string;
  createdBy: number;
  homeTeam: MatchTeamSummary;
  awayTeam: MatchTeamSummary;
  score: MatchScore;
}

export interface CreateMatchDto {
  homeTeamId: number;
  awayTeamId: number;
  date: string;
  place: string;
}

export interface UpdateScoreDto {
  homeScore: number;
  awayScore: number;
}
