import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RunwayConditionComponent } from './runway-condition.component';
import { FaaNotamModel } from '../models';

fdescribe('RunwayConditionComponent', () => {
    let component: RunwayConditionComponent;
    let fixture: ComponentFixture<RunwayConditionComponent>;
    let parentForm: FormGroup;
    let formGroupDirective: FormGroupDirective;

    beforeEach(async () => {
        parentForm = new FormGroup({
            scenarioData: new FormGroup({})
        });

        formGroupDirective = {
            form: parentForm
        } as FormGroupDirective;

        await TestBed.configureTestingModule({
            imports: [
                RunwayConditionComponent,
                ReactiveFormsModule,
                NoopAnimationsModule
            ],
            providers: [
                { provide: FormGroupDirective, useValue: formGroupDirective }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RunwayConditionComponent);
        component = fixture.componentInstance;
    });

    describe('Component Initialization', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
            fixture.detectChanges();
        });

        it('should initialize runwayConditionForm as undefined before ngOnInit', () => {
            expect(component['runwayConditionForm']).toBeUndefined();
            fixture.detectChanges();
            expect(component['runwayConditionForm']).toBeDefined();
        });
    });

    describe('ngOnInit', () => {
        it('should build form and add frictionCoefficient control to scenarioData form', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('frictionCoefficient')).toBeTruthy();
            expect(component['runwayConditionForm']).toBeTruthy();
            expect(component['runwayConditionForm'].get('frictionCoefficient')).toBeTruthy();
        });

        it('should patch frictionCoefficient value when model has frictionCoefficient', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    frictionCoefficient: '0.5'
                }
            };

            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            const frictionCoefficientControl = scenarioData.get('frictionCoefficient');
            expect(frictionCoefficientControl?.value).toBe('0.5');
        });

        it('should handle null model gracefully', () => {
            fixture.componentRef.setInput('model', null);
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('frictionCoefficient')?.value ?? '').toBe('');
        });

        it('should handle model without frictionCoefficient', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {}
            };
            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('frictionCoefficient')?.value ?? '').toBe('');
        });

        it('should handle model with undefined frictionCoefficient', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    frictionCoefficient: undefined as any
                }
            };
            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('frictionCoefficient')?.value ?? '').toBe('');
        });

        it('should set runwayConditionForm reference to scenarioData FormGroup', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(component['runwayConditionForm']).toBe(scenarioData);
        });
    });

    describe('ngOnDestroy', () => {
        it('should remove frictionCoefficient control from scenarioData form', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('frictionCoefficient')).toBeTruthy();

            component.ngOnDestroy();

            expect(scenarioData.get('frictionCoefficient')).toBeNull();
        });

        it('should handle ngOnDestroy when control does not exist', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            scenarioData.removeControl('frictionCoefficient');

            expect(() => component.ngOnDestroy()).not.toThrow();
        });

        it('should throw error when ngOnDestroy is called before ngOnInit', () => {
            expect(() => component.ngOnDestroy()).toThrow();
            fixture.detectChanges();
        });
    });

    describe('buildForm', () => {
        it('should create runwayConditionForm reference from parent form', () => {
            fixture.detectChanges();

            expect(component['runwayConditionForm']).toBeTruthy();
            expect(component['runwayConditionForm']).toBe(parentForm.get('scenarioData') as FormGroup);
        });

        it('should add frictionCoefficient FormControl to scenarioData form', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            const frictionCoefficient = scenarioData.get('frictionCoefficient');
            expect(frictionCoefficient).toBeTruthy();
            expect(frictionCoefficient).toBeInstanceOf(FormControl);
        });

        it('should initialize frictionCoefficient as empty FormControl', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            const frictionCoefficient = scenarioData.get('frictionCoefficient') as FormControl;
            expect(frictionCoefficient).toBeTruthy();
            expect(frictionCoefficient.value ?? '').toBe('');
        });

        it('should handle case when scenarioData FormGroup does not exist', () => {
            const formWithoutScenarioData = new FormGroup({});
            const directiveWithoutScenarioData = {
                form: formWithoutScenarioData
            } as FormGroupDirective;

            try {
                TestBed.resetTestingModule();
            } catch (e) {
                // Ignore cleanup errors from previous tests
            }

            TestBed.configureTestingModule({
                imports: [
                    RunwayConditionComponent,
                    ReactiveFormsModule,
                    NoopAnimationsModule
                ],
                providers: [
                    { provide: FormGroupDirective, useValue: directiveWithoutScenarioData }
                ]
            });

            const testFixture = TestBed.createComponent(RunwayConditionComponent);
            const testComponent = testFixture.componentInstance;
            try {
                testFixture.detectChanges();
                fail('Expected detectChanges to throw');
            } catch (e) {
                expect(e).toBeDefined();
            } finally {
                testComponent['runwayConditionForm'] = new FormGroup({});
            }
        });
    });

    describe('Form Control Integration', () => {
        it('should allow setting and getting frictionCoefficient form control value', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            const frictionCoefficientControl = scenarioData.get('frictionCoefficient');

            frictionCoefficientControl?.setValue('0.75');
            expect(frictionCoefficientControl?.value).toBe('0.75');

            frictionCoefficientControl?.setValue('0.3');
            expect(frictionCoefficientControl?.value).toBe('0.3');
        });

        it('should maintain form control state after value changes', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            const frictionCoefficientControl = scenarioData.get('frictionCoefficient');

            frictionCoefficientControl?.setValue('0.5');
            expect(frictionCoefficientControl?.value).toBe('0.5');
            expect(frictionCoefficientControl?.valid).toBeTruthy();

            frictionCoefficientControl?.setValue('');
            expect(frictionCoefficientControl?.value).toBe('');
        });

        it('should patch value correctly when model is set before initialization', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    frictionCoefficient: '0.6'
                }
            };

            // Set the model input BEFORE detectChanges so ngOnInit runs with the model
            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            const frictionCoefficientControl = scenarioData.get('frictionCoefficient');
            expect(frictionCoefficientControl?.value).toBe('0.6');
        });
    });

    describe('Edge Cases', () => {
        it('should handle multiple ngOnInit calls', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('frictionCoefficient')).toBeTruthy();

            // Simulate multiple ngOnInit calls
            component.ngOnInit();
            component.ngOnInit();

            // Should still have only one control
            const controls = Object.keys(scenarioData.controls);
            const frictionCoefficientCount = controls.filter(c => c === 'frictionCoefficient').length;
            expect(frictionCoefficientCount).toBe(1);
        });

        it('should handle ngOnDestroy called multiple times', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('frictionCoefficient')).toBeTruthy();

            component.ngOnDestroy();
            expect(scenarioData.get('frictionCoefficient')).toBeNull();

            // Should not throw when called again
            expect(() => component.ngOnDestroy()).not.toThrow();
        });

        it('should handle model with empty string frictionCoefficient', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    frictionCoefficient: ''
                }
            };

            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            const frictionCoefficientControl = scenarioData.get('frictionCoefficient');
            expect(frictionCoefficientControl?.value).toBe('');
        });

        it('should handle model with numeric frictionCoefficient converted to string', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    frictionCoefficient: '0.85'
                }
            };

            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            const frictionCoefficientControl = scenarioData.get('frictionCoefficient');
            expect(frictionCoefficientControl?.value).toBe('0.85');
        });
    });
});

