import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { STUDENT_ROUTES } from './student.routes';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(STUDENT_ROUTES)
  ]
})
export class StudentModule {}
