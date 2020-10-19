import { Component, OnInit } from '@angular/core';
import {faHourglassStart, faHourglassHalf, faHourglassEnd} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-game-hourglass',
  templateUrl: './hourglass.component.html',
  styleUrls: ['./hourglass.component.scss']
})
export class HourglassComponent implements OnInit {
  readonly faHourglassStart = faHourglassStart;
  readonly faHourglassHalf = faHourglassHalf;
  readonly faHourglassEnd = faHourglassEnd;

  constructor() { }

  ngOnInit(): void {
  }

}
