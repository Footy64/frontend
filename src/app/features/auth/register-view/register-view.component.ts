import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
};

@Component({
  selector: 'app-register-view',
  standalone: false,
  templateUrl: './register-view.component.html',
  styleUrl: './register-view.component.scss',
})
export class RegisterViewComponent {
  isSubmitting = false;
  feedback: FeedbackState | null = null;
  passwordVisible = false;
  private readonly fb: FormBuilder = inject(FormBuilder);
  registerForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(72),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
      displayName: [''],
      newsletter: [true],
      terms: [false, Validators.requiredTrue],
    },
    { validators: RegisterViewComponent.passwordsMatchValidator },
  );
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);

  static passwordsMatchValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    if (password && confirm && password !== confirm) {
      return { passwordMismatch: true };
    }

    return null;
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  submit(): void {
    this.registerForm.updateValueAndValidity();

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const dto = {
      email: this.registerForm.value.email!,
      password: this.registerForm.value.password!,
      displayName: this.registerForm.value.displayName || undefined,
    };

    this.feedback = null;
    this.isSubmitting = true;

    this.authService
      .register(dto)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.feedback = {
            type: 'success',
            message:
              'Votre compte a été créé avec succès ! Vous allez être redirigé vers la connexion.',
          };
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 1500);
        },
        error: (error: HttpErrorResponse) => {
          this.feedback = {
            type: 'error',
            message:
              this.resolveErrorMessage(error) ||
              'Impossible de créer le compte pour le moment. Merci de réessayer plus tard.',
          };
        },
      });
  }

  private resolveErrorMessage(error: HttpErrorResponse): string | null {
    const payload = error.error;
    if (!payload) {
      return error.message || null;
    }

    if (typeof payload === 'string') {
      return payload;
    }

    if (payload?.message) {
      return payload.message;
    }

    return null;
  }
}
