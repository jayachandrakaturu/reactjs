import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnDestroy, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormControl, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { merge, Observable } from 'rxjs'
import { FaaNotamModel, PartialClosureModel } from '../../models'
import { LookupCacheStore } from '../../store/lookup-cache-store'
@Component({
    standalone: true, selector: 'app-taxiway-location',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatInputModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatIconModule,
        MatCheckboxModule
    ],
    templateUrl: './taxiway-location.component.html'
})
export class TaxiwayLocationComponent implements OnInit, OnDestroy {
    protected taxiwayLocationForm!: FormGroup
    public model = input<FaaNotamModel | null>()
    public partialClosureLocation$!: Observable<PartialClosureModel[]>
    private form!: FormGroup
    private destroyRef = inject(DestroyRef)
    public constructor(
        private readonly formGroupDirective: FormGroupDirective,
        private readonly lookupCacheStore: LookupCacheStore
    ) { }

    public ngOnInit(): void {
        this.form = this.formGroupDirective.form
        this.buildForm()

        this.partialClosureLocation$ = this.lookupCacheStore.partialClosureLocation$

        this.lookupCacheStore.fetchPartialLocations({ keyword: this.form.value?.keyword, location: this.form.value?.location })

        const taxiwayLocation = this.model()?.scenarioData.taxiwayLocation
        this.taxiwayLocationForm.patchValue({
            between: taxiwayLocation?.between,
            and: taxiwayLocation?.and
        })
        this.setupConditionalValidators()
    }

    private setupConditionalValidators(): void {
        const betweenControl = this.taxiwayLocationForm.get('between')
        const andControl = this.taxiwayLocationForm.get('and')
        const updateValidators = ():void => {
            const isRequired = !!betweenControl?.value || !!andControl?.value
            const validator = isRequired ? [Validators.required] : null
            betweenControl?.setValidators(validator)
            andControl?.setValidators(validator)
            betweenControl?.updateValueAndValidity()
            andControl?.updateValueAndValidity()
        }
        if (betweenControl && andControl) {
            merge(betweenControl.valueChanges, andControl.valueChanges)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(updateValidators)
        }
        updateValidators()
    }

    public ngOnDestroy(): void {
        const scenarioData = this.form.get('scenarioData') as FormGroup
        scenarioData.removeControl('taxiwayLocation')
    }

    private buildForm(): void {
        this.taxiwayLocationForm = new FormGroup({
            between: new FormControl(''),
            and: new FormControl('')
        })
        const scenarioData = this.form.get('scenarioData') as FormGroup
        scenarioData.addControl('taxiwayLocation', this.taxiwayLocationForm)
    }
}
