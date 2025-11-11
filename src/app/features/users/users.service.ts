import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TeamMember } from '../home/home.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseApi + '/users';

  search(query: string): Observable<TeamMember[]> {
    const params = new HttpParams().set('query', query.trim());
    return this.http.get<TeamMember[]>(this.baseUrl + '/search', { params });
  }
}
