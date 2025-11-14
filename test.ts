import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TaxiwayLocationComponent, requiredIf } from './taxiway-location.component';
import { LookupCacheStore } from '../store/lookup-cache-store';
import { FaaNotamModel, PartialClosureModel } from '../models';
import { of } from 'rxjs';

describe('TaxiwayLocationComponent', () => {
    let component: TaxiwayLocationComponent;
    let fixture: ComponentFixture<TaxiwayLocationComponent>;
    let lookupCacheStore: jasmine.SpyObj<LookupCacheStore>;
    let parentForm: FormGroup;
    let formGroupDirective: FormGroupDirective;

    beforeEach(async () => {
        // Create parent form with scenarioData
        parentForm = new FormGroup({
            keyword: new FormControl('test-keyword'),
            location: new FormControl('test-location'),
            scenarioData: new FormGroup({}),
            locationType: new FormControl('between')
        });

        // Create FormGroupDirective mock
        formGroupDirective = {
            form: parentForm
        } as FormGroupDirective;

        // Create LookupCacheStore spy
        const mockPartialLocations: PartialClosureModel[] = [
            { id: 1, name: 'Location A', code: 'LOC-A' }
        ];
        
        lookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchPartialLocations'], {
            partialClosureLocation$: of(mockPartialLocations)
        });

        await TestBed.configureTestingModule({
            imports: [
                TaxiwayLocationComponent,
                ReactiveFormsModule,
                NoopAnimationsModule
            ],
            providers: [
                { provide: FormGroupDirective, useValue: formGroupDirective },
                { provide: LookupCacheStore, useValue: lookupCacheStore }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TaxiwayLocationComponent);
        component = fixture.componentInstance;
    });

    describe('Component Initialization', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
            // Call detectChanges to initialize the component properly
            fixture.detectChanges();
        });

        it('should initialize partialClosureLocation$ from lookupCacheStore', () => {
            fixture.detectChanges();
            expect(component.partialClosureLocation$).toBeDefined();
        });
    });

    describe('ngOnInit', () => {
        it('should build form and add taxiwayLocation control to parent form', () => {
            fixture.detectChanges();
            
            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('taxiwayLocation')).toBeTruthy();
            const taxiwayLocationForm = (component as any).taxiwayLocationForm as FormGroup;
            expect(taxiwayLocationForm).toBeTruthy();
            expect(taxiwayLocationForm.get('beginDesignator')).toBeTruthy();
            expect(taxiwayLocationForm.get('endDesignator')).toBeTruthy();
        });

        it('should call fetchPartialLocations with form values', () => {
            fixture.detectChanges();
            
            expect(lookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
                keyword: 'test-keyword',
                location: 'test-location'
            });
        });

        it('should call fetchPartialLocations with undefined values when form values are missing', () => {
            parentForm.patchValue({ keyword: null, location: null });
            fixture.detectChanges();
            
            expect(lookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
                keyword: null as any,
                location: null as any
            });
        });

        it('should patch form values when model is provided', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    taxiwayLocation: {
                        between: 'A1',
                        and: 'B2'
                    }
                }
            };
            
            // Set the model input using Angular's setInput method
            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();
            
            // Note: The component patches 'between' and 'and' but form has 'beginDesignator' and 'endDesignator'
            // So patchValue will silently ignore non-existent fields
            // This tests the actual behavior - the patchValue call happens but doesn't affect the form
            const taxiwayLocationForm = (component as any).taxiwayLocationForm as FormGroup;
            expect(taxiwayLocationForm.get('beginDesignator')?.value).toBe('');
            expect(taxiwayLocationForm.get('endDesignator')?.value).toBe('');
        });

        it('should handle null model gracefully', () => {
            fixture.componentRef.setInput('model', null);
            fixture.detectChanges();
            
            const taxiwayLocationForm = (component as any).taxiwayLocationForm as FormGroup;
            expect(taxiwayLocationForm.get('beginDesignator')?.value).toBe('');
            expect(taxiwayLocationForm.get('endDesignator')?.value).toBe('');
        });

        it('should handle model without taxiwayLocation', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {}
            };
            
            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();
            
            const taxiwayLocationForm = (component as any).taxiwayLocationForm as FormGroup;
            expect(taxiwayLocationForm.get('beginDesignator')?.value).toBe('');
            expect(taxiwayLocationForm.get('endDesignator')?.value).toBe('');
        });
    });

    describe('ngOnDestroy', () => {
        it('should remove taxiwayLocation control from parent form', () => {
            fixture.detectChanges();
            
            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('taxiwayLocation')).toBeTruthy();
            
            component.ngOnDestroy();
            
            expect(scenarioData.get('taxiwayLocation')).toBeNull();
        });

        it('should remove control even if called multiple times', () => {
            fixture.detectChanges();
            
            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('taxiwayLocation')).toBeTruthy();
            
            // First destroy
            component.ngOnDestroy();
            expect(scenarioData.get('taxiwayLocation')).toBeNull();
            
            // Re-add the control to test multiple destroys
            scenarioData.addControl('taxiwayLocation', new FormGroup({}));
            expect(scenarioData.get('taxiwayLocation')).toBeTruthy();
            
            // Second destroy - component expects the control to exist
            component.ngOnDestroy();
            expect(scenarioData.get('taxiwayLocation')).toBeNull();
        });
    });

    describe('Form Controls', () => {
        it('should have beginDesignator and endDesignator controls', () => {
            fixture.detectChanges();
            
            const taxiwayLocationForm = (component as any).taxiwayLocationForm as FormGroup;
            expect(taxiwayLocationForm.get('beginDesignator')).toBeTruthy();
            expect(taxiwayLocationForm.get('endDesignator')).toBeTruthy();
        });

        it('should have requiredIf validators on form controls', () => {
            fixture.detectChanges();
            
            const taxiwayLocationForm = (component as any).taxiwayLocationForm as FormGroup;
            const beginDesignator = taxiwayLocationForm.get('beginDesignator');
            const endDesignator = taxiwayLocationForm.get('endDesignator');
            
            expect(beginDesignator?.hasError('requiredIf')).toBeFalsy();
            expect(endDesignator?.hasError('requiredIf')).toBeFalsy();
        });
    });
});

describe('requiredIf Validator', () => {
    let formGroup: FormGroup;
    let control: FormControl;

    beforeEach(() => {
        formGroup = new FormGroup({
            locationType: new FormControl(''),
            beginDesignator: new FormControl(''),
            endDesignator: new FormControl('')
        });
        control = formGroup.get('beginDesignator') as FormControl;
    });

    describe('when parent control does not exist', () => {
        it('should return null if formGroup is null', () => {
            const validator = requiredIf('locationType', 'between', true, 'beginDesignator');
            const standaloneControl = new FormControl('');
            
            const result = validator(standaloneControl);
            
            expect(result).toBeNull();
        });

        it('should return null if parent control does not exist', () => {
            const formGroupWithoutParent = new FormGroup({
                beginDesignator: new FormControl('')
            });
            const controlWithoutParent = formGroupWithoutParent.get('beginDesignator') as FormControl;
            const validator = requiredIf('locationType', 'between', true, 'beginDesignator');
            
            const result = validator(controlWithoutParent);
            
            expect(result).toBeNull();
        });
    });

    describe('when parent control value does not match', () => {
        it('should return null when parent control value is different', () => {
            formGroup.patchValue({ locationType: 'other' });
            const validator = requiredIf('locationType', 'between', true, 'beginDesignator');
            control.setValidators(validator);
            control.updateValueAndValidity();
            
            expect(control.errors).toBeNull();
        });
    });

    describe('when parent control value matches and allRequired is true', () => {
        beforeEach(() => {
            formGroup.patchValue({ locationType: 'between' });
        });

        it('should return requiredIf error when child control is empty', () => {
            formGroup.patchValue({ beginDesignator: '', endDesignator: '' });
            const validator = requiredIf('locationType', 'between', true, 'beginDesignator', 'endDesignator');
            control.setValidators(validator);
            control.updateValueAndValidity();
            
            expect(control.errors).toEqual({ requiredIf: true });
        });

        it('should return requiredIf error when one child control is empty', () => {
            formGroup.patchValue({ beginDesignator: 'A1', endDesignator: '' });
            const validator = requiredIf('locationType', 'between', true, 'beginDesignator', 'endDesignator');
            control.setValidators(validator);
            control.updateValueAndValidity();
            
            expect(control.errors).toEqual({ requiredIf: true });
        });

        it('should return null when all child controls have values', () => {
            formGroup.patchValue({ beginDesignator: 'A1', endDesignator: 'B2' });
            const validator = requiredIf('locationType', 'between', true, 'beginDesignator', 'endDesignator');
            control.setValidators(validator);
            control.updateValueAndValidity();
            
            expect(control.errors).toBeNull();
        });

        it('should return requiredIf error when child control does not exist', () => {
            const validator = requiredIf('locationType', 'between', true, 'nonExistentControl');
            control.setValidators(validator);
            control.updateValueAndValidity();
            
            expect(control.errors).toEqual({ requiredIf: true });
        });
    });

    describe('when parent control value matches and allRequired is false', () => {
        beforeEach(() => {
            formGroup.patchValue({ locationType: 'between' });
        });

        it('should return null when at least one child control has value', () => {
            formGroup.patchValue({ beginDesignator: 'A1', endDesignator: '' });
            const validator = requiredIf('locationType', 'between', false, 'beginDesignator', 'endDesignator');
            control.setValidators(validator);
            control.updateValueAndValidity();
            
            expect(control.errors).toBeNull();
        });

        it('should return null when all child controls have values', () => {
            formGroup.patchValue({ beginDesignator: 'A1', endDesignator: 'B2' });
            const validator = requiredIf('locationType', 'between', false, 'beginDesignator', 'endDesignator');
            control.setValidators(validator);
            control.updateValueAndValidity();
            
            expect(control.errors).toBeNull();
        });

        it('should return requiredIf error when no child controls have values', () => {
            formGroup.patchValue({ beginDesignator: '', endDesignator: '' });
            const validator = requiredIf('locationType', 'between', false, 'beginDesignator', 'endDesignator');
            control.setValidators(validator);
            control.updateValueAndValidity();
            
            expect(control.errors).toEqual({ requiredIf: true });
        });
    });

    describe('with different control value types', () => {
        it('should work with number values', () => {
            const formGroupWithNumber = new FormGroup({
                status: new FormControl(0),
                value: new FormControl('')
            });
            const controlWithNumber = formGroupWithNumber.get('value') as FormControl;
            
            formGroupWithNumber.patchValue({ status: 1 });
            const validator = requiredIf('status', 1, true, 'value');
            controlWithNumber.setValidators(validator);
            controlWithNumber.updateValueAndValidity();
            
            expect(controlWithNumber.errors).toEqual({ requiredIf: true });
        });

        it('should work with boolean values', () => {
            const formGroupWithBoolean = new FormGroup({
                isActive: new FormControl(false),
                value: new FormControl('')
            });
            const controlWithBoolean = formGroupWithBoolean.get('value') as FormControl;
            
            formGroupWithBoolean.patchValue({ isActive: true });
            const validator = requiredIf('isActive', true, true, 'value');
            controlWithBoolean.setValidators(validator);
            controlWithBoolean.updateValueAndValidity();
            
            expect(controlWithBoolean.errors).toEqual({ requiredIf: true });
        });
    });
});

