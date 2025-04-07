import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Configs } from '../shared/api.configs';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  baseUrl = Configs.BASE_URL;

  /*  async perform_login() {
    const response = await signIn({
      username: 'qsadmin',
      password: '123m0ar137',
    });
    console.log(response);
  }

  async perform_signup() {
    const response = await signUp({
      username: 'qsadmin',
      password: '123m0ar137',
      options: {
        userAttributes: {
          email: 'andreas.pangerl.42@gmail.com',
        },
      },
    });
    console.log(response);
  }

  async perform_confirm_signup() {
    const response = await confirmSignUp({
      username: 'qsadmin',
      confirmationCode: '830996',
    });
    console.log(response);
  }

  async perform_logout() {
    const response = await signOut();
    console.log(response);
  }

  async perform_get_current_user() {
    const response = await getCurrentUser();
    console.log(response);
  }
    */
}
