// offer-banner.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-offer-banner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './offer-banner.component.html',
  styleUrl: './offer-banner.component.css',
})
export class OfferBannerComponent {}