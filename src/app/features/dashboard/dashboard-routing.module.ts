import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardShellComponent } from './components/dashboard-shell/dashboard-shell.component';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';
import { TeamsPageComponent } from './components/teams-page/teams-page.component';
import { MatchesPageComponent } from './components/matches-page/matches-page.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: DashboardOverviewComponent },
      { path: 'teams', component: TeamsPageComponent },
      { path: 'matches', component: MatchesPageComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
