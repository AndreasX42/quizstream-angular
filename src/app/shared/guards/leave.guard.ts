import { CanDeactivateFn } from '@angular/router';
import { FormGroup } from '@angular/forms';

interface FormComponent {
  form: FormGroup;
}

interface SolveComponent {
  isCompleted(): boolean;
}

export const canLeaveEditPage: CanDeactivateFn<FormComponent> = (component) => {
  if (component.form.touched && component.form.invalid) {
    return window.confirm('Do you really want to leave?');
  }
  return true;
};

export const canLeaveSolvePage: CanDeactivateFn<SolveComponent> = (
  component
) => {
  if (component.isCompleted()) {
    return true;
  }

  return window.confirm(
    'Do you really want to leave? Any progress will not be saved.'
  );
};
