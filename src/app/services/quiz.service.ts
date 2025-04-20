import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  Quiz,
  QuizCreateRequestDto,
  QuizDetails,
  QuizDifficulty,
  QuizLanguage,
  QuizType,
  QuizUpdateRequestDto,
  QuizRequest,
} from './../models/quiz.model';
import { AuthService } from './auth.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Configs } from '../shared/api.configs';
import { KeyService } from './key.service';
import { MessageService } from './message.service';
import { Router } from '@angular/router';
import { Page } from '../models/page.model';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private keyService = inject(KeyService);
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private quizzes = signal<Quiz[]>([]);

  isCreating = signal(false);

  getQuizzes() {
    return this.quizzes.asReadonly();
  }

  getAllQuizzes(
    userId: string,
    page: number,
    size: number,
    sort: string
  ): Observable<Page<Quiz>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    return this.httpClient.get<Page<Quiz>>(Configs.getUserQuizBaseUrl(userId), {
      params,
    });
  }

  addQuiz(quizData: {
    quizName: string;
    videoUrl: string;
    language: QuizLanguage;
    type: QuizType;
    difficulty: QuizDifficulty;
  }) {
    // Convert keys map to an object
    const apiKeyObject = this.keyService.keys().reduce((obj, current) => {
      // Prepare backend API call arguments
      const currentProviderName = current.provider.toUpperCase() + '_API_KEY';
      obj[currentProviderName] = current.key;
      return obj;
    }, {} as Record<string, string>);

    const createQuizDto: QuizCreateRequestDto = {
      ...quizData,
      userId: this.authService.user()!.id,
      apiKeys: apiKeyObject,
    };

    this.isCreating.set(true);
    const sub = this.createQuizRequest(createQuizDto).subscribe({
      next: () => {
        this.isCreating.set(false);
      },
      error: () => {
        this.isCreating.set(false);
        this.messageService.showErrorModal(
          MessageService.MSG_ERROR_CREATING_QUIZ_REQUEST
        );
      },

      complete: () => {
        this.messageService.showSuccessModal(
          MessageService.MSG_SUCCESS_CREATED_QUIZ
        );

        this.router.navigate(['/quizzes'], {
          queryParams: { createdRequest: 'true' },
          fragment: 'requests',
          replaceUrl: true,
        });
      },
    });

    this.destroyRef.onDestroy(() => {
      sub.unsubscribe();
    });
  }

  createQuizRequest(requestDto: QuizCreateRequestDto): Observable<QuizRequest> {
    return this.httpClient.post<QuizRequest>(
      Configs.getUserQuizBaseUrl(this.authService.user()!.id),
      {
        userId: requestDto.userId,
        username: this.authService.user()!.username,
        quizName: requestDto.quizName.toLowerCase(),
        videoUrl: requestDto.videoUrl,
        apiKeys: requestDto.apiKeys,
        language: requestDto.language,
        type: requestDto.type,
        difficulty: requestDto.difficulty,
      },
      {
        observe: 'body',
      }
    );
  }

  updateQuiz(requestDto: QuizUpdateRequestDto): Observable<Quiz> {
    return this.httpClient.put<Quiz>(
      Configs.getUserQuizBaseUrl(this.authService.user()!.id),
      {
        userId: requestDto.userId,
        quizId: requestDto.quizId,
        numCorrect: requestDto.numCorrect,
        quizName: '',
      },
      {
        observe: 'body',
      }
    );
  }

  deleteQuiz(quizId: string): Observable<void> {
    return this.httpClient.delete<void>(
      Configs.getUserQuizUrl(this.authService.user()!.id, quizId)
    );
  }

  getQuizDetails(quizId: string): Observable<QuizDetails> {
    return this.httpClient.get<QuizDetails>(
      Configs.getUserQuizDetailsUrl(this.authService.user()!.id, quizId)
    );
  }
}
