import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Employee } from './employee.model';
import { EmployeeService } from './employee.service';

@Component({
  selector: 'app-employee-list',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1>Dashboard de empleados</h1>
      <div class="actions">
        <button type="button" class="btn secondary" (click)="calculateAll()" [disabled]="employees().length === 0">
          Calcular aguinaldo y vacaciones de todos
        </button>
        <a routerLink="/employees/new" class="btn primary">+ Nuevo empleado</a>
      </div>
    </div>

    @if (error()) {
      <div class="alert">{{ error() }}</div>
    }

    <section class="cards">
      <div class="card">
        <span class="card-label">Total de empleados</span>
        <span class="card-value">{{ employees().length }}</span>
      </div>
      <div class="card">
        <span class="card-label">Nómina bruta total</span>
        <span class="card-value">{{ totalPayroll() | currency: 'MXN' : 'symbol-narrow' }}</span>
      </div>
      <div class="card">
        <span class="card-label">Salario bruto promedio</span>
        <span class="card-value">{{ averageSalary() | currency: 'MXN' : 'symbol-narrow' }}</span>
      </div>
    </section>

    @if (loading()) {
      <p class="muted">Cargando empleados...</p>
    } @else {
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Primer apellido</th>
              <th>Segundo apellido</th>
              <th>Salario bruto</th>
              <th>Fecha de ingreso</th>
              <th>Aguinaldo</th>
              <th>Vacaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (emp of employees(); track emp.id) {
              <tr>
                <td>{{ emp.id }}</td>
                <td>{{ emp.Name }}</td>
                <td>{{ emp.FirstLastName }}</td>
                <td>{{ emp.SecondLastName }}</td>
                <td>{{ emp.GrossSalary | currency: 'MXN' : 'symbol-narrow' }}</td>
                <td>{{ emp.EntryDate | date: 'dd/MM/yyyy' }}</td>
                <td>
                  @if (aguinaldos()[emp.id] !== undefined) {
                    {{ aguinaldos()[emp.id] | currency: 'MXN' : 'symbol-narrow' }}
                  } @else {
                    <button type="button" class="btn small" (click)="calculateAguinaldo(emp)">Calcular</button>
                  }
                </td>
                <td>
                  @if (vacations()[emp.id] !== undefined) {
                    {{ vacations()[emp.id] }} días
                  } @else {
                    <button type="button" class="btn small" (click)="calculateVacations(emp)">Calcular</button>
                  }
                </td>
                <td class="row-actions">
                  <a [routerLink]="['/employees', emp.id, 'edit']" class="btn small">Editar</a>
                  <button type="button" class="btn small danger" (click)="remove(emp)">Eliminar</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="9" class="muted center">No hay empleados registrados.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class EmployeeList implements OnInit {
  private readonly service = inject(EmployeeService);

  readonly employees = signal<Employee[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly aguinaldos = signal<Record<number, number>>({});
  readonly vacations = signal<Record<number, number>>({});

  readonly totalPayroll = computed(() =>
    this.employees().reduce((sum, e) => sum + (e.GrossSalary ?? 0), 0),
  );

  readonly averageSalary = computed(() => {
    const count = this.employees().length;
    return count === 0 ? 0 : this.totalPayroll() / count;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: (list) => {
        this.employees.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de empleados. Verifica que el backend esté activo.');
        this.loading.set(false);
      },
    });
  }

  calculateAguinaldo(emp: Employee): void {
    this.service.getAguinaldo(emp.id).subscribe({
      next: (value) => this.aguinaldos.update((m) => ({ ...m, [emp.id]: value })),
      error: () => this.error.set(`No se pudo calcular el aguinaldo del empleado ${emp.id}.`),
    });
  }

  calculateVacations(emp: Employee): void {
    this.service.getVacations(emp.id).subscribe({
      next: (value) => this.vacations.update((m) => ({ ...m, [emp.id]: value })),
      error: () => this.error.set(`No se pudieron calcular las vacaciones del empleado ${emp.id}.`),
    });
  }

  calculateAll(): void {
    for (const emp of this.employees()) {
      this.calculateAguinaldo(emp);
      this.calculateVacations(emp);
    }
  }

  remove(emp: Employee): void {
    const confirmed = confirm(`¿Eliminar a ${emp.Name} ${emp.FirstLastName}?`);
    if (!confirmed) {
      return;
    }
    this.service.delete(emp.id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('No se pudo eliminar el empleado.'),
    });
  }
}