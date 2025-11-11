import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardDataService } from '../../dashboard-data.service';
import { Match } from '../../../home/home.models';

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

type ScoreFormGroup = FormGroup<{
  homeScore: FormControl<number | null>;
  awayScore: FormControl<number | null>;
}>;

@Component({
  selector: 'app-matches-page',
  standalone: false,
  templateUrl: './matches-page.component.html',
  styleUrls: ['./matches-page.component.scss'],
})
export class MatchesPageComponent implements OnInit, OnDestroy {
  readonly scoreFeedbacks = new Map<number, FeedbackState>();
  isCreatingMatch = false;
  matchFeedback: FeedbackState | null = null;
  private readonly fb = inject(FormBuilder);
  createMatchForm = this.fb.group(
    {
      homeTeamId: this.fb.control<number | null>(null, {
        validators: [Validators.required],
      }),
      awayTeamId: this.fb.control<number | null>(null, {
        validators: [Validators.required],
      }),
      date: ['', [Validators.required]],
      place: ['', [Validators.required, Validators.maxLength(120)]],
    },
    { validators: MatchesPageComponent.differentTeamsValidator },
  );
  private readonly data = inject(DashboardDataService);
  readonly teams$ = this.data.teams$;
  readonly matches$ = this.data.matches$;
  readonly isLoadingMatches$ = this.data.isLoadingMatches$;
  private readonly subscriptions = new Subscription();
  private readonly scoreForms = new Map<number, ScoreFormGroup>();
  private readonly scoreLoaders = new Map<number, boolean>();

  private static differentTeamsValidator(
    group: FormGroup,
  ): null | { sameTeams: true } {
    const homeTeamId = group.get('homeTeamId')?.value;
    const awayTeamId = group.get('awayTeamId')?.value;

    if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
      return { sameTeams: true };
    }

    return null;
  }

  ngOnInit(): void {
    const matchesSubscription = this.matches$.subscribe((matches) => {
      for (const match of matches) {
        this.prefillScoreForm(match);
      }
    });
    this.subscriptions.add(matchesSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.scoreForms.clear();
    this.scoreLoaders.clear();
    this.scoreFeedbacks.clear();
  }

  trackByMatchId(_: number, match: Match): number {
    return match.id;
  }

  createMatch(): void {
    if (this.createMatchForm.invalid) {
      this.createMatchForm.markAllAsTouched();
      return;
    }

    const { homeTeamId, awayTeamId, date, place } = this.createMatchForm.value;
    if (!homeTeamId || !awayTeamId) {
      this.createMatchForm.setErrors({ required: true });
      return;
    }

    const payload = {
      homeTeamId,
      awayTeamId,
      date: this.toIsoString(date ?? ''),
      place: place?.trim() ?? '',
    };

    if (!payload.date || !payload.place) {
      if (!payload.date) {
        this.createMatchForm.get('date')?.setErrors({ required: true });
      }
      if (!payload.place) {
        this.createMatchForm.get('place')?.setErrors({ required: true });
      }
      return;
    }

    this.isCreatingMatch = true;
    this.matchFeedback = null;

    const create$ = this.data
      .createMatch(payload)
      .pipe(finalize(() => (this.isCreatingMatch = false)))
      .subscribe({
        next: (match) => {
          this.createMatchForm.reset();
          this.matchFeedback = {
            type: 'success',
            message: 'Match programmé avec succès !',
          };
          this.prefillScoreForm(match);
        },
        error: (error) => {
          this.matchFeedback = {
            type: 'error',
            message:
              this.resolveHttpError(error) ||
              'Impossible de planifier le match pour le moment.',
          };
        },
      });

    this.subscriptions.add(create$);
  }

  getScoreForm(matchId: number): ScoreFormGroup {
    let form = this.scoreForms.get(matchId);
    if (!form) {
      form = this.fb.group({
        homeScore: this.fb.control<number | null>(null, {
          validators: [Validators.required, Validators.min(0)],
        }),
        awayScore: this.fb.control<number | null>(null, {
          validators: [Validators.required, Validators.min(0)],
        }),
      });
      this.scoreForms.set(matchId, form);
    }
    return form;
  }

  updateScore(match: Match): void {
    const form = this.getScoreForm(match.id);
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const homeScore = form.value.homeScore;
    const awayScore = form.value.awayScore;
    if (homeScore == null || awayScore == null) {
      form.setErrors({ required: true });
      return;
    }

    this.scoreLoaders.set(match.id, true);
    form.disable({ emitEvent: false });
    this.scoreFeedbacks.delete(match.id);

    const update$ = this.data
      .updateScore(match.id, {
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
      })
      .pipe(
        finalize(() => {
          this.scoreLoaders.delete(match.id);
          form.enable({ emitEvent: false });
        }),
      )
      .subscribe({
        next: (updatedMatch) => {
          this.prefillScoreForm(updatedMatch);
          this.scoreFeedbacks.set(match.id, {
            type: 'success',
            message: 'Score enregistré !',
          });
        },
        error: (error) => {
          this.scoreFeedbacks.set(match.id, {
            type: 'error',
            message:
              this.resolveHttpError(error) ||
              'Impossible de mettre à jour le score pour le moment.',
          });
        },
      });

    this.subscriptions.add(update$);
  }

  isScoreActionLoading(matchId: number): boolean {
    return this.scoreLoaders.get(matchId) ?? false;
  }

  private prefillScoreForm(match: Match): void {
    const form = this.getScoreForm(match.id);
    form.patchValue(
      {
        homeScore: match.score?.home ?? null,
        awayScore: match.score?.away ?? null,
      },
      { emitEvent: false },
    );
  }

  private toIsoString(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString();
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
