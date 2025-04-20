import { inject, Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, from, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> =
    new BehaviorSubject<string | null>(null);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const token = this.authService.accessToken();

    // Add token if available
    let authReq = req;
    if (token) {
      authReq = this.addTokenHeader(req, token);
    }

    return next.handle(authReq).pipe(
      catchError((error) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          !authReq.url.includes('/login')
        ) {
          return this.handle401Error(authReq, next);
        }
        // Propagate other errors
        return throwError(() => error);
      })
    );
  }

  private handle401Error(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // If already refreshing, wait for the new token
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => {
          // Retry the request with the new token
          return next.handle(this.addTokenHeader(request, token!));
        }),
        catchError((err) => {
          // If waiting failed (e.g., refresh failed), propagate error
          // Logout should have been handled by the initial refresh failure
          return throwError(() => err);
        })
      );
    } else {
      // Start the refresh process
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return from(this.authService.checkSessionState()).pipe(
        switchMap(() => {
          const newToken = this.authService.accessToken();
          if (!newToken) {
            // Logout should occur within checkSessionState on error
            throw new Error(
              'Token refresh failed unexpectedly after success signal.'
            );
          }
          this.refreshTokenSubject.next(newToken);
          // Retry the original triggering request
          return next.handle(this.addTokenHeader(request, newToken));
        }),
        catchError((refreshError) => {
          // checkSessionState failed, it handles logout/message
          this.refreshTokenSubject.next(null); // Signal refresh failure
          console.error('Token refresh failed in interceptor:', refreshError);
          // Propagate the error to fail the original request
          return throwError(() => refreshError);
        }),
        finalize(() => {
          // Ensure isRefreshing is always set to false when the refresh flow completes
          this.isRefreshing = false;
        })
      );
    }
  }

  // Helper to add the Authorization header
  private addTokenHeader(
    request: HttpRequest<unknown>,
    token: string
  ): HttpRequest<unknown> {
    return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
}
