import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number, currencyCode: string = 'USD', display: 'code' | 'symbol' | 'symbol-narrow' = 'symbol'): string | null {
    const currencyPipe = new CurrencyPipe('en-US');
    return currencyPipe.transform(value, currencyCode, display);
  }
}