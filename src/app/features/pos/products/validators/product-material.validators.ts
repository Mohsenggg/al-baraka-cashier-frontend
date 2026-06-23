import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

export function positiveQuantityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return { quantityRequired: true };
    }
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return { quantityInvalid: true };
    }
    return null;
  };
}

export function duplicateMaterialValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormArray)) return null;

    const ids = control.controls
      .map(c => c.get('materialId')?.value)
      .filter((id): id is number => id != null);

    const unique = new Set(ids);
    return unique.size !== ids.length ? { duplicateMaterial: true } : null;
  };
}
