import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customTime',
  standalone: true,
})

export class TimerPipe implements PipeTransform {

  transform(ms: number): string {
    if (ms < 0) return '0 : 00 : 00';

    let hours = Math.floor(ms / (1000 * 60 * 60));
    let minutes = new String(Math.floor(((ms / 1000) / 60) % 60));
    let seconds = new String(Math.floor((ms % (1000 * 60)) / 1000));
    if (Number(seconds) < 10) seconds = '0' + seconds;
    if (Number(minutes) < 10) minutes = '0' + minutes;

    return hours + ' : ' + minutes + " : " + seconds;
  }

}