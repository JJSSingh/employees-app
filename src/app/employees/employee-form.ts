import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EmployeeService } from './employee.service';

type FieldName = 'Name' | 'FirstLastName' | 'SecondLastName' | 'GrossSalary' | 'EntryDate';

@Component({
  selector: 'app-employee-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1>{{ employeeId === null ? 'Nuevo empleado' : 'Editar empleado #' + employeeId }}</h1>
    </div>

    @if (error()) {
      <div class="alert">{{ error() }}</div>
    }

    <form class="form" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <div class="field">
        <label for="Name">Nombre</label>
        <input id="Name" type="text" formControlName="Name" />
        @if (isInvalid('Name')) {
          <small class="error">El nombre es obligatorio.</small>
        }
      </div>

      <div class="field">
        <label for="FirstLastName">Primer apellido</label>
        <input id="FirstLastName" type="text" formControlName="FirstLastName" />
        @if (isInvalid('FirstLastName')) {
          <small class="error">El primer apellido es obligatorio.</small>
        }
      </div>

      <div class="field">
        <label for="SecondLastName">Segundo apellido</label>
        <input id="SecondLastName" type="text" formControlName="SecondLastName" />
      </div>

      <div class="field">
        <label for="GrossSalary">Salario bruto</label>
        <input id="GrossSalary" type="number" step="0.01" min="0" formControlName="GrossSalary" />
        @if (isInvalid('GrossSalary')) {
          <small class="error">Ingresa un salario mayor a 0.</small>
        }
      </div>

      <div class="field">
        <label for="EntryDate">Fecha de ingreso</label>
        <input id="EntryDate" type="date" formControlName="EntryDate" />
        @if (isInvalid('EntryDate')) {
          <small class="error">La fecha de ingreso es obligatoria.</small>
        }
      </div>

      <div class="form-actions">
        <a routerLink="/employees" class="btn secondary">Cancelar</a>
        <button type="submit" class="btn primary" [disabled]="saving()">
          {{ saving() ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </form>
  `,
})
export class EmployeeForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly employeeId: number | null = this.parseId(this.route.snapshot.paramMap.get('id'));

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    Name: ['', [Validators.required, Validators.maxLength(100)]],
    FirstLastName: ['', [Validators.required, Validators.maxLength(100)]],
    SecondLastName: ['', [Validators.maxLength(100)]],
    GrossSalary: [0, [Validators.required, Validators.min(0.01)]],
    EntryDate: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (this.employeeId === null) {
      return;
    }
    this.service.getById(this.employeeId).subscribe({
      next: (emp) => {
        if (!emp) {
          this.error.set('El empleado no existe.');
          return;
        }
        this.form.patchValue({
          Name: emp.Name ?? '',
          FirstLastName: emp.FirstLastName ?? '',
          SecondLastName: emp.SecondLastName ?? '',
          GrossSalary: emp.GrossSalary ?? 0,
          EntryDate: (emp.EntryDate ?? '').slice(0, 10),
        });
      },
      error: () => this.error.set('No se pudo cargar el empleado.'),
    });
  }

  isInvalid(field: FieldName): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const value = this.form.getRawValue();
    const request$ =
      this.employeeId === null
        ? this.service.create(value)
        : this.service.update(this.employeeId, value);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/employees']);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('No se pudo guardar el empleado.');
      },
    });
  }

  private parseId(raw: string | null): number | null {
    if (raw === null) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }
}