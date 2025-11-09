import {Component, inject} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';

@Component({
  selector: 'app-register-view',
  standalone: false,
  templateUrl: './register-view.component.html',
  styleUrl: './register-view.component.scss'
})
export class RegisterViewComponent {
  fb: FormBuilder = inject(FormBuilder);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    displayName: ['']
  });

  submit() {
    if (this.registerForm.invalid) return;

    const dto = {
      email: this.registerForm.value.email!,
      password: this.registerForm.value.password!,
      displayName: this.registerForm.value.displayName || undefined
    };
  }
}
