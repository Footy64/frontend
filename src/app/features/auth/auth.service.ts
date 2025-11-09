import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {LoginDto, RegisterDto} from './auth.models';
import {environment} from '../../../environments/environment.development';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.baseApi}/auth`;

  http: HttpClient = inject(HttpClient);

  register(dto: RegisterDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, dto);
  }

  login(dto: LoginDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, dto);
  }
}
