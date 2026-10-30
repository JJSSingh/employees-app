export interface EmployeeInput {
  Name: string;
  FirstLastName: string;
  SecondLastName: string;
  GrossSalary: number;
  EntryDate: string; // formato yyyy-MM-dd
}

export interface Employee extends EmployeeInput {
  id: number;
}