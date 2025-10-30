import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of, Subject } from 'rxjs'
import { FaaNotamModel, KeyValueModel } from '../../models'
import { NavaidServiceTypeComponent } from './navaid-service-type.component'
import { LookupCacheStore } from '../../store/lookup-cache-store'

describe('NavaidServiceTypeComponent', () => {
    let component: NavaidServiceTypeComponent
    let fixture: ComponentFixture<NavaidServiceTypeComponent>
    let parentFormGroup: FormGroup
    let formGroupDirectiveStub: FormGroupDirective

    // helpers
    const getScenarioDataForm = (): FormGroup => {
        return parentFormGroup.get('scenarioData') as FormGroup
    }

    // mock store
    class LookupCacheStoreMock {
        public serviceType$ = of<KeyValueModel[]>([
            { key: 'A', value: 'Alpha' } as unknown as KeyValueModel,
            { key: 'B', value: 'Bravo' } as unknown as KeyValueModel
        ])
        public fetchServiceTypes = jasmine.createSpy('fetchServiceTypes')
    }

    const minimalMockData: FaaNotamModel = {
        notamId: 'test-id',
        scenarioData: { navaidServiceType: '' }
    } as unknown as FaaNotamModel

    const mockModelWithData: FaaNotamModel = {
        scenarioData: {
            navaidServiceType: 'B'
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
            imports: [NavaidServiceTypeComponent, ReactiveFormsModule, NoopAnimationsModule],
            providers: [
                { provide: FormGroupDirective, useValue: formGroupDirectiveStub },
                { provide: LookupCacheStore, useClass: LookupCacheStoreMock }
            ]
        }).compileComponents()

        fixture = TestBed.createComponent(NavaidServiceTypeComponent)
        component = fixture.componentInstance
        fixture.componentRef.setInput('model', minimalMockData)
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize form and add navaidServiceType control', () => {
        expect(parentFormGroup.get('scenarioData.navaidServiceType')).toBeTruthy()
    })

    it('should build form with navaidServiceType control of type FormControl', () => {
        const scenarioDataForm = getScenarioDataForm()
        const control = scenarioDataForm.get('navaidServiceType')
        expect(control).toBeTruthy()
        expect(control).toBeInstanceOf(FormControl)
    })

    it('should patch form value from model on init when data exists', async () => {
        const testParentForm = new FormGroup({ scenarioData: new FormGroup({}) })
        const testFormGroupDirective = { form: testParentForm } as unknown as FormGroupDirective

        TestBed.resetTestingModule()

        await TestBed.configureTestingModule({
            imports: [NavaidServiceTypeComponent, ReactiveFormsModule, NoopAnimationsModule],
            providers: [
                { provide: FormGroupDirective, useValue: testFormGroupDirective },
                { provide: LookupCacheStore, useClass: LookupCacheStoreMock }
            ]
        }).compileComponents()

        const localFixture = TestBed.createComponent(NavaidServiceTypeComponent)
        const localComponent = localFixture.componentInstance
        localFixture.componentRef.setInput('model', mockModelWithData)
        localFixture.detectChanges()

        const scenarioDataForm = testParentForm.get('scenarioData') as FormGroup
        expect(scenarioDataForm.get('navaidServiceType')?.value).toBe('B')
    })

    it('should wire serviceType$ and call fetchServiceTypes on init', () => {
        // Recreate with spies for service stream and fetch method
        const serviceTypes$ = new Subject<KeyValueModel[]>()
        const lookupMock = {
            serviceType$: serviceTypes$.asObservable(),
            fetchServiceTypes: jasmine.createSpy('fetchServiceTypes')
        }

        const testParentForm = new FormGroup({ scenarioData: new FormGroup({}) })
        const testFormGroupDirective = { form: testParentForm } as unknown as FormGroupDirective

        TestBed.resetTestingModule()
        TestBed.configureTestingModule({
            imports: [NavaidServiceTypeComponent, ReactiveFormsModule, NoopAnimationsModule],
            providers: [
                { provide: FormGroupDirective, useValue: testFormGroupDirective },
                { provide: LookupCacheStore, useValue: lookupMock }
            ]
        }).compileComponents()

        const localFixture = TestBed.createComponent(NavaidServiceTypeComponent)
        const localComponent = localFixture.componentInstance
        localFixture.detectChanges()

        expect(lookupMock.fetchServiceTypes).toHaveBeenCalled()

        let emitted: KeyValueModel[] | undefined
        const sub = (localComponent as any).serviceType$.subscribe(v => emitted = v)
        serviceTypes$.next([{ key: 'X', value: 'X-ray' } as unknown as KeyValueModel])
        expect(emitted).toEqual([{ key: 'X', value: 'X-ray' } as unknown as KeyValueModel])
        sub.unsubscribe()
    })

    it('should remove the form control on destroy', () => {
        expect(parentFormGroup.get('scenarioData.navaidServiceType')).toBeTruthy()
        fixture.destroy()
        expect(parentFormGroup.get('scenarioData.navaidServiceType')).toBeFalsy()
    })

    describe('Edge Cases', () => {
        it('should handle null model input gracefully', () => {
            fixture = TestBed.createComponent(NavaidServiceTypeComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', null)
            fixture.detectChanges()
            // patchValue with undefined should overwrite initial value
            expect(getScenarioDataForm().get('navaidServiceType')?.value).toBeUndefined()
        })

        it('should handle model with null scenarioData by throwing on detectChanges', () => {
            const modelWithNullScenarioData = { scenarioData: null } as unknown as FaaNotamModel
            fixture = TestBed.createComponent(NavaidServiceTypeComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', modelWithNullScenarioData)
            expect(() => fixture.detectChanges()).toThrow()
        })

        it('should handle model with null navaidServiceType', async () => {
            const modelWithNull = { scenarioData: { navaidServiceType: null } } as unknown as FaaNotamModel
            TestBed.resetTestingModule()
            await TestBed.configureTestingModule({
                imports: [NavaidServiceTypeComponent, ReactiveFormsModule, NoopAnimationsModule],
                providers: [
                    { provide: FormGroupDirective, useValue: formGroupDirectiveStub },
                    { provide: LookupCacheStore, useClass: LookupCacheStoreMock }
                ]
            }).compileComponents()

            fixture = TestBed.createComponent(NavaidServiceTypeComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', modelWithNull)
            fixture.detectChanges()

            expect(getScenarioDataForm().get('navaidServiceType')?.value).toBeNull()
        })

        it('should handle model with undefined navaidServiceType', async () => {
            const modelWithUndefined = { scenarioData: { navaidServiceType: undefined } } as unknown as FaaNotamModel
            TestBed.resetTestingModule()
            await TestBed.configureTestingModule({
                imports: [NavaidServiceTypeComponent, ReactiveFormsModule, NoopAnimationsModule],
                providers: [
                    { provide: FormGroupDirective, useValue: formGroupDirectiveStub },
                    { provide: LookupCacheStore, useClass: LookupCacheStoreMock }
                ]
            }).compileComponents()

            fixture = TestBed.createComponent(NavaidServiceTypeComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', modelWithUndefined)
            fixture.detectChanges()

            expect(getScenarioDataForm().get('navaidServiceType')?.value).toBeUndefined()
        })

        it('should handle ngOnInit when FormGroupDirective.form is null', async () => {
            const invalidFormGroupDirective = { form: null } as unknown as FormGroupDirective
            TestBed.resetTestingModule()
            await TestBed.configureTestingModule({
                imports: [NavaidServiceTypeComponent, ReactiveFormsModule, NoopAnimationsModule],
                providers: [
                    { provide: FormGroupDirective, useValue: invalidFormGroupDirective },
                    { provide: LookupCacheStore, useClass: LookupCacheStoreMock }
                ]
            }).compileComponents()

            const localFixture = TestBed.createComponent(NavaidServiceTypeComponent)
            expect(() => localFixture.detectChanges()).toThrow()
            expect(() => localFixture.destroy()).toThrow()
        })

        it('should handle ngOnDestroy when control does not exist', async () => {
            const formWithoutControl = new FormGroup({ scenarioData: new FormGroup({}) })
            const fgDirective = { form: formWithoutControl } as unknown as FormGroupDirective
            TestBed.resetTestingModule()
            await TestBed.configureTestingModule({
                imports: [NavaidServiceTypeComponent, ReactiveFormsModule, NoopAnimationsModule],
                providers: [
                    { provide: FormGroupDirective, useValue: fgDirective },
                    { provide: LookupCacheStore, useClass: LookupCacheStoreMock }
                ]
            }).compileComponents()

            const localFixture = TestBed.createComponent(NavaidServiceTypeComponent)
            localFixture.detectChanges()
            expect(() => localFixture.destroy()).not.toThrow()
        })
    })
})


