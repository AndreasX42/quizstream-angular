import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { QuizService } from '../../services/quiz.service';
import { HttpClient } from '@angular/common/http';
import {
  QuizDetails,
  QuizQuestionDetails,
  QuizUpdateRequestDto,
} from '../../models/quiz.model';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from '../../services/message.service';
import { CommonModule } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-solve-quiz',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinner,
    MatButtonModule,
    RouterLink,
    MatProgressBar,
  ],
  templateUrl: './solve-quiz.component.html',
  styleUrl: './solve-quiz.component.css',
})
export class SolveQuizComponent {
  private quizService = inject(QuizService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);

  isLoadingQuiz = signal(false);
  isCompleted = signal(false);
  quizDetails: QuizDetails | null = null;
  quizId: string | null = null;

  currentQuestionIndex = 0;
  numberOfCorrectAnswers = 0;
  numberOfQuestions = 0;
  currentQuestion: QuizQuestionDetails | null = null;
  answerOptions: string[] = [];
  selectedAnswerIndex: number | null = null;
  showResult = false;

  ngOnInit(): void {
    this.quizId = this.route.snapshot.paramMap.get('quizId');
    this.getQuizDetails(this.quizId!);
  }

  loadQuestion(): void {
    if (this.currentQuestionIndex < this.numberOfQuestions) {
      this.currentQuestion =
        this.quizDetails!.questionAnswersList[this.currentQuestionIndex];

      this.answerOptions = this.shuffleAnswers([
        this.currentQuestion.correctAnswer,
        ...this.currentQuestion.wrongAnswers,
      ]);

      this.selectedAnswerIndex = null;
      this.showResult = false;
    }
  }

  selectAnswer(answer: string, index: number): void {
    if (this.currentQuestion!.correctAnswer == this.answerOptions[index]) {
      this.numberOfCorrectAnswers++;
    }

    this.selectedAnswerIndex = index;
    this.showResult = true;
  }

  goToNextQuestion(): void {
    if (this.currentQuestionIndex < this.numberOfQuestions) {
      this.currentQuestionIndex++;
      this.loadQuestion();
    } else {
      this.currentQuestion = null;
      this.isCompleted.set(true);

      this.updateQuizData();
    }
  }

  updateQuizData() {
    const updateQuizDto: QuizUpdateRequestDto = {
      userId: this.authService.user()!.id,
      quizId: this.quizId!,
      numCorrect: this.numberOfCorrectAnswers,
      quizName: '',
    };

    const sub = this.quizService.updateQuiz(updateQuizDto).subscribe({
      error: (err) => {
        this.messageService.showWarning(
          'Your quiz statistics could not be updated.'
        );
      },
    });

    this.destroyRef.onDestroy(() => {
      sub.unsubscribe();
    });
  }

  getQuizDetails(quizId: string) {
    this.isLoadingQuiz.set(true);
    const sub = this.quizService.getQuizDetails(quizId).subscribe({
      next: (response) => {
        this.quizDetails = response;
        this.numberOfQuestions = this.quizDetails!.questionAnswersList.length;
        this.loadQuestion();
        this.isLoadingQuiz.set(false);
      },
      error: (err) => {
        this.messageService.showError(
          'Something went wrong starting the quiz.'
        );
        this.isLoadingQuiz.set(false);
      },
    });

    this.destroyRef.onDestroy(() => {
      sub.unsubscribe();
    });
  }

  shuffleAnswers(answers: string[]): string[] {
    return answers.sort(() => Math.random() - 0.5);
  }
}
