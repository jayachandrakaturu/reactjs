import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Navaid502AffectedAreaComponent } from './navaid-502-affected-area.component';
import { FaaNotamModel } from '../models';
import { requiredIfHasValue } from './validators/requried-if.validators';

describe('Navaid502AffectedAreaComponent', () => {
    let component: Navaid502AffectedAreaComponent;
    let fixture: ComponentFixture<Navaid502AffectedAreaComponent>;
    let parentForm: FormGroup;
    let formGroupDirective: FormGroupDirective;

    beforeEach(async () => {
        // Create parent form with scenarioData
        parentForm = new FormGroup({
            keyword: new FormControl('test-keyword'),
            location: new FormControl('test-location'),
            scenarioData: new FormGroup({})
        });

        // Create FormGroupDirective mock
        formGroupDirective = {
            form: parentForm
        } as FormGroupDirective;

        await TestBed.configureTestingModule({
            imports: [
                Navaid502AffectedAreaComponent,
                ReactiveFormsModule,
                NoopAnimationsModule
            ],
            providers: [
                { provide: FormGroupDirective, useValue: formGroupDirective }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(Navaid502AffectedAreaComponent);
        component = fixture.componentInstance;
    });

    describe('Component Initialization', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
            fixture.detectChanges();
        });
    });

    describe('ngOnInit', () => {
        it('should build form and add navaid502AffectedArea control to parent form', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('navaid502AffectedArea')).toBeTruthy();
            expect(component['navaid502AffectedAreaForm']).toBeTruthy();
        });

        it('should patch form values when model is provided with complete navaid502AffectedArea', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    navaid502AffectedArea: {
                        startAngle: 45,
                        endAngle: 90,
                        outerLimit: 100,
                        upperMostAltitude: 5000
                    }
                }
            };

            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            expect(navaid502AffectedAreaForm.get('startAngle')?.value).toBe(45);
            expect(navaid502AffectedAreaForm.get('endAngle')?.value).toBe(90);
            expect(navaid502AffectedAreaForm.get('outerLimit')?.value).toBe(100);
            expect(navaid502AffectedAreaForm.get('upperMostAltitude')?.value).toBe(5000);
        });

        it('should patch form values when model is provided with partial navaid502AffectedArea', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    navaid502AffectedArea: {
                        startAngle: 30,
                        endAngle: 60
                    }
                }
            };

            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            expect(navaid502AffectedAreaForm.get('startAngle')?.value).toBe(30);
            expect(navaid502AffectedAreaForm.get('endAngle')?.value).toBe(60);
            // When patchValue is called with undefined, FormControl stores undefined, not null
            expect(navaid502AffectedAreaForm.get('outerLimit')?.value).toBeUndefined();
            expect(navaid502AffectedAreaForm.get('upperMostAltitude')?.value).toBeUndefined();
        });

        it('should handle null model gracefully', () => {
            fixture.componentRef.setInput('model', null);
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            expect(navaid502AffectedAreaForm.get('startAngle')?.value).toBeNull();
            expect(navaid502AffectedAreaForm.get('endAngle')?.value).toBeNull();
            expect(navaid502AffectedAreaForm.get('outerLimit')?.value).toBeNull();
            expect(navaid502AffectedAreaForm.get('upperMostAltitude')?.value).toBeNull();
        });

        it('should handle model without navaid502AffectedArea', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {}
            };

            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            expect(navaid502AffectedAreaForm.get('startAngle')?.value).toBeNull();
            expect(navaid502AffectedAreaForm.get('endAngle')?.value).toBeNull();
            expect(navaid502AffectedAreaForm.get('outerLimit')?.value).toBeNull();
            expect(navaid502AffectedAreaForm.get('upperMostAltitude')?.value).toBeNull();
        });

        it('should throw error when model has null scenarioData', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: null as any
            };

            fixture.componentRef.setInput('model', mockModel);
            
            // Component accesses scenarioData.navaid502AffectedArea without optional chaining,
            // so it will throw when scenarioData is null
            expect(() => {
                fixture.detectChanges();
            }).toThrow();
        });

        it('should handle model with null navaid502AffectedArea property gracefully', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    navaid502AffectedArea: null as any
                }
            };

            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            expect(navaid502AffectedAreaForm.get('startAngle')?.value).toBeNull();
        });

        it('should handle model with empty navaid502AffectedArea object', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    navaid502AffectedArea: {}
                }
            };

            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            // Empty object is truthy, so patchValue is called but all values are undefined
            expect(navaid502AffectedAreaForm.get('startAngle')?.value).toBeUndefined();
            expect(navaid502AffectedAreaForm.get('endAngle')?.value).toBeUndefined();
        });
    });

    describe('ngOnDestroy', () => {
        it('should remove navaid502AffectedArea control from parent form', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('navaid502AffectedArea')).toBeTruthy();

            component.ngOnDestroy();

            expect(scenarioData.get('navaid502AffectedArea')).toBeNull();
        });
    });


    describe('Form Validation', () => {
        it('should validate startAngle with min validator (value < 0)', () => {
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const startAngleControl = navaid502AffectedAreaForm.get('startAngle');
            
            startAngleControl?.setValue(-1);
            startAngleControl?.updateValueAndValidity();
            
            expect(startAngleControl?.hasError('min')).toBeTruthy();
        });

        it('should validate startAngle with max validator (value > 360)', () => {
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const startAngleControl = navaid502AffectedAreaForm.get('startAngle');
            
            startAngleControl?.setValue(361);
            startAngleControl?.updateValueAndValidity();
            
            expect(startAngleControl?.hasError('max')).toBeTruthy();
        });


        it('should validate endAngle with min validator (value < 0)', () => {
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const endAngleControl = navaid502AffectedAreaForm.get('endAngle');
            
            endAngleControl?.setValue(-1);
            endAngleControl?.updateValueAndValidity();
            
            expect(endAngleControl?.hasError('min')).toBeTruthy();
        });

        it('should validate endAngle with max validator (value > 360)', () => {
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const endAngleControl = navaid502AffectedAreaForm.get('endAngle');
            
            endAngleControl?.setValue(361);
            endAngleControl?.updateValueAndValidity();
            
            expect(endAngleControl?.hasError('max')).toBeTruthy();
        });


        it('should apply requiredIfHasValue validator to startAngle when endAngle has value', () => {
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const startAngleControl = navaid502AffectedAreaForm.get('startAngle');
            const endAngleControl = navaid502AffectedAreaForm.get('endAngle');
            
            // Set endAngle value (this control has validator requiredIfHasValue('startAngle'))
            endAngleControl?.setValue(90);
            endAngleControl?.updateValueAndValidity();
            
            // The validator on endAngle checks if startAngle has value
            // Since endAngle has value and startAngle is null, error should be on startAngle
            expect(startAngleControl?.hasError('requiredIfHasValue')).toBeTruthy();
        });

        it('should apply requiredIfHasValue validator to endAngle when startAngle has value', () => {
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const startAngleControl = navaid502AffectedAreaForm.get('startAngle');
            const endAngleControl = navaid502AffectedAreaForm.get('endAngle');
            
            // Set startAngle value (this control has validator requiredIfHasValue('endAngle'))
            startAngleControl?.setValue(45);
            startAngleControl?.updateValueAndValidity();
            
            // The validator on startAngle checks if endAngle has value
            // Since startAngle has value and endAngle is null, error should be on endAngle
            expect(endAngleControl?.hasError('requiredIfHasValue')).toBeTruthy();
        });

        it('should not set requiredIfHasValue error when both angles have values', () => {
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const startAngleControl = navaid502AffectedAreaForm.get('startAngle');
            const endAngleControl = navaid502AffectedAreaForm.get('endAngle');
            
            startAngleControl?.setValue(45);
            endAngleControl?.setValue(90);
            startAngleControl?.updateValueAndValidity();
            endAngleControl?.updateValueAndValidity();
            
            expect(startAngleControl?.hasError('requiredIfHasValue')).toBeFalsy();
            expect(endAngleControl?.hasError('requiredIfHasValue')).toBeFalsy();
        });

        it('should not set requiredIfHasValue error when both angles are null', () => {
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const startAngleControl = navaid502AffectedAreaForm.get('startAngle');
            const endAngleControl = navaid502AffectedAreaForm.get('endAngle');
            
            startAngleControl?.setValue(null);
            endAngleControl?.setValue(null);
            startAngleControl?.updateValueAndValidity();
            endAngleControl?.updateValueAndValidity();
            
            expect(startAngleControl?.hasError('requiredIfHasValue')).toBeFalsy();
            expect(endAngleControl?.hasError('requiredIfHasValue')).toBeFalsy();
        });

        it('should clear requiredIfHasValue error when value is provided', () => {
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const startAngleControl = navaid502AffectedAreaForm.get('startAngle');
            const endAngleControl = navaid502AffectedAreaForm.get('endAngle');
            
            // Set endAngle first (endAngle has validator requiredIfHasValue('startAngle'))
            // This should trigger error on startAngle since it's null
            endAngleControl?.setValue(90);
            endAngleControl?.updateValueAndValidity();
            
            expect(startAngleControl?.hasError('requiredIfHasValue')).toBeTruthy();
            
            // Now set startAngle value - error should be cleared when endAngle validator runs again
            startAngleControl?.setValue(45);
            startAngleControl?.updateValueAndValidity();
            endAngleControl?.updateValueAndValidity();
            
            expect(startAngleControl?.hasError('requiredIfHasValue')).toBeFalsy();
        });

        it('should clear requiredIfHasValue error when trigger control value is cleared', () => {
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const startAngleControl = navaid502AffectedAreaForm.get('startAngle');
            const endAngleControl = navaid502AffectedAreaForm.get('endAngle');
            
            // Set startAngle value to trigger error on endAngle
            startAngleControl?.setValue(45);
            startAngleControl?.updateValueAndValidity();
            
            expect(endAngleControl?.hasError('requiredIfHasValue')).toBeTruthy();
            
            // Clear startAngle value - this should clear the error on endAngle
            startAngleControl?.setValue(null);
            startAngleControl?.updateValueAndValidity();
            
            expect(endAngleControl?.hasError('requiredIfHasValue')).toBeFalsy();
        });

        it('should clear requiredIfHasValue error when trigger is cleared and no other errors exist', () => {
            fixture.detectChanges();

            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const startAngleControl = navaid502AffectedAreaForm.get('startAngle');
            const endAngleControl = navaid502AffectedAreaForm.get('endAngle');
            
            // Set endAngle first to trigger requiredIfHasValue error on startAngle
            endAngleControl?.setValue(90);
            endAngleControl?.updateValueAndValidity();
            
            expect(startAngleControl?.hasError('requiredIfHasValue')).toBeTruthy();
            
            // Clear endAngle value - this should clear requiredIfHasValue error completely
            // This tests the branch where Object.keys(rest).length === 0, so errors are set to null
            endAngleControl?.setValue(null);
            endAngleControl?.updateValueAndValidity();
            startAngleControl?.updateValueAndValidity();
            
            // requiredIfHasValue should be cleared and no errors should remain
            expect(startAngleControl?.hasError('requiredIfHasValue')).toBeFalsy();
            expect(startAngleControl?.errors).toBeNull();
        });


    });


    describe('Template Rendering - Error Messages', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should evaluate template branch for requiredIfHasValue error on startAngle', () => {
            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const startAngleControl = navaid502AffectedAreaForm.get('startAngle');
            const endAngleControl = navaid502AffectedAreaForm.get('endAngle');
            
            // Ensure startAngle is null
            startAngleControl?.setValue(null);
            
            // Set endAngle value - this triggers the validator on endAngle which sets error on startAngle
            // endAngle has validator: requiredIfHasValue('startAngle')
            endAngleControl?.setValue(90);
            endAngleControl?.updateValueAndValidity();
            
            // Verify the control has the error before detectChanges
            expect(startAngleControl?.hasError('requiredIfHasValue')).toBeTruthy();
            
            // Trigger change detection to evaluate template branches
            // Template: @if(navaid502AffectedAreaForm.hasError('requiredIfHasValue', ['startAngle']))
            // This covers the branch where the condition is true
            fixture.detectChanges();
        });

        it('should evaluate template branch for min error on startAngle (min true, max false)', () => {
            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const startAngleControl = navaid502AffectedAreaForm.get('startAngle');
            
            // Set invalid value (less than 0) - triggers min error but not max
            startAngleControl?.setValue(-1);
            startAngleControl?.updateValueAndValidity();
            
            // Verify the control has min error but not max error
            expect(startAngleControl?.hasError('min')).toBeTruthy();
            expect(startAngleControl?.hasError('max')).toBeFalsy();
            
            // Trigger change detection to evaluate template branches
            // Template: @if (navaid502AffectedAreaForm.hasError('min', ['startAngle']) || 
            //                navaid502AffectedAreaForm.hasError('max', ['startAngle']))
            // This covers the branch where min is true (first part of OR)
            fixture.detectChanges();
        });

        it('should evaluate template branch for max error on startAngle (max true, min false)', () => {
            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const startAngleControl = navaid502AffectedAreaForm.get('startAngle');
            
            // Set invalid value (greater than 360) - triggers max error but not min
            startAngleControl?.setValue(361);
            startAngleControl?.updateValueAndValidity();
            
            // Verify the control has max error but not min error
            expect(startAngleControl?.hasError('max')).toBeTruthy();
            expect(startAngleControl?.hasError('min')).toBeFalsy();
            
            // Trigger change detection to evaluate template branches
            // Template: @if (navaid502AffectedAreaForm.hasError('min', ['startAngle']) || 
            //                navaid502AffectedAreaForm.hasError('max', ['startAngle']))
            // This covers the branch where max is true (second part of OR)
            fixture.detectChanges();
        });

        it('should evaluate template branch for requiredIfHasValue error on endAngle', () => {
            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const startAngleControl = navaid502AffectedAreaForm.get('startAngle');
            const endAngleControl = navaid502AffectedAreaForm.get('endAngle');
            
            // Ensure endAngle is null
            endAngleControl?.setValue(null);
            
            // Set startAngle value - this triggers the validator on startAngle which sets error on endAngle
            // startAngle has validator: requiredIfHasValue('endAngle')
            startAngleControl?.setValue(45);
            startAngleControl?.updateValueAndValidity();
            
            // Verify the control has the error before detectChanges
            expect(endAngleControl?.hasError('requiredIfHasValue')).toBeTruthy();
            
            // Trigger change detection to evaluate template branches
            // Template: @if(navaid502AffectedAreaForm.hasError('requiredIfHasValue', ['endAngle']))
            // This covers the branch where the condition is true
            fixture.detectChanges();
        });

        it('should evaluate template branch for min error on endAngle (min true, max false)', () => {
            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const endAngleControl = navaid502AffectedAreaForm.get('endAngle');
            
            // Set invalid value (less than 0) - triggers min error but not max
            endAngleControl?.setValue(-1);
            endAngleControl?.updateValueAndValidity();
            
            // Verify the control has min error but not max error
            expect(endAngleControl?.hasError('min')).toBeTruthy();
            expect(endAngleControl?.hasError('max')).toBeFalsy();
            
            // Trigger change detection to evaluate template branches
            // Template: @if (navaid502AffectedAreaForm.hasError('min', ['endAngle']) || 
            //                navaid502AffectedAreaForm.hasError('max', ['endAngle']))
            // This covers the branch where min is true (first part of OR)
            fixture.detectChanges();
        });

        it('should evaluate template branch for max error on endAngle (max true, min false)', () => {
            const navaid502AffectedAreaForm = component['navaid502AffectedAreaForm'] as FormGroup;
            const endAngleControl = navaid502AffectedAreaForm.get('endAngle');
            
            // Set invalid value (greater than 360) - triggers max error but not min
            endAngleControl?.setValue(361);
            endAngleControl?.updateValueAndValidity();
            
            // Verify the control has max error but not min error
            expect(endAngleControl?.hasError('max')).toBeTruthy();
            expect(endAngleControl?.hasError('min')).toBeFalsy();
            
            // Trigger change detection to evaluate template branches
            // Template: @if (navaid502AffectedAreaForm.hasError('min', ['endAngle']) || 
            //                navaid502AffectedAreaForm.hasError('max', ['endAngle']))
            // This covers the branch where max is true (second part of OR)
            fixture.detectChanges();
        });

    });
});

describe('requiredIfHasValue Validator - Branch Coverage', () => {
    describe('when parent is not a FormGroup', () => {
        it('should return null when control has no parent', () => {
            const control = new FormControl('value');
            const validator = requiredIfHasValue('otherControl');
            
            const result = validator(control);
            
            expect(result).toBeNull();
        });
    });

    describe('when required control does not exist', () => {
        it('should handle gracefully when required control name does not exist in form', () => {
            const formGroup = new FormGroup({
                triggerControl: new FormControl('value')
            });
            const triggerControl = formGroup.get('triggerControl') as FormControl;
            triggerControl.setValidators(requiredIfHasValue('nonExistentControl'));
            
            // Should not throw when updating validity
            expect(() => {
                triggerControl.updateValueAndValidity();
            }).not.toThrow();
            
            // Validator should return null
            const result = triggerControl.validator?.(triggerControl);
            expect(result).toBeNull();
        });
    });

    describe('error clearing with other errors present', () => {
        it('should preserve other errors when clearing requiredIfHasValue error', () => {
            const formGroup = new FormGroup({
                triggerControl: new FormControl(null),
                requiredControl: new FormControl(null)
            });
            
            const triggerControl = formGroup.get('triggerControl') as FormControl;
            const requiredControl = formGroup.get('requiredControl') as FormControl;
            
            // Set validator on triggerControl
            triggerControl.setValidators(requiredIfHasValue('requiredControl'));
            
            // Manually set both errors to simulate the state where both exist
            // This tests the branch: Object.keys(rest).length > 0 ? rest : null
            requiredControl.setErrors({ 
                requiredIfHasValue: true, 
                customError: true 
            });
            expect(requiredControl.hasError('requiredIfHasValue')).toBeTruthy();
            expect(requiredControl.hasError('customError')).toBeTruthy();
            
            // Clear trigger value - validator should clear requiredIfHasValue but preserve customError
            triggerControl.setValue(null);
            triggerControl.updateValueAndValidity();
            
            // requiredIfHasValue should be cleared, customError should remain
            expect(requiredControl.hasError('requiredIfHasValue')).toBeFalsy();
            expect(requiredControl.hasError('customError')).toBeTruthy();
        });

        it('should set errors to null when clearing requiredIfHasValue and no other errors exist', () => {
            const formGroup = new FormGroup({
                triggerControl: new FormControl(null),
                requiredControl: new FormControl(null)
            });
            
            const triggerControl = formGroup.get('triggerControl') as FormControl;
            const requiredControl = formGroup.get('requiredControl') as FormControl;
            
            // Set validator on triggerControl
            triggerControl.setValidators(requiredIfHasValue('requiredControl'));
            
            // Set trigger value to create requiredIfHasValue error
            triggerControl.setValue('trigger');
            triggerControl.updateValueAndValidity();
            
            expect(requiredControl.hasError('requiredIfHasValue')).toBeTruthy();
            expect(requiredControl.errors).toEqual({ requiredIfHasValue: true });
            
            // Clear trigger value - this should clear requiredIfHasValue completely
            // This tests the branch: Object.keys(rest).length === 0, so errors are set to null
            triggerControl.setValue(null);
            triggerControl.updateValueAndValidity();
            requiredControl.updateValueAndValidity();
            
            // requiredIfHasValue should be cleared and errors should be null
            expect(requiredControl.hasError('requiredIfHasValue')).toBeFalsy();
            expect(requiredControl.errors).toBeNull();
        });


        it('should not set error when trigger has value and required control also has value', () => {
            const formGroup = new FormGroup({
                triggerControl: new FormControl(null),
                requiredControl: new FormControl(null)
            });
            
            const triggerControl = formGroup.get('triggerControl') as FormControl;
            const requiredControl = formGroup.get('requiredControl') as FormControl;
            
            // Set validator on triggerControl
            triggerControl.setValidators(requiredIfHasValue('requiredControl'));
            
            // Set both values - this tests the branch: hasTriggerValue && !requiredControl.value (false branch)
            // When trigger has value AND required control has value, no error should be set
            triggerControl.setValue('trigger');
            requiredControl.setValue('required');
            triggerControl.updateValueAndValidity();
            
            // No error should be set when both have values
            expect(requiredControl.hasError('requiredIfHasValue')).toBeFalsy();
        });


        it('should handle when requiredControl.errors is null when setting error', () => {
            const formGroup = new FormGroup({
                triggerControl: new FormControl(null),
                requiredControl: new FormControl(null)
            });
            
            const triggerControl = formGroup.get('triggerControl') as FormControl;
            const requiredControl = formGroup.get('requiredControl') as FormControl;
            
            // Set validator on triggerControl
            triggerControl.setValidators(requiredIfHasValue('requiredControl'));
            
            // Ensure errors is null (no errors state)
            requiredControl.setErrors(null);
            expect(requiredControl.errors).toBeNull();
            
            // Set trigger value - should handle null errors when spreading
            // This tests the branch: { ...requiredControl.errors, requiredIfHasValue: true }
            // when errors is null (spreading null in JS results in empty object)
            triggerControl.setValue('trigger');
            triggerControl.updateValueAndValidity();
            
            // Error should be set
            expect(requiredControl.hasError('requiredIfHasValue')).toBeTruthy();
            expect(requiredControl.errors).toEqual({ requiredIfHasValue: true });
        });

        it('should handle when requiredControl.errors is undefined when setting error', () => {
            const formGroup = new FormGroup({
                triggerControl: new FormControl(null),
                requiredControl: new FormControl(null)
            });
            
            const triggerControl = formGroup.get('triggerControl') as FormControl;
            const requiredControl = formGroup.get('requiredControl') as FormControl;
            
            // Set validator on triggerControl
            triggerControl.setValidators(requiredIfHasValue('requiredControl'));
            
            // Set errors to undefined explicitly (simulating uninitialized state)
            // This tests the branch: { ...requiredControl.errors, requiredIfHasValue: true }
            // when errors is undefined
            (requiredControl as any).errors = undefined;
            
            // Set trigger value - should handle undefined errors when spreading
            triggerControl.setValue('trigger');
            triggerControl.updateValueAndValidity();
            
            // Error should be set
            expect(requiredControl.hasError('requiredIfHasValue')).toBeTruthy();
            expect(requiredControl.errors).toEqual({ requiredIfHasValue: true });
        });

        it('should handle when requiredControl.errors is undefined during clearing (testing || {} branch)', () => {
            const formGroup = new FormGroup({
                triggerControl: new FormControl(null),
                requiredControl: new FormControl(null)
            });
            
            const triggerControl = formGroup.get('triggerControl') as FormControl;
            const requiredControl = formGroup.get('requiredControl') as FormControl;
            
            // Set validator on triggerControl
            triggerControl.setValidators(requiredIfHasValue('requiredControl'));
            
            // Set trigger value to create error
            triggerControl.setValue('trigger');
            triggerControl.updateValueAndValidity();
            expect(requiredControl.hasError('requiredIfHasValue')).toBeTruthy();
            
            // Manually set errors to undefined to test the || {} branch in destructuring
            // This tests: const { requiredIfHasValue, ...rest } = requiredControl.errors || {}
            // when errors is undefined (not null)
            // We need to mock hasError to return true even when errors is undefined
            const originalHasError = requiredControl.hasError.bind(requiredControl);
            spyOn(requiredControl, 'hasError').and.returnValue(true);
            (requiredControl as any).errors = undefined;
            
            // Clear trigger - validator should handle undefined errors gracefully
            triggerControl.setValue(null);
            triggerControl.updateValueAndValidity();
            
            // Restore original hasError
            (requiredControl.hasError as jasmine.Spy).and.callThrough();
            
            // Error should be cleared
            expect(requiredControl.hasError('requiredIfHasValue')).toBeFalsy();
        });

    });
});

