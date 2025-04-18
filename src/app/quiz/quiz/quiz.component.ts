import {
  CommonModule,
  DatePipe,
  SlicePipe,
  TitleCasePipe,
} from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { getEnumDisplayName, Quiz } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    DatePipe,
    TitleCasePipe,
    MatButtonModule,
    MatProgressSpinner,
    SlicePipe,
    RouterModule,
  ],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss',
})
export class QuizComponent {
  private destroyRef = inject(DestroyRef);
  private quizService = inject(QuizService);
  private messageService = inject(MessageService);

  getEnumDisplayName = getEnumDisplayName;

  quiz = input.required<Quiz>();
  quizDeleted = output<void>();
  isExpanded = signal(false);
  isDeleting = signal(false);

  onToggleExpansion() {
    this.isExpanded.update((wasExpanded) => !wasExpanded);
  }

  onDeleteQuiz(quiz: Quiz) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this quiz? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting.set(true);
    const sub = this.quizService.deleteQuiz(quiz.quizId).subscribe({
      next: () => {
        this.quizDeleted.emit();
        this.isDeleting.set(false);
      },
      error: () => {
        this.isDeleting.set(false);
        this.messageService.showErrorModal(
          'Error deleting quiz "' + quiz.quizName + '".'
        );
      },
      complete: () =>
        this.messageService.showSuccessModal(
          'Quiz "' + quiz.quizName + '" deleted.'
        ),
    });

    this.destroyRef.onDestroy(() => {
      sub.unsubscribe();
    });
  }

  calculateSuccessRate(): number {
    if (this.quiz().numTries === 0) {
      return 0.0;
    }

    return (
      (100 * this.quiz().numCorrect) /
      (this.quiz().numQuestions * this.quiz().numTries)
    );
  }
}
