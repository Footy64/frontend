import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeViewComponent} from './features/home/home-view/home-view.component';

const routes: Routes = [
  {path: '', component: HomeViewComponent, pathMatch: 'full'},
  {path: 'auth', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)},
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
