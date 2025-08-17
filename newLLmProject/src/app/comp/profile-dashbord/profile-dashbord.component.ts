import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
@Component({
  selector: 'app-profile-dashbord',
  imports: [MatIconModule, RouterLink, RouterOutlet],
  templateUrl: './profile-dashbord.component.html',
  styleUrl: './profile-dashbord.component.css',
})
export class ProfileDashbordComponent {
  @Input() result: any;
  activeRoute: string = '';

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.activeRoute = this.router.url;
    });
  }
  isActive(route: string): boolean {
    return this.activeRoute.includes(route);
  }
}
