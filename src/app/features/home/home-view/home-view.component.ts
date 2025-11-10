import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {AuthStateService} from '../../auth/auth-state.service';

@Component({
  selector: 'app-home-view',
  standalone: false,
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.scss']
})
export class HomeViewComponent {
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);

  readonly user$ = this.authState.user$;
  readonly isAuthenticated$ = this.authState.isAuthenticated$;

  goToDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }
}
