import {Component, inject} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';

@Component({
  selector: 'app-login-view',
  standalone: false,
  templateUrl: './login-view.component.html',
  styleUrl: './login-view.component.scss'
})
export class LoginViewComponent {
  fb: FormBuilder = inject(FormBuilder);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit() {
    if (this.loginForm.invalid) return;

    const dto = {
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!
    };
  }
}
