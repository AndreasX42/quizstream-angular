import { environment } from './environment/environment';

export class Configs {
  static API_KEY: string = environment.apiKey;
  static BASE_URL: string = environment.apiUrl;
  static QUIZZES_ENDPOINT = '/quizzes';
  static USERS_ENDPOINT = '/users';
  static QUIZ_DETAILS_ENDPOINT = '/details';
  static LOGIN_URL: string = this.USERS_ENDPOINT + '/login';
  static REGISTER_URL: string = this.USERS_ENDPOINT + '/register';
  static GET_BY_USERNAME: string = this.USERS_ENDPOINT + '/name';
  static QUIZ_REQUESTS: string = this.QUIZZES_ENDPOINT + '/requests';
  static LEADERBOARD: string = this.QUIZZES_ENDPOINT + '/leaderboard';
  static GET_ALL_QUIZZES_BY_USER_ID: string =
    this.QUIZZES_ENDPOINT + this.USERS_ENDPOINT;
}
