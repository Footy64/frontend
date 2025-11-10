import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CreateTeamDto, Team} from './home.models';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.baseApi}/teams`;

  list(): Observable<Team[]> {
    return this.http.get<Team[]>(this.baseUrl);
  }

  create(dto: CreateTeamDto): Observable<Team> {
    return this.http.post<Team>(this.baseUrl, dto);
  }

  addMember(teamId: number, userId: number): Observable<Team> {
    return this.http.post<Team>(`${this.baseUrl}/${teamId}/members`, {userId});
  }

  removeMember(teamId: number, memberId: number): Observable<Team> {
    return this.http.delete<Team>(`${this.baseUrl}/${teamId}/members/${memberId}`);
  }
}
