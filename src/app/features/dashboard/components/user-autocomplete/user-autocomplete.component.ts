import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { TeamMember } from '../../../home/home.models';
import { UsersService } from '../../../users/users.service';

@Component({
  selector: 'app-user-autocomplete',
  standalone: false,
  templateUrl: './user-autocomplete.component.html',
  styleUrls: ['./user-autocomplete.component.scss'],
})
export class UserAutocompleteComponent implements OnInit, OnDestroy, OnChanges {
  readonly searchControl = new FormControl('', { nonNullable: true });
  @Input() placeholder = 'Rechercher un joueur';
  @Input() label = 'Ajouter un joueur';
  @Input() hint = 'Tapez au moins 2 lettres pour commencer';
  @Input() selectedUserIds: number[] = [];
  @Input() disabled = false;
  @Output() userSelected = new EventEmitter<TeamMember>();
  suggestions: TeamMember[] = [];
  isLoading = false;
  isOpen = false;
  error: string | null = null;
  readonly inputId =
    'user-autocomplete-' + Math.random().toString(36).slice(2, 9);
  private readonly destroy$ = new Subject<void>();
  private readonly minChars = 2;

  constructor(private readonly users: UsersService) {}

  ngOnInit(): void {
    if (this.disabled) {
      this.searchControl.disable({ emitEvent: false });
    }

    this.searchControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        map((value) => value.trim()),
        tap((value) => {
          if (value.length < this.minChars) {
            this.closePanel();
          }
        }),
        distinctUntilChanged(),
        filter((value) => value.length >= this.minChars),
        debounceTime(200),
        switchMap((value) => {
          this.isLoading = true;
          return this.users.search(value).pipe(
            finalize(() => (this.isLoading = false)),
            catchError(() => {
              this.error = 'Impossible de charger les joueurs';
              return of([] as TeamMember[]);
            }),
          );
        }),
      )
      .subscribe((results) => {
        this.error = null;
        this.suggestions = this.filterSelected(results);
        this.isOpen = true;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedUserIds'] && this.suggestions.length) {
      this.suggestions = this.filterSelected(this.suggestions);
    }

    if (changes['disabled']) {
      if (this.disabled) {
        this.searchControl.disable({ emitEvent: false });
        this.closePanel();
      } else {
        this.searchControl.enable({ emitEvent: false });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectUser(user: TeamMember): void {
    if (this.disabled) {
      return;
    }
    this.userSelected.emit(user);
    this.clear();
  }

  clear(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.closePanel();
  }

  handleFocus(): void {
    if (this.disabled) {
      return;
    }
    if (this.suggestions.length) {
      this.isOpen = true;
    }
  }

  handleBlur(): void {
    if (this.disabled) {
      return;
    }
    setTimeout(() => {
      this.isOpen = false;
    }, 120);
  }

  trackByUserId(_: number, user: TeamMember): number {
    return user.id;
  }

  private filterSelected(users: TeamMember[]): TeamMember[] {
    if (!this.selectedUserIds?.length) {
      return users;
    }
    const blocked = new Set(this.selectedUserIds);
    return users.filter((user) => !blocked.has(user.id));
  }

  private closePanel(): void {
    this.suggestions = [];
    this.isOpen = false;
    this.error = null;
  }
}
