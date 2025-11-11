import { Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardDataService } from '../../dashboard-data.service';
import { Team, TeamMember } from '../../../home/home.models';

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-teams-page',
  standalone: false,
  templateUrl: './teams-page.component.html',
  styleUrls: ['./teams-page.component.scss'],
})
export class TeamsPageComponent implements OnDestroy {
  selectedMembers: TeamMember[] = [];
  isCreatingTeam = false;
  teamFeedback: FeedbackState | null = null;
  private readonly fb = inject(FormBuilder);
  createTeamForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(64)]],
  });
  private readonly data = inject(DashboardDataService);
  readonly teams$ = this.data.teams$;
  readonly isLoadingTeams$ = this.data.isLoadingTeams$;
  private readonly subscriptions = new Subscription();
  private readonly memberLoaders = new Map<number, boolean>();
  private selectedMemberIdsCache: number[] = [];

  get selectedMemberIds(): number[] {
    return this.selectedMemberIdsCache;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.memberLoaders.clear();
  }

  trackByTeamId(_: number, team: Team): number {
    return team.id;
  }

  createTeam(): void {
    if (this.createTeamForm.invalid) {
      this.createTeamForm.markAllAsTouched();
      return;
    }

    const name = this.createTeamForm.value.name?.trim() ?? '';
    if (!name) {
      const control = this.createTeamForm.get('name');
      control?.setErrors({ required: true });
      control?.markAsTouched();
      return;
    }

    const memberIds = this.selectedMembers.map((member) => member.id);

    this.isCreatingTeam = true;
    this.teamFeedback = null;

    const create$ = this.data
      .createTeam({
        name,
        memberIds: memberIds.length ? memberIds : undefined,
      })
      .pipe(finalize(() => (this.isCreatingTeam = false)))
      .subscribe({
        next: () => {
          this.createTeamForm.reset();
          this.selectedMembers = [];
          this.syncSelectedMemberIds();
          this.teamFeedback = {
            type: 'success',
            message: 'Équipe créée avec succès !',
          };
        },
        error: (error) => {
          this.teamFeedback = {
            type: 'error',
            message:
              this.resolveHttpError(error) ||
              "Impossible de créer l'équipe pour le moment.",
          };
        },
      });

    this.subscriptions.add(create$);
  }

  onCreateMemberSelected(member: TeamMember): void {
    if (this.selectedMembers.some((existing) => existing.id === member.id)) {
      return;
    }
    this.selectedMembers = [...this.selectedMembers, member];
    this.syncSelectedMemberIds();
  }

  removeSelectedMember(memberId: number): void {
    this.selectedMembers = this.selectedMembers.filter(
      (member) => member.id !== memberId,
    );
    this.syncSelectedMemberIds();
  }

  addMemberToTeam(team: Team, member: TeamMember): void {
    if (this.isMemberActionLoading(team.id)) {
      return;
    }

    this.memberLoaders.set(team.id, true);
    const add$ = this.data
      .addMember(team.id, member.id)
      .pipe(finalize(() => this.memberLoaders.delete(team.id)))
      .subscribe({
        error: (error) => {
          this.teamFeedback = {
            type: 'error',
            message:
              this.resolveHttpError(error) ||
              "Impossible d'ajouter ce joueur pour le moment.",
          };
        },
      });

    this.subscriptions.add(add$);
  }

  removeMember(team: Team, member: TeamMember): void {
    this.memberLoaders.set(team.id, true);

    const remove$ = this.data
      .removeMember(team.id, member.id)
      .pipe(finalize(() => this.memberLoaders.delete(team.id)))
      .subscribe({
        error: (error) => {
          this.teamFeedback = {
            type: 'error',
            message:
              this.resolveHttpError(error) ||
              'Impossible de retirer ce joueur pour le moment.',
          };
        },
      });

    this.subscriptions.add(remove$);
  }

  isMemberActionLoading(teamId: number): boolean {
    return this.memberLoaders.get(teamId) ?? false;
  }

  memberIds(team: Team): number[] {
    return team.members.map((member) => member.id);
  }

  private syncSelectedMemberIds(): void {
    this.selectedMemberIdsCache = this.selectedMembers.map(
      (member) => member.id,
    );
  }

  private resolveHttpError(error: unknown): string | null {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error;
      if (typeof payload === 'string') {
        return payload;
      }

      if (payload?.message) {
        return payload.message;
      }
    }

    return null;
  }
}
