import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AppInitService {
  private authService = inject(AuthService);

  async initApp(): Promise<void> {
    const isAccessTokenPresent =
      localStorage.getItem(this.authService.localStorageTokenKey) !== null;

    if (!isAccessTokenPresent) {
      await this.authService.deleteAuthDetails();
      await this.authService.performLogout();
    } else {
      await this.authService.restoreSession();
    }
  }
}
