import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {CreateMatchDto, Match, UpdateScoreDto} from './home.models';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatchesService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly baseUrl = `${environment.baseApi}/matches`;

  list(): Observable<Match[]> {
    return this.http.get<Match[]>(this.baseUrl);
  }

  create(dto: CreateMatchDto): Observable<Match> {
    return this.http.post<Match>(this.baseUrl, dto);
  }

  updateScore(matchId: number, dto: UpdateScoreDto): Observable<Match> {
    return this.http.patch<Match>(`${this.baseUrl}/${matchId}/score`, dto);
  }
}
