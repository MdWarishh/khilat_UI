// hero.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {
  @Input() heroVisible = false;
  @Input() heroSlide   = 0;
  @Input() heroSlides: { image: string; tag: string; title: string }[] = [];
  @Output() setSlide   = new EventEmitter<number>();
}