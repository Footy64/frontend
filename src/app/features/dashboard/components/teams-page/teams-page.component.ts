import {Component, OnDestroy, inject} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {HttpErrorResponse} from '@angular/common/http';
import {DashboardDataService} from '../../dashboard-data.service';
import {Team, TeamMember} from '../../../home/home.models';

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

type MemberFormGroup = FormGroup<{userId: FormControl<number | null>}>;

@Component({
  selector: 'app-teams-page',
  standalone: false,
  templateUrl: './teams-page.component.html',
  styleUrls: ['./teams-page.component.scss']
})
export class TeamsPageComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(DashboardDataService);

  private readonly subscriptions = new Subscription();
  private readonly memberForms = new Map<number, MemberFormGroup>();
  private readonly memberLoaders = new Map<number, boolean>();

  readonly teams$ = this.data.teams$;
  readonly isLoadingTeams$ = this.data.isLoadingTeams$;

  createTeamForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(64)]],
    members: ['']
  });

  isCreatingTeam = false;
  teamFeedback: FeedbackState | null = null;

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.memberForms.clear();
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
      control?.setErrors({required: true});
      control?.markAsTouched();
      return;
    }

    const memberIds = this.parseMemberIds(this.createTeamForm.value.members ?? '');

    this.isCreatingTeam = true;
    this.teamFeedback = null;

    const create$ = this.data
      .createTeam({
        name,
        memberIds: memberIds.length ? memberIds : undefined
      })
      .pipe(finalize(() => (this.isCreatingTeam = false)))
      .subscribe({
        next: () => {
          this.createTeamForm.reset();
          this.teamFeedback = {type: 'success', message: 'Équipe créée avec succès !'};
        },
        error: error => {
          this.teamFeedback = {
            type: 'error',
            message:
              this.resolveHttpError(error) || "Impossible de créer l'équipe pour le moment."
          };
        }
      });

    this.subscriptions.add(create$);
  }

  getMemberForm(teamId: number): MemberFormGroup {
    let form = this.memberForms.get(teamId);
    if (!form) {
      form = this.fb.group({
        userId: this.fb.control<number | null>(null, {
          validators: [Validators.required, Validators.min(1)]
        })
      });
      this.memberForms.set(teamId, form);
    }

    return form;
  }

  addMember(team: Team): void {
    const form = this.getMemberForm(team.id);
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const userId = form.value.userId;
    if (userId == null) {
      form.setErrors({required: true});
      return;
    }

    this.memberLoaders.set(team.id, true);
    form.disable({emitEvent: false});

    const add$ = this.data
      .addMember(team.id, Number(userId))
      .pipe(
        finalize(() => {
          this.memberLoaders.delete(team.id);
          form.enable({emitEvent: false});
        })
      )
      .subscribe({
        next: updatedTeam => {
          this.patchMemberForm(team.id, updatedTeam);
          form.reset();
        },
        error: () => {
          form.setErrors({server: true});
        }
      });

    this.subscriptions.add(add$);
  }

  removeMember(team: Team, member: TeamMember): void {
    this.memberLoaders.set(team.id, true);

    const remove$ = this.data
      .removeMember(team.id, member.id)
      .pipe(finalize(() => this.memberLoaders.delete(team.id)))
      .subscribe({
        next: updatedTeam => this.patchMemberForm(team.id, updatedTeam),
        error: () => {
          this.memberLoaders.set(team.id, false);
        }
      });

    this.subscriptions.add(remove$);
  }

  isMemberActionLoading(teamId: number): boolean {
    return this.memberLoaders.get(teamId) ?? false;
  }

  private patchMemberForm(teamId: number, team: Team): void {
    const form = this.memberForms.get(teamId);
    if (form) {
      form.enable({emitEvent: false});
      form.reset();
    }
  }

  private parseMemberIds(raw: string): number[] {
    if (!raw) {
      return [];
    }

    return raw
      .split(/[;,\s]+/)
      .map(value => Number(value.trim()))
      .filter(id => Number.isInteger(id) && id > 0);
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
