import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { ErrorManagerFactory } from '../../shared/error.manager.factory';
import { AuthService } from '../../services/auth.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIcon,
    ReactiveFormsModule,
    RouterLink,
    MatProgressSpinner,
    CommonModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  loggedIn = signal(false);
  hide = signal(true);
  isLoggingIn = signal(false);
  usernameErrorMessage = signal<string | undefined>(undefined);
  pwdErrorMessage = signal<string | undefined>(undefined);

  form = new FormGroup({
    username: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
    }),
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  async onSubmit() {
    if (this.form.invalid) {
      // update error messages of all form fields
      this.updateUsernameErrorMessage();
      this.updatePwdErrorMessage();
      return;
    }

    const username = this.form.value.username!;
    const password = this.form.value.password!;

    try {
      this.isLoggingIn.set(true);
      await this.authService.performLogin(username, password);
    } catch (error: unknown) {
      console.error('Error:', error);

      if (error && typeof error === 'object' && 'name' in error) {
        const amplifyError = error as { name: string; message: string };

        switch (amplifyError.name) {
          case 'UserNotConfirmedException':
            this.form.get('username')!.setErrors({ userNotConfirmed: true });
            this.updateUsernameErrorMessage();
            break;
          case 'UserAlreadyAuthenticatedException':
            this.form.get('username')!.setErrors({ userSignedIn: true });
            this.updateUsernameErrorMessage();
            break;
          case 'NotAuthorizedException':
            this.form.get('password')!.setErrors({ invalidCredentials: true });
            this.updatePwdErrorMessage();
            break;
          case 'UserNotFoundException':
            this.form.get('username')!.setErrors({ userInvalid: true });
            this.updateUsernameErrorMessage();
            break;
          default:
            this.form.get('username')!.setErrors({ unknownAmplifyError: true });
            this.updateUsernameErrorMessage();
        }
      } else {
        this.form.get('username')!.setErrors({ unknownAmplifyError: true });
        this.updateUsernameErrorMessage();
      }
    } finally {
      this.isLoggingIn.set(false);
    }
  }

  onHide(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  updateUsernameErrorMessage = ErrorManagerFactory.getFormErrorManager(
    this.form.get('username')!,
    this.usernameErrorMessage.set,
    {
      required: ErrorManagerFactory.MSG_IS_REQUIRED,
      minlength: ErrorManagerFactory.MSG_AT_LEAST_3_CHARS,
      userNotConfirmed: 'Please confirm your email address',
      userInvalid: 'Username invalid or not found',
      unknownAmplifyError: 'An unexpected error occurred',
      userSignedIn: 'User already signed in',
    }
  );

  updatePwdErrorMessage = ErrorManagerFactory.getFormErrorManager(
    this.form.get('password')!,
    this.pwdErrorMessage.set,
    {
      required: ErrorManagerFactory.MSG_IS_REQUIRED,
      minlength: ErrorManagerFactory.MSG_AT_LEAST_6_CHARS,
      invalidCredentials: 'Invalid username or password',
    }
  );
}
