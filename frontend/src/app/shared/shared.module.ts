import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LoadingComponent } from './components/loading/loading.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
import { DateFormatPipe } from './pipes/date-format.pipe';
import { CurrencyFormatPipe } from './pipes/currency-format.pipe';
import { AutoFocusDirective } from './directives/auto-focus.directive';

@NgModule({
  imports: [
    CommonModule,
    NavbarComponent,
    SidebarComponent,
    LoadingComponent,
    ConfirmDialogComponent,
    UnauthorizedComponent,
    DateFormatPipe,
    CurrencyFormatPipe,
    AutoFocusDirective
  ],
  exports: [
    NavbarComponent,
    SidebarComponent,
    LoadingComponent,
    ConfirmDialogComponent,
    UnauthorizedComponent,
    DateFormatPipe,
    CurrencyFormatPipe,
    AutoFocusDirective
  ]
})
export class SharedModule {}