import {Component, inject} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {AuthService} from '../auth.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {finalize} from 'rxjs';

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
};

@Component({
  selector: 'app-login-view',
  standalone: false,
  templateUrl: './login-view.component.html',
  styleUrl: './login-view.component.scss'
})
export class LoginViewComponent {
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);

  isSubmitting = false;
  feedback: FeedbackState | null = null;
  passwordVisible = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [true]
  });

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const dto = {
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!
    };

    this.feedback = null;
    this.isSubmitting = true;

    this.authService
      .login(dto)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.feedback = {
            type: 'success',
            message: 'Connexion réussie ! Redirection vers votre tableau de bord.'
          };
          setTimeout(() => {
            this.router.navigateByUrl('/');
          }, 1200);
        },
        error: (error: HttpErrorResponse) => {
          this.feedback = {
            type: 'error',
            message:
              this.resolveErrorMessage(error) ||
              'Une erreur inattendue est survenue. Merci de réessayer.'
          };
        }
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
