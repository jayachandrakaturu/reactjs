import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, input, OnDestroy, OnInit } from '@angular/core'
import { FormControl, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { Observable } from 'rxjs'
import { AIXM_TYPES } from '../misc/constants'
import { AixmLookupModel, FaaNotamModel } from '../models'
import { LookupCacheStore } from '../store/lookup-cache-store'
@Component({
    standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-navaid-502-service-type',
    imports: [
        MatInputModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatIconModule
    ],
    templateUrl: './navaid-502-service-type.component.html',
})
export class Navaid502ServiceTypeComponent implements OnInit, OnDestroy {
    protected scenarioDataForm!: FormGroup
    public model = input<FaaNotamModel | null>()
    public serviceType$!: Observable<AixmLookupModel[]>
    private form!: FormGroup
    public constructor(
        private readonly formGroupDirective: FormGroupDirective,
        private lookupCacheStore: LookupCacheStore
    ) { }
    public ngOnInit(): void {
        this.form = this.formGroupDirective.form
        this.buildForm()
        this.lookupCacheStore.fetchAixmKeyLookup(AIXM_TYPES.CONDITION_DEPTH)
        this.serviceType$ = this.lookupCacheStore.getAixmKeyLookup(AIXM_TYPES.CONDITION_DEPTH)
        this.scenarioDataForm?.patchValue({
            navaidServiceType: this.model()?.scenarioData?.navaidServiceType
        })
    }
    public ngOnDestroy(): void {
        this.scenarioDataForm?.removeControl('navaidServiceType')
    }
    private buildForm(): void {
        this.scenarioDataForm = this.form.get('scenarioData') as FormGroup
        this.scenarioDataForm?.addControl('navaidServiceType', new FormControl(''))
    }
}
