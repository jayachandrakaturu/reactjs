import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { FaaNotamModel } from '../../models'
import { NavaidRadioFrequencyChannelComponent } from './navaid-radio-frequency-channel.component'

describe('NavaidRadioFrequencyChannelComponent', () => {
    let component: NavaidRadioFrequencyChannelComponent
    let fixture: ComponentFixture<NavaidRadioFrequencyChannelComponent>
    let parentFormGroup: FormGroup
    let formGroupDirectiveStub: FormGroupDirective

    // helpers
    const getScenarioDataForm = (): FormGroup => {
        return parentFormGroup.get('scenarioData') as FormGroup
    }

    const minimalMockData: FaaNotamModel = {
        notamId: 'test-id',
        scenarioData: {
            navaidRadioFrequencyChannel: {
                includeFrequency: '',
                includeChannel: '',
                isIncludeFrequency: false,
                isIncludeChannel: false
            }
        }
    } as unknown as FaaNotamModel

    const mockModelWithData: FaaNotamModel = {
        scenarioData: {
            navaidRadioFrequencyChannel: {
                includeFrequency: '123.45',
                includeChannel: 'CH-1',
                isIncludeFrequency: true,
                isIncludeChannel: true
            }
        }
    } as unknown as FaaNotamModel

    beforeEach(async () => {
        parentFormGroup = new FormGroup({
            scenarioData: new FormGroup({})
        })

        formGroupDirectiveStub = {
            form: parentFormGroup,
            controlContainer: {
                get: (name: string) => parentFormGroup.get(name),
            },
        } as unknown as FormGroupDirective

        await TestBed.configureTestingModule({
            imports: [NavaidRadioFrequencyChannelComponent, ReactiveFormsModule, NoopAnimationsModule],
            providers: [
                { provide: FormGroupDirective, useValue: formGroupDirectiveStub }
            ]
        }).overrideComponent(NavaidRadioFrequencyChannelComponent, { set: { template: '' } }).compileComponents()

        fixture = TestBed.createComponent(NavaidRadioFrequencyChannelComponent)
        component = fixture.componentInstance
        fixture.componentRef.setInput('model', minimalMockData)
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize form and add navaidRadioFrequencyChannel control', () => {
        expect(parentFormGroup.get('scenarioData.navaidRadioFrequencyChannel')).toBeTruthy()
    })

    it('should build form with navaidRadioFrequencyChannel control of type FormGroup', () => {
        const scenarioDataForm = getScenarioDataForm()
        const control = scenarioDataForm.get('navaidRadioFrequencyChannel')
        expect(control).toBeTruthy()
        expect(control).toBeInstanceOf(FormGroup)
    })

    it('should build form with all required controls', () => {
        const scenarioDataForm = getScenarioDataForm()
        const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
        expect(radioFrequencyChannelForm.get('includeFrequency')).toBeTruthy()
        expect(radioFrequencyChannelForm.get('includeChannel')).toBeTruthy()
        expect(radioFrequencyChannelForm.get('isIncludeFrequency')).toBeTruthy()
        expect(radioFrequencyChannelForm.get('isIncludeChannel')).toBeTruthy()
    })

    it('should initialize form controls with default values', () => {
        const scenarioDataForm = getScenarioDataForm()
        const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
        expect(radioFrequencyChannelForm.get('includeFrequency')?.value).toBe('')
        expect(radioFrequencyChannelForm.get('includeChannel')?.value).toBe('')
        expect(radioFrequencyChannelForm.get('isIncludeFrequency')?.value).toBe(false)
        expect(radioFrequencyChannelForm.get('isIncludeChannel')?.value).toBe(false)
    })

    it('should patch form value from model on init when data exists', async () => {
        const testParentForm = new FormGroup({ scenarioData: new FormGroup({}) })
        const testFormGroupDirective = { form: testParentForm } as unknown as FormGroupDirective

        TestBed.resetTestingModule()

        await TestBed.configureTestingModule({
            imports: [NavaidRadioFrequencyChannelComponent, ReactiveFormsModule, NoopAnimationsModule],
            providers: [
                { provide: FormGroupDirective, useValue: testFormGroupDirective }
            ]
        }).overrideComponent(NavaidRadioFrequencyChannelComponent, { set: { template: '' } }).compileComponents()

        const localFixture = TestBed.createComponent(NavaidRadioFrequencyChannelComponent)
        const localComponent = localFixture.componentInstance
        localFixture.componentRef.setInput('model', mockModelWithData)
        localFixture.detectChanges()

        const scenarioDataForm = testParentForm.get('scenarioData') as FormGroup
        const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
        expect(radioFrequencyChannelForm.get('includeFrequency')?.value).toBe('123.45')
        expect(radioFrequencyChannelForm.get('includeChannel')?.value).toBe('CH-1')
        expect(radioFrequencyChannelForm.get('isIncludeFrequency')?.value).toBe(true)
        expect(radioFrequencyChannelForm.get('isIncludeChannel')?.value).toBe(true)
    })

    it('should disable isIncludeFrequency when includeFrequency is empty', () => {
        const scenarioDataForm = getScenarioDataForm()
        const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
        const isIncludeFrequencyControl = radioFrequencyChannelForm.get('isIncludeFrequency')
        expect(isIncludeFrequencyControl?.disabled).toBe(true)
    })

    it('should disable isIncludeChannel when includeChannel is empty', () => {
        const scenarioDataForm = getScenarioDataForm()
        const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
        const isIncludeChannelControl = radioFrequencyChannelForm.get('isIncludeChannel')
        expect(isIncludeChannelControl?.disabled).toBe(true)
    })

    it('should enable isIncludeFrequency when includeFrequency has value', () => {
        const scenarioDataForm = getScenarioDataForm()
        const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
        const includeFrequencyControl = radioFrequencyChannelForm.get('includeFrequency')
        const isIncludeFrequencyControl = radioFrequencyChannelForm.get('isIncludeFrequency')
        
        includeFrequencyControl?.setValue('123.45')
        expect(isIncludeFrequencyControl?.enabled).toBe(true)
    })

    it('should enable isIncludeChannel when includeChannel has value', () => {
        const scenarioDataForm = getScenarioDataForm()
        const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
        const includeChannelControl = radioFrequencyChannelForm.get('includeChannel')
        const isIncludeChannelControl = radioFrequencyChannelForm.get('isIncludeChannel')
        
        includeChannelControl?.setValue('CH-1')
        expect(isIncludeChannelControl?.enabled).toBe(true)
    })

    it('should disable isIncludeFrequency when includeFrequency is cleared', () => {
        const scenarioDataForm = getScenarioDataForm()
        const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
        const includeFrequencyControl = radioFrequencyChannelForm.get('includeFrequency')
        const isIncludeFrequencyControl = radioFrequencyChannelForm.get('isIncludeFrequency')
        
        includeFrequencyControl?.setValue('123.45')
        expect(isIncludeFrequencyControl?.enabled).toBe(true)
        
        includeFrequencyControl?.setValue('')
        expect(isIncludeFrequencyControl?.disabled).toBe(true)
    })

    it('should disable isIncludeChannel when includeChannel is cleared', () => {
        const scenarioDataForm = getScenarioDataForm()
        const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
        const includeChannelControl = radioFrequencyChannelForm.get('includeChannel')
        const isIncludeChannelControl = radioFrequencyChannelForm.get('isIncludeChannel')
        
        includeChannelControl?.setValue('CH-1')
        expect(isIncludeChannelControl?.enabled).toBe(true)
        
        includeChannelControl?.setValue('')
        expect(isIncludeChannelControl?.disabled).toBe(true)
    })

    it('should call updateControlStates on valueChanges', (done) => {
        const scenarioDataForm = getScenarioDataForm()
        const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
        const includeFrequencyControl = radioFrequencyChannelForm.get('includeFrequency')
        const isIncludeFrequencyControl = radioFrequencyChannelForm.get('isIncludeFrequency')
        
        expect(isIncludeFrequencyControl?.disabled).toBe(true)
        
        includeFrequencyControl?.setValue('123.45')
        
        // Allow time for valueChanges subscription to process
        setTimeout(() => {
            expect(isIncludeFrequencyControl?.enabled).toBe(true)
            done()
        }, 10)
    })

    it('should remove the form control on destroy', () => {
        expect(parentFormGroup.get('scenarioData.navaidRadioFrequencyChannel')).toBeTruthy()
        fixture.destroy()
        expect(parentFormGroup.get('scenarioData.navaidRadioFrequencyChannel')).toBeFalsy()
    })

    describe('Edge Cases', () => {
        it('should handle null model input gracefully', () => {
            fixture = TestBed.createComponent(NavaidRadioFrequencyChannelComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', null)
            fixture.detectChanges()
            // patchValue with undefined should overwrite initial value
            const scenarioDataForm = getScenarioDataForm()
            const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
            expect(radioFrequencyChannelForm).toBeTruthy()
        })

        it('should handle model with null scenarioData by throwing on detectChanges', () => {
            const modelWithNullScenarioData = { scenarioData: null } as unknown as FaaNotamModel
            fixture = TestBed.createComponent(NavaidRadioFrequencyChannelComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', modelWithNullScenarioData)
            expect(() => fixture.detectChanges()).toThrow()
        })

        it('should handle model with null navaidRadioFrequencyChannel', async () => {
            const modelWithNull = {
                scenarioData: { navaidRadioFrequencyChannel: null }
            } as unknown as FaaNotamModel
            TestBed.resetTestingModule()
            await TestBed.configureTestingModule({
                imports: [NavaidRadioFrequencyChannelComponent, ReactiveFormsModule, NoopAnimationsModule],
                providers: [
                    { provide: FormGroupDirective, useValue: formGroupDirectiveStub }
                ]
            }).overrideComponent(NavaidRadioFrequencyChannelComponent, { set: { template: '' } }).compileComponents()

            fixture = TestBed.createComponent(NavaidRadioFrequencyChannelComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', modelWithNull)
            fixture.detectChanges()

            const scenarioDataForm = getScenarioDataForm()
            const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
            expect(radioFrequencyChannelForm).toBeTruthy()
            expect(radioFrequencyChannelForm.get('includeFrequency')?.value).toBe('')
        })

        it('should handle model with undefined navaidRadioFrequencyChannel', async () => {
            const modelWithUndefined = {
                scenarioData: { navaidRadioFrequencyChannel: undefined }
            } as unknown as FaaNotamModel
            TestBed.resetTestingModule()
            await TestBed.configureTestingModule({
                imports: [NavaidRadioFrequencyChannelComponent, ReactiveFormsModule, NoopAnimationsModule],
                providers: [
                    { provide: FormGroupDirective, useValue: formGroupDirectiveStub }
                ]
            }).overrideComponent(NavaidRadioFrequencyChannelComponent, { set: { template: '' } }).compileComponents()

            fixture = TestBed.createComponent(NavaidRadioFrequencyChannelComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', modelWithUndefined)
            fixture.detectChanges()

            const scenarioDataForm = getScenarioDataForm()
            const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
            expect(radioFrequencyChannelForm).toBeTruthy()
            expect(radioFrequencyChannelForm.get('includeFrequency')?.value).toBe('')
        })

        it('should handle ngOnInit when FormGroupDirective.form is null', async () => {
            const invalidFormGroupDirective = { form: null } as unknown as FormGroupDirective
            TestBed.resetTestingModule()
            await TestBed.configureTestingModule({
                imports: [NavaidRadioFrequencyChannelComponent, ReactiveFormsModule, NoopAnimationsModule],
                providers: [
                    { provide: FormGroupDirective, useValue: invalidFormGroupDirective }
                ]
            }).overrideComponent(NavaidRadioFrequencyChannelComponent, { set: { template: '' } }).compileComponents()

            const localFixture = TestBed.createComponent(NavaidRadioFrequencyChannelComponent)
            expect(() => localFixture.detectChanges()).toThrow()
        })

        it('should handle ngOnDestroy when control does not exist', async () => {
            const formWithoutControl = new FormGroup({ scenarioData: new FormGroup({}) })
            const fgDirective = { form: formWithoutControl } as unknown as FormGroupDirective
            TestBed.resetTestingModule()
            await TestBed.configureTestingModule({
                imports: [NavaidRadioFrequencyChannelComponent, ReactiveFormsModule, NoopAnimationsModule],
                providers: [
                    { provide: FormGroupDirective, useValue: fgDirective }
                ]
            }).overrideComponent(NavaidRadioFrequencyChannelComponent, { set: { template: '' } }).compileComponents()

            const localFixture = TestBed.createComponent(NavaidRadioFrequencyChannelComponent)
            localFixture.detectChanges()
            expect(() => localFixture.destroy()).not.toThrow()
        })

        it('should handle partial data in navaidRadioFrequencyChannel', async () => {
            const modelWithPartialData: FaaNotamModel = {
                scenarioData: {
                    navaidRadioFrequencyChannel: {
                        includeFrequency: '123.45',
                        includeChannel: undefined,
                        isIncludeFrequency: undefined,
                        isIncludeChannel: false
                    }
                }
            } as unknown as FaaNotamModel

            TestBed.resetTestingModule()
            await TestBed.configureTestingModule({
                imports: [NavaidRadioFrequencyChannelComponent, ReactiveFormsModule, NoopAnimationsModule],
                providers: [
                    { provide: FormGroupDirective, useValue: formGroupDirectiveStub }
                ]
            }).overrideComponent(NavaidRadioFrequencyChannelComponent, { set: { template: '' } }).compileComponents()

            const localFixture = TestBed.createComponent(NavaidRadioFrequencyChannelComponent)
            localFixture.componentRef.setInput('model', modelWithPartialData)
            localFixture.detectChanges()

            const scenarioDataForm = getScenarioDataForm()
            const radioFrequencyChannelForm = scenarioDataForm.get('navaidRadioFrequencyChannel') as FormGroup
            expect(radioFrequencyChannelForm.get('includeFrequency')?.value).toBe('123.45')
            expect(radioFrequencyChannelForm.get('includeChannel')?.value).toBe('')
        })
    })
})

