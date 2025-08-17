import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, EventEmitter } from '@angular/core';
import {
  FormGroup,
  FormsModule,
  Validators,
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { GroqLlmService, ModelConfig } from '../../../service/groq-llm.service';
import { config, interval, Subscription, switchMap } from 'rxjs';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlider, MatSliderModule } from '@angular/material/slider';
import { GlobalMessageComponent } from '../../global-message/global-message.component';
import { SharedService } from '../../../service/shared.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-setting-ai-model',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatFormField,
    MatOption,
    MatDialogModule,
    MatSelectModule,
    MatOption,
    MatInputModule,
    MatSliderModule,
    MatButtonModule,
    GlobalMessageComponent,
    MatSliderModule,
    MatSlider,
  ],
  templateUrl: './setting-ai-model.component.html',
  styleUrl: './setting-ai-model.component.css',
})
export class SettingAIModelComponent implements OnInit, OnDestroy {
  modelForm!: FormGroup;
  isLoading = false;
  currentConfig!: ModelConfig | null;
  private configSubscription!: Subscription;
  private autoRefreshInterval = 5000;
  selectedModelName: string = '';
  userMessage: string = '';
  lastUserMessage: string = '';
  modelConfigUpdated: EventEmitter<any> = new EventEmitter();

  modelConfig = {
    model_name: '',
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 0.96,
    status: 'active',
  };

  availableModels = [
    'deepseek-r1-distill-llama-70b',
    'deepseek-r1-distill-qwen-32b',
    'qwen-2.5-32b',
    'qwen-2.5-coder-32b',
    'gemma2-9b-it',
    'mixtral-8x7b-32768',
    'llama-3.1-8b-instant',
    'llama-3.2-11b-vision-preview',
    'llama-3.2-1b-preview',
    'llama-3.2-3b-preview',
    'llama-3.2-90b-vision-preview',
    'llama-3.3-70b-specdec',
    'llama-3.3-70b-versatile',
    'llama3-70b-8192',
    'llama3-8b-8192',
  ];

  constructor(
    private fb: FormBuilder,
    private llmService: GroqLlmService,
    private sharedService: SharedService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // this.modelForm = this.fb.group({
    //   model_name: ['', Validators.required],
    //   temperature: [
    //     0.7,
    //     [Validators.required, Validators.min(0), Validators.max(1)],
    //   ],
    //   max_tokens: [2048, [Validators.required, Validators.min(1)]],
    //   top_p: [0.9, [Validators.required, Validators.min(0), Validators.max(1)]],
    //   status: ['active', Validators.required],
    // });

    // // Load existing configuration
    // this.loadModelConfig();
    // this.configSubscription = interval(this.autoRefreshInterval)
    //   .pipe(switchMap(() => this.llmService.getModelConfig()))
    //   .subscribe(
    //     (config) => {
    //       this.currentConfig = config;
    //       this.modelForm.patchValue(config);
    //     },
    //     (error) => console.error('Failed to refresh model config', error)
    //   );
    // this.llmService.modelConfig$.subscribe((config) => {
    //   if (config && config.model_name) {
    //     this.modelConfig.model_name = config.model_name; // Load last saved model
    //   }
    // });
    // this.initializeForm();
    this.loadModelConfig();

    this.llmService.modelConfig$.subscribe((config) => {
      if (config) {
        this.modelConfig = { ...config };
        this.modelForm.patchValue(config);
      }
    });
  }

  /**
   * Load the model configuration from the backend
   */
  loadModelConfig(): void {
    this.isLoading = true;
    this.llmService.getModelConfig().subscribe(
      (config: ModelConfig) => {
        if (config) {
          this.modelConfig = { ...config };
          this.modelForm.patchValue(config);
        }
        this.isLoading = false;
      },
      (error) => {
        console.error('Failed to load model config', error);
        this.isLoading = false;
      }
    );
  }
  // loadModelConfig(): void {
  //   this.isLoading = true;
  //   this.llmService.getModelConfig().subscribe(
  //     (config: ModelConfig) => {
  //       if (config) {
  //         this.currentConfig = config; // Store the last saved config
  //         this.modelForm.patchValue(config); // Update UI with saved values
  //       }
  //       this.isLoading = false;
  //     },
  //     (error) => {
  //       console.error('Failed to load model config', error);
  //       this.isLoading = false;
  //     }
  //   );
  // }

  /**
   * Update the model configuration via API
   */
  updateConfig(): void {
    if (this.modelForm.invalid) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    this.isLoading = true;
    const updatedConfig: Partial<ModelConfig> = this.modelForm.value;

    console.log('Updating with payload:', updatedConfig); // Debugging: check what is being sent

    this.llmService.updateModelConfig(updatedConfig).subscribe({
      next: (response) => {
        console.log('Model updated successfully:', response);
        this.currentConfig = response; // Store last saved data
        this.modelForm.patchValue(response); // Update UI with the new values
        alert('Model configuration updated successfully!');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Update failed', error);
        alert('Failed to update model configuration.');
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.configSubscription) {
      this.configSubscription.unsubscribe(); // Cleanup interval on component destroy
    }
  }
  // saveConfig() {
  //   if (!this.modelConfig) {
  //     console.warn('⚠ Cannot save because modelConfig is null!');
  //     return;
  //   }
  //   this.sharedService.setMessage('Model Setting saved!');

  //   this.llmService.updateModelConfig(this.modelConfig).subscribe(
  //     () => {
  //       this.router.navigate(['/home']); // Navigate after saving
  //     },
  //     (error) => {
  //       console.error('Error saving model config:', error);
  //     }
  //   );
  // }
  saveConfig() {
    this.llmService.updateModelConfig(this.modelConfig).subscribe({
      next: (response) => {
        console.log('Model configuration updated:', response);

        // Emit event so components get updated model details
        this.modelConfigUpdated.emit(this.modelConfig);

        // Prevent `sendMessage()` from running automatically
        this.lastUserMessage = this.userMessage; // Store last user message
        this.userMessage = ''; // Clear input to prevent accidental sends

        this.sharedService.setMessage('Model Setting saved!');
      },
      error: (error) => {
        console.error('Error updating model configuration:', error);
        alert('Failed to update model configuration.');
      },
    });
  }

  selectModel(model: string) {
    this.selectedModelName = model;
  }
  validateTemperature() {
    if (this.modelConfig.temperature < 0) {
      this.modelConfig.temperature = 0;
    } else if (this.modelConfig.temperature > 2) {
      this.modelConfig.temperature = 2;
    }
  }

  validateTokens() {
    if (this.modelConfig.max_tokens < 1) {
      this.modelConfig.max_tokens = 1;
    } else if (this.modelConfig.max_tokens > 131072) {
      this.modelConfig.max_tokens = 131072;
    }
  }

  validateTopP() {
    if (this.modelConfig.top_p < 0) {
      this.modelConfig.top_p = 0;
    } else if (this.modelConfig.top_p > 1) {
      this.modelConfig.top_p = 1;
    }
  }
}
