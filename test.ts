import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, input, OnDestroy, OnInit } from '@angular/core'
import { FormControl, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { Observable } from 'rxjs'
import { FaaNotamModel, KeyValueModel } from '../../models'
import { LookupCacheStore } from '../../store/lookup-cache-store'
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-operational-status',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './operational-status.component.html',
})
export class OperationalStatusComponent implements OnInit, OnDestroy {
  protected operationalStatusForm!: FormGroup
  public model = input<FaaNotamModel | null>()
  public operationalStatus$!: Observable<KeyValueModel[]>
  private form!: FormGroup
  public constructor(
    private readonly formGroupDirective: FormGroupDirective,
    private readonly lookupCacheStore: LookupCacheStore
  ) { }
  public ngOnInit(): void {
    this.form = this.formGroupDirective.form
    this.buildForm()
    this.operationalStatus$ = this.lookupCacheStore.navaidStatusType$
    
    // Only patch if the form and control exist
    if (this.operationalStatusForm && this.operationalStatusForm.get('operationalStatus')) {
      this.operationalStatusForm.patchValue({
        operationalStatus: this.model()?.scenarioData?.equipmentStatus || ''
      })
    }
    
    this.lookupCacheStore.fetchNavaidStatusType()
  }
  public ngOnDestroy(): void {
    if (this.operationalStatusForm && this.operationalStatusForm.get('operationalStatus')) {
      this.operationalStatusForm.removeControl('operationalStatus')
    }
  }
  private buildForm(): void {
    this.operationalStatusForm = this.form.get('scenarioData') as FormGroup
    
    if (this.operationalStatusForm) {
      // Only add the control if it doesn't already exist
      if (!this.operationalStatusForm.get('operationalStatus')) {
        this.operationalStatusForm.addControl('operationalStatus', new FormControl('', { validators: Validators.required }))
      }
    }
  }
}
