import { AbstractControl } from '@angular/forms';

export class ErrorManagerFactory {
  static MSG_IS_REQUIRED = 'Field is required';
  static MSG_AT_LEAST_3_CHARS = 'Must be at least 3 characters';
  static MSG_AT_LEAST_6_CHARS = 'Must be at least 6 characters';
  static MSG_VALID_EMAIL = 'Must be valid email';
  static MSG_VALID_YOUTUBE_LINK = 'Must be a valid YouTube link';

  static getFormErrorManager(
    control: AbstractControl,
    signalSetter: (message: string) => void,
    errorMessagesMap: Record<string, string>
  ) {
    return () => {
      for (const errorName in errorMessagesMap) {
        if (control.hasError(errorName)) {
          signalSetter(errorMessagesMap[errorName]);
          return;
        }
      }
      signalSetter('');
    };
  }
}
