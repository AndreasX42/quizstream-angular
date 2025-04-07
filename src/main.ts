import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import { Amplify } from 'aws-amplify';

import { environment } from './app/shared/environment/environment';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.userPoolId,
      userPoolClientId: environment.userPoolWebClientId,
    },
  },
});

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
