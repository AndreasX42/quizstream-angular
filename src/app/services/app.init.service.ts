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

    if (isAccessTokenPresent) {
      const isSessionRestored = await this.authService.restoreSession();
      if (!isSessionRestored) {
        await this.authService.performLogout();
      }
    }
  }
}
