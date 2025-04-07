import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { MatButton } from '@angular/material/button';
import { interval } from 'rxjs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ThemeService } from '../../services/theme.service';
import { MessageService } from '../../services/message.service';
import { TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatButton,
    MatSlideToggleModule,
    TitleCasePipe,
    RouterLink,
    MatProgressSpinnerModule,
    CommonModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  selectedDarkMode = this.themeService.isDarkMode;

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  sessionTimeLeft = signal<string | undefined>(undefined);
  user = this.authService.user;
  isLoggingOut = signal(false);

  ngOnInit(): void {
    this.initializeSessionTimer();
  }

  async logout(): Promise<void> {
    this.isLoggingOut.set(true);
    await this.authService.performLogout();
    this.isLoggingOut.set(false);
  }

  deleteAccount() {
    const dialogRef = this.messageService.showConfirmModal(
      MessageService.MSG_WARNING_DELETE_USER_ACCOUNT
    );

    dialogRef.afterClosed().subscribe(async (confirm) => {
      if (!confirm) {
        return;
      }

      await this.authService.performDeleteAccount();
      await this.authService.performLogout();
    });
  }

  initializeSessionTimer(): void {
    const loginTime = this.authService.loginTime();
    const expiryTime = this.authService.expiryTime();
    if (loginTime && expiryTime) {
      const sub = interval(1000).subscribe(async () => {
        const currentTime = Date.now();
        const timeLeft = expiryTime.getTime() - currentTime;

        if (timeLeft > 0) {
          this.sessionTimeLeft.set(this.formatTimeLeft(timeLeft));
        } else {
          this.sessionTimeLeft.set('Session expired');
          await this.authService.performLogout();
        }
      });

      this.destroyRef.onDestroy(() => {
        sub.unsubscribe();
      });
    }
  }

  formatTimeLeft(timeLeft: number): string {
    const hours = Math.floor((timeLeft / 1000 / 60 / 60) % 24);
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    return `${hours}h ${minutes}m ${seconds}s`;
  }
}
