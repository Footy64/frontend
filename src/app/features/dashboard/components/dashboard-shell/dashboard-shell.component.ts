import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { AuthStateService } from '../../../auth/auth-state.service';
import { DashboardDataService } from '../../dashboard-data.service';

@Component({
  selector: 'app-dashboard-shell',
  standalone: false,
  templateUrl: './dashboard-shell.component.html',
  styleUrls: ['./dashboard-shell.component.scss'],
})
export class DashboardShellComponent implements OnInit, OnDestroy {
  readonly data = inject(DashboardDataService);
  readonly teams$ = this.data.teams$;
  readonly matches$ = this.data.matches$;
  readonly isLoadingTeams$ = this.data.isLoadingTeams$;
  readonly isLoadingMatches$ = this.data.isLoadingMatches$;
  dataError: string | null = null;
  private readonly authState = inject(AuthStateService);
  readonly user$ = this.authState.user$;
  private readonly router = inject(Router);
  private readonly subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.authState.isAuthenticated$.subscribe((isAuthenticated) => {
        if (!isAuthenticated) {
          this.data.clear();
          void this.router.navigate(['/auth/login'], {
            queryParams: { redirectTo: '/dashboard' },
          });
          return;
        }

        this.loadData();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  refreshAll(): void {
    this.dataError = null;
    const refresh$ = forkJoin([
      this.data.refreshTeams(),
      this.data.refreshMatches(),
    ]).subscribe({
      error: () => {
        this.dataError =
          'Une erreur est survenue lors du chargement des données.';
      },
    });

    this.subscriptions.add(refresh$);
  }

  private loadData(): void {
    this.dataError = null;
    const load$ = this.data.loadInitialData().subscribe({
      error: () => {
        this.dataError =
          'Une erreur est survenue lors du chargement des données.';
      },
    });
    this.subscriptions.add(load$);
  }
}
