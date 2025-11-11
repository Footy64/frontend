import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AuthUser {
  id: number;
  email: string;
  displayName?: string | null;
}

export interface SetSessionOptions {
  remember?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private readonly tokenStorageKey = 'footy.auth.token';
  private readonly userStorageKey = 'footy.auth.user';
  private readonly tokenSubject = new BehaviorSubject<string | null>(
    this.restoreToken(),
  );
  readonly token$: Observable<string | null> = this.tokenSubject.asObservable();
  readonly isAuthenticated$: Observable<boolean> = this.token$.pipe(
    map((token) => !!token),
  );
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(
    this.restoreUser(),
  );
  readonly user$: Observable<AuthUser | null> = this.userSubject.asObservable();

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get user(): AuthUser | null {
    return this.userSubject.value;
  }

  setSession(
    token: string,
    user: AuthUser | null,
    options: SetSessionOptions = {},
  ): void {
    const remember = options.remember ?? true;
    this.persistToken(token, remember);
    this.persistUser(user, remember);
    this.tokenSubject.next(token);
    this.userSubject.next(user);
  }

  setSessionFromResponse(
    response: unknown,
    options: SetSessionOptions = {},
  ): boolean {
    const token = this.extractToken(response);
    if (!token) {
      console.warn('No token found in authentication response');
      return false;
    }

    const user = this.extractUser(response);
    this.setSession(token, user, options);
    return true;
  }

  clearSession(): void {
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    this.removeStoredValues();
  }

  private restoreToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return (
      localStorage.getItem(this.tokenStorageKey) ||
      sessionStorage.getItem(this.tokenStorageKey)
    );
  }

  private restoreUser(): AuthUser | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const storedValue =
      localStorage.getItem(this.userStorageKey) ||
      sessionStorage.getItem(this.userStorageKey);

    if (!storedValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(storedValue);
      if (parsed && typeof parsed === 'object') {
        return {
          id: parsed.id,
          email: parsed.email,
          displayName:
            parsed.displayName ?? parsed.name ?? parsed.fullName ?? null,
        } as AuthUser;
      }
    } catch (error) {
      console.warn('Unable to parse stored user payload', error);
    }

    return null;
  }

  private persistToken(token: string, remember: boolean): void {
    if (typeof window === 'undefined') {
      return;
    }

    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    target.setItem(this.tokenStorageKey, token);
    other.removeItem(this.tokenStorageKey);
  }

  private persistUser(user: AuthUser | null, remember: boolean): void {
    if (typeof window === 'undefined') {
      return;
    }

    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;

    if (user) {
      target.setItem(this.userStorageKey, JSON.stringify(user));
    } else {
      target.removeItem(this.userStorageKey);
    }

    other.removeItem(this.userStorageKey);
  }

  private removeStoredValues(): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem(this.tokenStorageKey);
    sessionStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.userStorageKey);
    sessionStorage.removeItem(this.userStorageKey);
  }

  private extractToken(response: unknown): string | null {
    if (!response) {
      return null;
    }

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object') {
      const payload = response as Record<string, unknown>;
      const possibleKeys = ['accessToken', 'access_token', 'token', 'jwt'];

      for (const key of possibleKeys) {
        const value = payload[key];
        if (typeof value === 'string' && value.length > 0) {
          return value;
        }
      }

      if (payload['data']) {
        return this.extractToken(payload['data'] as unknown);
      }
    }

    return null;
  }

  private extractUser(response: unknown): AuthUser | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const payload = response as Record<string, unknown>;

    const directCandidate = this.toAuthUser(payload);
    if (directCandidate) {
      return directCandidate;
    }

    const directKeys = ['user', 'profile', 'account'];
    for (const key of directKeys) {
      const value = payload[key];
      if (value && typeof value === 'object') {
        return this.toAuthUser(value as Record<string, unknown>);
      }
    }

    if (payload['data'] && typeof payload['data'] === 'object') {
      return this.extractUser(payload['data']);
    }

    return null;
  }

  private toAuthUser(candidate: Record<string, unknown>): AuthUser | null {
    if (
      typeof candidate['id'] === 'number' &&
      typeof candidate['email'] === 'string'
    ) {
      return {
        id: candidate['id'] as number,
        email: candidate['email'] as string,
        displayName:
          typeof candidate['displayName'] === 'string'
            ? (candidate['displayName'] as string)
            : typeof candidate['name'] === 'string'
              ? (candidate['name'] as string)
              : typeof candidate['fullName'] === 'string'
                ? (candidate['fullName'] as string)
                : null,
      };
    }

    return null;
  }
}
