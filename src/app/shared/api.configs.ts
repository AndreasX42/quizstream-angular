import { environment } from './environment/environment';

export class Configs {
  static BASE_URL: string = environment.apiUrl;
  static QUIZZES_ENDPOINT = '/quizzes';
  static USERS_ENDPOINT = '/users';

  // returns /users/{userId}
  static getUserBaseUrl(userId: string): string {
    return `${this.BASE_URL}${this.USERS_ENDPOINT}/${userId}`;
  }

  // returns /users/{userId}/quizzes
  static getUserQuizBaseUrl(userId: string): string {
    return `${this.getUserBaseUrl(userId)}${this.QUIZZES_ENDPOINT}`;
  }

  // returns /users/{userId}/quizzes/{quizId}
  static getUserQuizUrl(userId: string, quizId: string): string {
    return `${this.getUserQuizBaseUrl(userId)}/${quizId}`;
  }

  // returns /users/{userId}/quizzes/{quizId}/details
  static getUserQuizDetailsUrl(userId: string, quizId: string): string {
    return `${this.getUserQuizUrl(userId, quizId)}/details`;
  }

  // returns /users/{userId}/quizzes/requests
  static getUserQuizRequestsUrl(userId: string): string {
    return `${this.getUserQuizBaseUrl(userId)}/requests`;
  }

  // returns /quizzes/leaderboard
  static getLeaderboardUrl(): string {
    return `${this.BASE_URL}${this.QUIZZES_ENDPOINT}/leaderboard`;
  }
}
