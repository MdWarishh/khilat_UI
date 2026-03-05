// src/app/admin/dashboard/stats-cards/stats-cards.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { RouterLink }       from '@angular/router';
import { DashboardStats }   from '../dashboard.component';

@Component({
  selector:    'app-dash-stats-cards',
  standalone:  true,
  imports:     [CommonModule, RouterLink],
  templateUrl: './stats-cards.component.html',
  styleUrl:    './stats-cards.component.css',
})
export class DashStatsCardsComponent {
  @Input() stats!: DashboardStats;
}