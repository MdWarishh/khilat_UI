// why-us.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-why-us',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './why-us.component.html',
  styleUrl: './why-us.component.css',
})
export class WhyUsComponent {
  @Input() visible = false;

  features: { title: string; desc: string; svg: SafeHtml }[] = [];

  constructor(private sanitizer: DomSanitizer) {
    // Constructor ke andar initialize karo — sanitizer yahan available hai
    this.features = [
      {
        title: 'Authentic Craftsmanship',
        desc:  'Every kurti is handcrafted by skilled artisans using traditional techniques passed down through generations.',
        svg: this.safe(`<path d="M20 6L9 17l-5-5"/>`),
      },
      {
        title: 'Free Delivery',
        desc:  'Enjoy free shipping on all orders above ₹999. Pan India delivery with real-time tracking.',
        svg: this.safe(`
          <rect x="1" y="3" width="15" height="13" rx="1"/>
          <path d="M16 8h4l3 5v3h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        `),
      },
      {
        title: 'Easy Returns',
        desc:  'Hassle-free 7-day return policy. No questions asked — your satisfaction is our priority.',
        svg: this.safe(`
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        `),
      },
      {
        title: 'Secure Payments',
        desc:  '100% secure checkout with SSL encryption. All major cards, UPI, and net banking supported.',
        svg: this.safe(`
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        `),
      },
    ];
  }

  private safe(svgPath: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svgPath);
  }
}