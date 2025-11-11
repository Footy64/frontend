import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthStateService,
  AuthUser,
} from '../../features/auth/auth-state.service';

@Component({
  selector: 'app-navigation',
  standalone: false,
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {
  isMenuOpen = false;
  private readonly authState: AuthStateService = inject(AuthStateService);
  readonly isAuthenticated$: Observable<boolean> =
    this.authState.isAuthenticated$;
  readonly user$: Observable<AuthUser | null> = this.authState.user$;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  logout(): void {
    this.authState.clearSession();
    this.closeMenu();
  }
}
