import { inject, Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const token = this.authService.accessToken();

    if (token) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      // Only inject claims headers in development
      if (environment.ngEnvironment !== 'production') {
        const claims = {
          sub: this.authService.user()?.id ?? 'local-user',
          email: this.authService.user()?.email ?? 'local-user@example.com',
          'cognito:groups': ['ADMIN'],
        };
        headers['x-amzn-oidc-identity'] = claims.sub;
        headers['x-amzn-oidc-data'] = JSON.stringify(claims);
      }

      const clonedRequest = req.clone({
        setHeaders: headers,
      });

      return next.handle(clonedRequest);
    }

    return next.handle(req);
  }
}
