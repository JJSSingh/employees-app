import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Employee, EmployeeInput } from './employee.model';

const API_URL = '/api'; // el proxy lo redirige a http://localhost:8080

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${API_URL}/employees`);
  }

  getById(id: number): Observable<Employee | null> {
    return this.http.get<Employee | null>(`${API_URL}/employee/${id}`);
  }

  create(employee: EmployeeInput): Observable<string> {
    return this.http.post(`${API_URL}/employee`, employee, { responseType: 'text' });
  }

  update(id: number, employee: EmployeeInput): Observable<string> {
    return this.http.post(`${API_URL}/employee/${id}`, employee, { responseType: 'text' });
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${API_URL}/employee/${id}`, { responseType: 'text' });
  }

  getAguinaldo(id: number): Observable<number> {
    return this.http.get<number>(`${API_URL}/employeeAguinaldo/${id}`);
  }

  getVacations(id: number): Observable<number> {
    return this.http.get<number>(`${API_URL}/employeeVacations/${id}`);
  }
}