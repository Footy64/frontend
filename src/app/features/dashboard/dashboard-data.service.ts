import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, forkJoin, of, throwError} from 'rxjs';
import {catchError, finalize, map, tap} from 'rxjs/operators';
import {Team, Match} from '../home/home.models';
import {TeamsService} from '../home/teams.service';
import {MatchesService} from '../home/matches.service';

@Injectable()
export class DashboardDataService {
  private readonly teamsSubject = new BehaviorSubject<Team[]>([]);
  private readonly matchesSubject = new BehaviorSubject<Match[]>([]);
  private readonly isLoadingTeamsSubject = new BehaviorSubject<boolean>(false);
  private readonly isLoadingMatchesSubject = new BehaviorSubject<boolean>(false);
  private hasLoadedInitialData = false;

  readonly teams$ = this.teamsSubject.asObservable();
  readonly matches$ = this.matchesSubject.asObservable();
  readonly isLoadingTeams$ = this.isLoadingTeamsSubject.asObservable();
  readonly isLoadingMatches$ = this.isLoadingMatchesSubject.asObservable();

  constructor(
    private readonly teamsService: TeamsService,
    private readonly matchesService: MatchesService
  ) {}

  loadInitialData(): Observable<void> {
    if (this.hasLoadedInitialData) {
      return of(void 0);
    }

    return forkJoin([this.refreshTeams(), this.refreshMatches()]).pipe(
      tap(() => {
        this.hasLoadedInitialData = true;
      }),
      map(() => void 0),
      catchError(error => {
        this.hasLoadedInitialData = false;
        return throwError(() => error);
      })
    );
  }

  refreshTeams(): Observable<Team[]> {
    this.isLoadingTeamsSubject.next(true);
    return this.teamsService.list().pipe(
      tap(teams => this.teamsSubject.next(teams)),
      catchError(error => {
        this.teamsSubject.next([]);
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingTeamsSubject.next(false))
    );
  }

  refreshMatches(): Observable<Match[]> {
    this.isLoadingMatchesSubject.next(true);
    return this.matchesService.list().pipe(
      tap(matches => this.matchesSubject.next(matches)),
      catchError(error => {
        this.matchesSubject.next([]);
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingMatchesSubject.next(false))
    );
  }

  createTeam(dto: Parameters<TeamsService['create']>[0]): Observable<Team> {
    return this.teamsService.create(dto).pipe(
      tap(team => {
        const current = this.teamsSubject.value;
        this.teamsSubject.next([...current, team]);
      })
    );
  }

  addMember(teamId: number, userId: number): Observable<Team> {
    return this.teamsService.addMember(teamId, userId).pipe(tap(team => this.replaceTeam(team)));
  }

  removeMember(teamId: number, memberId: number): Observable<Team> {
    return this.teamsService.removeMember(teamId, memberId).pipe(tap(team => this.replaceTeam(team)));
  }

  createMatch(dto: Parameters<MatchesService['create']>[0]): Observable<Match> {
    return this.matchesService.create(dto).pipe(
      tap(match => {
        const current = this.matchesSubject.value;
        this.matchesSubject.next([...current, match]);
      })
    );
  }

  updateScore(matchId: number, dto: Parameters<MatchesService['updateScore']>[1]): Observable<Match> {
    return this.matchesService
      .updateScore(matchId, dto)
      .pipe(tap(match => this.replaceMatch(match)));
  }

  clear(): void {
    this.hasLoadedInitialData = false;
    this.teamsSubject.next([]);
    this.matchesSubject.next([]);
    this.isLoadingTeamsSubject.next(false);
    this.isLoadingMatchesSubject.next(false);
  }

  private replaceTeam(team: Team): void {
    const current = this.teamsSubject.value;
    const index = current.findIndex(item => item.id === team.id);
    if (index === -1) {
      this.teamsSubject.next([...current, team]);
      return;
    }

    const next = current.slice();
    next[index] = team;
    this.teamsSubject.next(next);
  }

  private replaceMatch(match: Match): void {
    const current = this.matchesSubject.value;
    const index = current.findIndex(item => item.id === match.id);
    if (index === -1) {
      this.matchesSubject.next([...current, match]);
      return;
    }

    const next = current.slice();
    next[index] = match;
    this.matchesSubject.next(next);
  }
}
