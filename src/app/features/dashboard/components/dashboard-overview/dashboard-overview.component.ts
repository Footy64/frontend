import {Component, inject} from '@angular/core';
import {AuthStateService} from '../../../auth/auth-state.service';
import {DashboardDataService} from '../../dashboard-data.service';

@Component({
  selector: 'app-dashboard-overview',
  standalone: false,
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.scss']
})
export class DashboardOverviewComponent {
  private readonly authState = inject(AuthStateService);
  readonly data = inject(DashboardDataService);

  readonly user$ = this.authState.user$;
  readonly teams$ = this.data.teams$;
  readonly matches$ = this.data.matches$;
  readonly isLoadingTeams$ = this.data.isLoadingTeams$;
  readonly isLoadingMatches$ = this.data.isLoadingMatches$;
}
