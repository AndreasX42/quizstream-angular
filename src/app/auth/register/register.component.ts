import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ErrorManagerFactory } from '../../shared/error.manager.factory';
import { AuthService } from '../../services/auth.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

function equalValues(controlName1: string, controlName2: string) {
  return (control: AbstractControl) => {
    const val1 = control.get(controlName1)?.value;
    const val2 = control.get(controlName2)?.value;

    if (val1 === val2) {
      return null;
    }

    const errorMessage = { valuesNotEqual: true };
    if (controlName2 === 'confirmPassword') {
      control.get(controlName2)?.setErrors(errorMessage);
    }

    return { valuesNotEqual: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIcon,
    RouterLink,
    MatProgressSpinner,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  isRegistering = signal(false);
  hide = signal(true);
  usernameErrorMessage = signal<string | undefined>(undefined);
  emailErrorMessage = signal<string | undefined>(undefined);
  pwdErrorMessage = signal<string | undefined>(undefined);
  confirmPwdErrorMessage = signal<string | undefined>(undefined);
  verificationCodeErrorMessage = signal<string | undefined>(undefined);
  showVerificationCode = signal(false);

  form = new FormGroup({
    username: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: new FormControl('', {
      validators: [Validators.email, Validators.required],
    }),
    passwords: new FormGroup(
      {
        password: new FormControl('', {
          validators: [Validators.required, Validators.minLength(6)],
        }),
        confirmPassword: new FormControl('', {
          validators: [Validators.required, Validators.minLength(6)],
        }),
      },
      {
        validators: [equalValues('password', 'confirmPassword')],
      }
    ),
    verificationCode: new FormControl(
      { value: '', disabled: true },
      {
        validators: [Validators.required, Validators.minLength(6)],
      }
    ),
  });

  updateUsernameErrorMessage = ErrorManagerFactory.getFormErrorManager(
    this.form.get('username')!,
    this.usernameErrorMessage.set,
    {
      required: ErrorManagerFactory.MSG_IS_REQUIRED,
      minlength: ErrorManagerFactory.MSG_AT_LEAST_3_CHARS,
      invalidUsername: 'Username invalid or already used',
      unknownAmplifyError: 'An unexpected error occurred',
    }
  );

  updateEmailErrorMessage = ErrorManagerFactory.getFormErrorManager(
    this.form.get('email')!,
    this.emailErrorMessage.set,
    {
      required: ErrorManagerFactory.MSG_IS_REQUIRED,
      email: ErrorManagerFactory.MSG_VALID_EMAIL,
      invalidEmailOrInUse: 'Email invalid or already used',
    }
  );

  updatePwdErrorMessage = ErrorManagerFactory.getFormErrorManager(
    this.form.controls.passwords.get('password')!,
    this.pwdErrorMessage.set,
    {
      required: ErrorManagerFactory.MSG_IS_REQUIRED,
      minlength: ErrorManagerFactory.MSG_AT_LEAST_6_CHARS,
      passwordPolicy: 'Password invalid',
    }
  );

  updateConfirmPwdErrorMessage = ErrorManagerFactory.getFormErrorManager(
    this.form.controls.passwords.get('confirmPassword')!,
    this.confirmPwdErrorMessage.set,
    {
      required: ErrorManagerFactory.MSG_IS_REQUIRED,
      minlength: ErrorManagerFactory.MSG_AT_LEAST_6_CHARS,
      valuesNotEqual: 'Passwords must match',
    }
  );

  updateVerificationCodeErrorMessage = ErrorManagerFactory.getFormErrorManager(
    this.form.get('verificationCode')!,
    this.verificationCodeErrorMessage.set,
    {
      required: ErrorManagerFactory.MSG_IS_REQUIRED,
      minlength: ErrorManagerFactory.MSG_AT_LEAST_6_CHARS,
      codeMismatch: 'Invalid verification code',
      codeExpired: 'Code has expired',
      alreadyConfirmed: 'User already confirmed',
      userNotFound: 'User not found',
      unknownAmplifyError: 'An unexpected error occurred',
    }
  );

  async onSubmit() {
    if (this.form.invalid) {
      // update error messages for all form fields
      this.updateUsernameErrorMessage();
      this.updateEmailErrorMessage();
      this.updatePwdErrorMessage();
      this.updateConfirmPwdErrorMessage();
      if (this.showVerificationCode()) {
        this.updateVerificationCodeErrorMessage();
      }
      return;
    }

    const formValues = this.form.getRawValue();
    const username = formValues.username!;
    const email = formValues.email!;
    const password = formValues.passwords!.password!;

    try {
      this.isRegistering.set(true);

      if (!this.showVerificationCode()) {
        const result = await this.authService.performSignUp(
          username,
          email,
          password
        );
        if (result.needsConfirmation) {
          this.showVerificationCode.set(true);
          this.form.get('verificationCode')?.enable();
          this.form.get('username')?.disable();
          this.form.get('email')?.disable();
          this.form.get('passwords')?.disable();
        }
      } else {
        const verificationCode = formValues.verificationCode!;
        await this.authService.performConfirmSignUp(username, verificationCode);
      }
    } catch (error: unknown) {
      console.error('Error:', error);

      if (error && typeof error === 'object' && 'name' in error) {
        const amplifyError = error as { name: string; message: string };

        if (!this.showVerificationCode()) {
          const usernameControl = this.form.get('username')!;
          const emailControl = this.form.get('email')!;
          const pwdControl = this.form.get('passwords.password')!;

          switch (amplifyError.name) {
            case 'UsernameExistsException':
              usernameControl.setErrors({ invalidUsername: true });
              this.updateUsernameErrorMessage();
              break;
            case 'InvalidPasswordException':
              pwdControl.setErrors({ passwordPolicy: true });
              this.updatePwdErrorMessage();
              break;
            case 'InvalidParameterException':
              emailControl.setErrors({ invalidEmailOrInUse: true });
              this.updateEmailErrorMessage();
              break;
            default:
              usernameControl.setErrors({ unknownAmplifyError: true });
              this.updateUsernameErrorMessage();
          }
        } else {
          const verificationControl = this.form.get('verificationCode')!;

          switch (amplifyError.name) {
            case 'CodeMismatchException':
              verificationControl.setErrors({ codeMismatch: true });
              break;
            case 'ExpiredCodeException':
              verificationControl.setErrors({ codeExpired: true });
              break;
            case 'NotAuthorizedException':
              verificationControl.setErrors({ alreadyConfirmed: true });
              break;
            case 'UserNotFoundException':
              verificationControl.setErrors({ userNotFound: true });
              break;
            default:
              verificationControl.setErrors({ unknownAmplifyError: true });
          }
          this.updateVerificationCodeErrorMessage();
        }
      } else {
        if (!this.showVerificationCode()) {
          this.form.get('username')!.setErrors({ unknownAmplifyError: true });
          this.updateUsernameErrorMessage();
        } else {
          this.form
            .get('verificationCode')!
            .setErrors({ unknownAmplifyError: true });
          this.updateVerificationCodeErrorMessage();
        }
      }
    } finally {
      this.isRegistering.set(false);
    }
  }

  onHide(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }
}
