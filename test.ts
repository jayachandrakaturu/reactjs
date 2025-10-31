import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, input, OnDestroy, OnInit } from '@angular/core'
import { FormControl, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatInputModule } from '@angular/material/input'
import { Subject, takeUntil } from 'rxjs'
import { FaaNotamModel } from '../../models'
@Component({
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-navaid-radio-frequency-channel',
    imports: [
        MatInputModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatCheckboxModule
    ],
    templateUrl: './navaid-radio-frequency-channel.component.html',
    styleUrl: './navaid-radio-frequency-channel.component.scss'
})
export class NavaidRadioFrequencyChannelComponent implements OnInit, OnDestroy {
    protected radioFrequencyChannelForm!: FormGroup
    public model = input<FaaNotamModel | null>()
    private form!: FormGroup
    private destroy$ = new Subject<void>()
    public constructor(
        private readonly formGroupDirective: FormGroupDirective,
    ) { }
    public ngOnInit(): void {
        this.form = this.formGroupDirective.form
        this.buildForm()
        const radioFrequencyChannel = this.model()?.scenarioData.navaidRadioFrequencyChannel
        if (radioFrequencyChannel) {
            this.radioFrequencyChannelForm.patchValue({
                includeFrequency: radioFrequencyChannel.includeFrequency ?? '',
                includeChannel: radioFrequencyChannel.includeChannel ?? '',
                isIncludeFrequency: radioFrequencyChannel.isIncludeFrequency ?? false,
                isIncludeChannel: radioFrequencyChannel.isIncludeChannel ?? false
            })
        }
        this.updateControlStates()
        this.radioFrequencyChannelForm.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.updateControlStates()
            })
    }
    public ngOnDestroy(): void {
        if (this.form) {
            const scenarioData = this.form.get('scenarioData') as FormGroup
            if (scenarioData && scenarioData.get('navaidRadioFrequencyChannel')) {
                scenarioData.removeControl('navaidRadioFrequencyChannel')
            }
        }
        this.destroy$.next()
        this.destroy$.complete()
    }
    private buildForm(): void {
        this.radioFrequencyChannelForm = new FormGroup({
            includeFrequency: new FormControl(''),
            includeChannel: new FormControl(''),
            isIncludeFrequency: new FormControl(false),
            isIncludeChannel: new FormControl(false)
        })
        const scenarioData = this.form.get('scenarioData') as FormGroup
        scenarioData.addControl('navaidRadioFrequencyChannel', this.radioFrequencyChannelForm)
    }
    private updateControlStates(): void {
        const includeFrequencyControl = this.radioFrequencyChannelForm.get('includeFrequency')
        const isIncludeFrequencyControl = this.radioFrequencyChannelForm.get('isIncludeFrequency')
        const includeChannelControl = this.radioFrequencyChannelForm.get('includeChannel')
        const isIncludeChannelControl = this.radioFrequencyChannelForm.get('isIncludeChannel')
        
        if (!includeFrequencyControl || !isIncludeFrequencyControl) {
            return
        }
        
        if (!includeFrequencyControl.value) {
            isIncludeFrequencyControl.disable({ emitEvent: false })
        } else {
            isIncludeFrequencyControl.enable({ emitEvent: false })
        }
        
        if (!includeChannelControl || !isIncludeChannelControl) {
            return
        }
        
        if (!includeChannelControl.value) {
            isIncludeChannelControl.disable({ emitEvent: false })
        } else {
            isIncludeChannelControl.enable({ emitEvent: false })
        }
    }
}
