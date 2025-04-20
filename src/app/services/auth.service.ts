import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { MessageService } from './message.service';
import {
  signUp,
  confirmSignUp,
  signIn,
  getCurrentUser,
  fetchUserAttributes,
  signOut,
  deleteUser,
  fetchAuthSession,
} from 'aws-amplify/auth';
import { AuthUser } from '@aws-amplify/auth';
import { KeyService } from './key.service';
import { firstValueFrom } from 'rxjs';
import { Configs } from '../shared/api.configs';
import { HttpClient } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { HttpStatusCode } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  _isLoggedIn = signal(false);
  _user = signal<User | undefined>(undefined);
  _accessToken = signal<string | undefined>(undefined);

  router = inject(Router);
  private messageService = inject(MessageService);
  keyService = inject(KeyService);
  httpClient = inject(HttpClient);

  loginTime = signal<Date | undefined>(undefined);
  expiryTime = signal<Date | undefined>(undefined);
  localStorageLoginTimeKey = 'login-time';
  localStorageTokenKey = 'access-token';

  isLoggedIn = this._isLoggedIn.asReadonly();
  user = this._user.asReadonly();
  accessToken = this._accessToken.asReadonly();

  initializeSessionTimer(): void {
    const loginTime = localStorage.getItem(this.localStorageLoginTimeKey);
    const now = Date.now();
    if (loginTime) {
      this.loginTime.set(new Date(loginTime));
      this.expiryTime.set(new Date(parseInt(loginTime) + 2 * 60 * 60 * 1000));
    } else {
      this.loginTime.set(new Date(now));
      this.expiryTime.set(new Date(now + 2 * 60 * 60 * 1000));
    }
  }

  async checkSessionState(): Promise<void> {
    try {
      const session = await fetchAuthSession();
      if (!session.tokens) {
        throw new Error('Session invalid or expired');
      }
      this._accessToken.set(session.tokens.accessToken.toString());
      localStorage.setItem(
        this.localStorageTokenKey,
        session.tokens.accessToken.toString()
      );
    } catch (err) {
      console.error('Auth session invalid:', err);
      this.messageService.showErrorModal(
        MessageService.MSG_ERROR_SESSION_EXPIRED
      );
      await this.performLogout();
      return;
    }
  }
  async restoreSession(): Promise<boolean> {
    try {
      const user = await getCurrentUser();
      await this.setAuthDetails(user);
      await this.checkSessionState();
      return true;
    } catch (error: unknown) {
      console.log('No active Cognito session', error);
      this.messageService.showErrorModal(
        MessageService.MSG_ERROR_SESSION_EXPIRED
      );
      await this.performLogout();
      this.deleteAuthDetails();
      return false;
    }
  }

  async performDeleteAccount(): Promise<void> {
    try {
      // Step 1: Delete user in Spring Boot
      await firstValueFrom(this.deleteUserInSB());
      console.log('User deleted from SpringBoot');

      // Step 2: Delete user in Cognito
      await deleteUser();
      console.log('User deleted from Cognito');

      // Step 3: Clean up and navigate to login
      this.deleteAuthDetails();
      this.router.navigate(['/login'], { replaceUrl: true });
      this.messageService.showSuccessModal(
        MessageService.MSG_SUCCESS_DELETE_USER_ACCOUNT
      );

      console.log('User account successfully deleted');
    } catch (error: unknown) {
      this.messageService.showErrorModal(
        MessageService.MSG_ERROR_DELETE_USER_ACCOUNT
      );
      this.router.navigate(['/profile'], { replaceUrl: true });

      console.error('Error deleting user:', error);
      throw error instanceof Error
        ? error
        : new Error('Unknown error, could not delete user');
    }
  }

  async setAuthDetails(user: AuthUser) {
    const attributes = await fetchUserAttributes();
    this.initializeSessionTimer();
    this._isLoggedIn.set(true);
    this._user.set({
      id: user.userId,
      username: user.username,
      email: attributes.email || '',
      role: 'user',
    });
  }

  deleteAuthDetails() {
    this._isLoggedIn.set(false);
    this._user.set(undefined);
    localStorage.removeItem(this.localStorageLoginTimeKey);
    localStorage.removeItem(this.localStorageTokenKey);
    localStorage.removeItem(this.keyService.localStorageApiKeys);
    this.loginTime.set(undefined);
    this.expiryTime.set(undefined);
    this._accessToken.set(undefined);
  }

  async performSignUp(
    username: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; needsConfirmation: boolean }> {
    try {
      const response = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });

      if (
        response.isSignUpComplete ||
        response.nextStep.signUpStep === 'DONE'
      ) {
        this.router.navigate(['/login'], { replaceUrl: true });
        return { success: true, needsConfirmation: false };
      }

      return { success: true, needsConfirmation: true };
    } catch (error: unknown) {
      console.error('Error during signup', error);
      await deleteUser(); // delete user from Cognito
      throw error;
    }
  }

  async performConfirmSignUp(username: string, code: string) {
    try {
      const response = await confirmSignUp({
        username,
        confirmationCode: code,
      });

      console.log('Confirm sign up response:', response);
      this.router.navigate(['/login'], { replaceUrl: true });
      return { success: true };
    } catch (error: unknown) {
      console.error('Error confirming sign up:', error);
      throw error;
    }
  }

  async performLogin(username: string, password: string) {
    try {
      const response = await signIn({
        username,
        password,
      });

      const user = await getCurrentUser();

      localStorage.setItem(
        this.localStorageLoginTimeKey,
        Date.now().toString()
      );

      await this.checkSessionState();

      if (response.isSignedIn) {
        await this.setAuthDetails(user);
        this.router.navigate(['/profile'], { replaceUrl: true });
        return { success: true };
      }

      return { success: false };
    } catch (error: unknown) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async performLogout(): Promise<void> {
    await signOut();
    this.deleteAuthDetails();
    this.router.navigate(['/'], { replaceUrl: true });
  }

  deleteUserInSB(): Observable<HttpResponse<void>> {
    return this.httpClient
      .delete<void>(Configs.getUserBaseUrl(this.user()!.id), {
        observe: 'response',
      })
      .pipe(
        map((response) => {
          if (response.status !== HttpStatusCode.NoContent) {
            throw new Error('Error deleting user in SpringBoot');
          }
          return response;
        }),

        catchError((error) => {
          return throwError(() => error);
        })
      );
  }
}
