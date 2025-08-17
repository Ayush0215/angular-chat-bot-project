import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-connected-apps',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './connected-apps.component.html',
  styleUrl: './connected-apps.component.css',
})
export class ConnectedAppsComponent {}
