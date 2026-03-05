// src/app/components/checkout/checkout-steps/checkout-steps.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';

@Component({
  selector:  'app-checkout-steps',
  standalone: true,
  imports:   [CommonModule],
  template: `
    <div class="step-indicators">
      <div class="step" [class.active]="currentStep === 1" [class.done]="currentStep === 2">
        <span class="step-num">
          <span *ngIf="currentStep < 2">1</span>
          <svg *ngIf="currentStep === 2" width="14" height="14" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="3"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
        <span class="step-label">Shipping Details</span>
      </div>
      <div class="step-line" [class.done]="currentStep === 2"></div>
      <div class="step" [class.active]="currentStep === 2">
        <span class="step-num">2</span>
        <span class="step-label">Payment</span>
      </div>
    </div>
  `,
  styles: [`
    .step-indicators {
      display: flex; align-items: center;
      justify-content: center; gap: 0;
      margin-bottom: 2.5rem;
    }
    .step {
      display: flex; align-items: center; gap: 10px;
      opacity: 0.4; transition: opacity 0.3s;
    }
    .step.active, .step.done { opacity: 1; }
    .step-num {
      width: 34px; height: 34px; border-radius: 50%;
      background: #9A8A8A; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 0.9rem; transition: background 0.3s;
      flex-shrink: 0;
    }
    .step.active .step-num { background: #1C1C1C; }
    .step.done   .step-num { background: #16a34a; }
    .step-label { font-size: 0.9rem; font-weight: 500; color: #1C1C1C; }
    .step-line {
      width: 60px; height: 2px; background: #ddd;
      margin: 0 12px; transition: background 0.3s;
    }
    .step-line.done { background: #16a34a; }
  `]
})
export class CheckoutStepsComponent {
  @Input() currentStep: 1 | 2 = 1;
}