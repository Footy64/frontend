import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {DashboardRoutingModule} from './dashboard-routing.module';
import {DashboardShellComponent} from './components/dashboard-shell/dashboard-shell.component';
import {DashboardOverviewComponent} from './components/dashboard-overview/dashboard-overview.component';
import {TeamsPageComponent} from './components/teams-page/teams-page.component';
import {MatchesPageComponent} from './components/matches-page/matches-page.component';
import {DashboardDataService} from './dashboard-data.service';

@NgModule({
  declarations: [
    DashboardShellComponent,
    DashboardOverviewComponent,
    TeamsPageComponent,
    MatchesPageComponent
  ],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DashboardRoutingModule],
  providers: [DashboardDataService]
})
export class DashboardModule {}
