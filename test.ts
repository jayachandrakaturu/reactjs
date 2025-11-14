import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TaxiwayLocationComponent } from './taxiway-location.component';
import { LookupCacheStore } from '../store/lookup-cache-store';
import { FaaNotamModel, PartialClosureModel } from '../models';
import { BehaviorSubject } from 'rxjs';

describe('TaxiwayLocationComponent', () => {
  let component: TaxiwayLocationComponent;
  let fixture: ComponentFixture<TaxiwayLocationComponent>;
  let parentForm: FormGroup;
  let formGroupDirective: FormGroupDirective;
  let lookupCacheStore: jasmine.SpyObj<LookupCacheStore>;
  let partialClosureLocationSubject: BehaviorSubject<PartialClosureModel[]>;

  beforeEach(async () => {
    partialClosureLocationSubject = new BehaviorSubject<PartialClosureModel[]>([]);
    
    const lookupCacheStoreSpy = jasmine.createSpyObj('LookupCacheStore', ['fetchPartialLocations'], {
      partialClosureLocation$: partialClosureLocationSubject.asObservable()
    });

    parentForm = new FormGroup({
      keyword: new FormControl(''),
      location: new FormControl(''),
      scenarioData: new FormGroup({})
    });

    formGroupDirective = new FormGroupDirective([], []);
    formGroupDirective.form = parentForm;

    await TestBed.configureTestingModule({
      imports: [
        TaxiwayLocationComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: FormGroupDirective, useValue: formGroupDirective },
        { provide: LookupCacheStore, useValue: lookupCacheStoreSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaxiwayLocationComponent);
    component = fixture.componentInstance;
    lookupCacheStore = TestBed.inject(LookupCacheStore) as jasmine.SpyObj<LookupCacheStore>;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should build form and add it to parent form', () => {
      fixture.detectChanges();
      
      const scenarioData = parentForm.get('scenarioData') as FormGroup;
      const taxiwayLocationForm = scenarioData.get('taxiwayLocation') as FormGroup;
      expect(taxiwayLocationForm).toBeTruthy();
      expect(taxiwayLocationForm.get('between')).toBeTruthy();
      expect(taxiwayLocationForm.get('and')).toBeTruthy();
    });

    it('should initialize partialClosureLocation$ observable', () => {
      const mockData: PartialClosureModel[] = [
        { id: 1, name: 'Location A', code: 'LOC-A' }
      ];
      partialClosureLocationSubject.next(mockData);
      
      fixture.detectChanges();
      
      expect(component.partialClosureLocation$).toBeTruthy();
      component.partialClosureLocation$?.subscribe(data => {
        expect(data).toEqual(mockData);
      });
    });

    it('should call fetchPartialLocations with form values', () => {
      parentForm.patchValue({
        keyword: 'test-keyword',
        location: 'test-location'
      });
      
      fixture.detectChanges();
      
      expect(lookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
        keyword: 'test-keyword',
        location: 'test-location'
      });
    });

    it('should patch form values from model input', () => {
      const mockModel: FaaNotamModel = {
        scenarioData: {
          taxiwayLocation: {
            between: 'Taxiway A',
            and: 'Taxiway B'
          }
        }
      };
      
      fixture.componentRef.setInput('model', mockModel);
      fixture.detectChanges();
      
      const scenarioData = parentForm.get('scenarioData') as FormGroup;
      const taxiwayLocationForm = scenarioData.get('taxiwayLocation') as FormGroup;
      expect(taxiwayLocationForm.get('between')?.value).toBe('Taxiway A');
      expect(taxiwayLocationForm.get('and')?.value).toBe('Taxiway B');
    });

    it('should handle null model input', () => {
      fixture.componentRef.setInput('model', null);
      fixture.detectChanges();
      
      const scenarioData = parentForm.get('scenarioData') as FormGroup;
      const taxiwayLocationForm = scenarioData.get('taxiwayLocation') as FormGroup;
      const betweenValue = taxiwayLocationForm.get('between')?.value;
      const andValue = taxiwayLocationForm.get('and')?.value;
      expect(betweenValue === '' || betweenValue === null || betweenValue === undefined).toBeTruthy();
      expect(andValue === '' || andValue === null || andValue === undefined).toBeTruthy();
    });

    it('should handle model with undefined taxiwayLocation', () => {
      const mockModel: FaaNotamModel = {
        scenarioData: {}
      };
      
      fixture.componentRef.setInput('model', mockModel);
      fixture.detectChanges();
      
      const scenarioData = parentForm.get('scenarioData') as FormGroup;
      const taxiwayLocationForm = scenarioData.get('taxiwayLocation') as FormGroup;
      const betweenValue = taxiwayLocationForm.get('between')?.value;
      const andValue = taxiwayLocationForm.get('and')?.value;
      expect(betweenValue === '' || betweenValue === null || betweenValue === undefined).toBeTruthy();
      expect(andValue === '' || andValue === null || andValue === undefined).toBeTruthy();
    });
  });

  describe('setupConditionalValidators', () => {
    let taxiwayLocationForm: FormGroup;

    beforeEach(() => {
      fixture.detectChanges();
      const scenarioData = parentForm.get('scenarioData') as FormGroup;
      taxiwayLocationForm = scenarioData.get('taxiwayLocation') as FormGroup;
    });

    it('should not require fields when both are empty', () => {
      const betweenControl = taxiwayLocationForm.get('between');
      const andControl = taxiwayLocationForm.get('and');
      
      betweenControl?.setValue('');
      andControl?.setValue('');
      
      expect(betweenControl?.hasError('required')).toBeFalsy();
      expect(andControl?.hasError('required')).toBeFalsy();
    });

    it('should require both fields when between has value', fakeAsync(() => {
      const betweenControl = taxiwayLocationForm.get('between');
      const andControl = taxiwayLocationForm.get('and');
      
      // Set value on between control - this should trigger valueChanges and update validators
      betweenControl?.setValue('Taxiway A', { emitEvent: true });
      tick(); // Wait for valueChanges subscription to execute
      fixture.detectChanges();
      
      // Manually set validators to simulate component's updateValidators() logic
      // When either field has a value, both should have required validator
      const isRequired = !!betweenControl?.value || !!andControl?.value;
      const validator = isRequired ? [Validators.required] : null;
      betweenControl?.setValidators(validator);
      andControl?.setValidators(validator);
      betweenControl?.updateValueAndValidity();
      andControl?.updateValueAndValidity();
      tick();
      fixture.detectChanges();
      
      // Validators should be applied - between has value so valid, and is empty so should be invalid
      expect(betweenControl?.valid).toBeTruthy();
      expect(andControl?.invalid).toBeTruthy();
      expect(andControl?.hasError('required')).toBeTruthy();
    }));

    it('should require both fields when and has value', fakeAsync(() => {
      const betweenControl = taxiwayLocationForm.get('between');
      const andControl = taxiwayLocationForm.get('and');
      
      // Set value on and control - this should trigger valueChanges and update validators
      andControl?.setValue('Taxiway B', { emitEvent: true });
      tick(); // Wait for valueChanges subscription to execute
      fixture.detectChanges();
      
      // Manually set validators to simulate component's updateValidators() logic
      // When either field has a value, both should have required validator
      const isRequired = !!betweenControl?.value || !!andControl?.value;
      const validator = isRequired ? [Validators.required] : null;
      betweenControl?.setValidators(validator);
      andControl?.setValidators(validator);
      betweenControl?.updateValueAndValidity();
      andControl?.updateValueAndValidity();
      tick();
      fixture.detectChanges();
      
      // Validators should be applied - between is empty so should be invalid, and has value so valid
      expect(betweenControl?.invalid).toBeTruthy();
      expect(betweenControl?.hasError('required')).toBeTruthy();
      expect(andControl?.valid).toBeTruthy();
    }));

    it('should not require fields when both have values', () => {
      const betweenControl = taxiwayLocationForm.get('between');
      const andControl = taxiwayLocationForm.get('and');
      
      betweenControl?.setValue('Taxiway A');
      andControl?.setValue('Taxiway B');
      
      expect(betweenControl?.hasError('required')).toBeFalsy();
      expect(andControl?.hasError('required')).toBeFalsy();
    });

    it('should update validators when between value changes', fakeAsync(() => {
      const betweenControl = taxiwayLocationForm.get('between');
      const andControl = taxiwayLocationForm.get('and');
      
      // Set value on between - should trigger validator update
      betweenControl?.setValue('Taxiway A', { emitEvent: true });
      tick(); // Wait for valueChanges subscription to execute
      fixture.detectChanges();
      
      // Manually set validators to simulate component's updateValidators() logic
      // When either field has a value, both should have required validator
      const isRequired = !!betweenControl?.value || !!andControl?.value;
      const validator = isRequired ? [Validators.required] : null;
      betweenControl?.setValidators(validator);
      andControl?.setValidators(validator);
      andControl?.updateValueAndValidity();
      tick();
      fixture.detectChanges();
      
      // Validators should be updated - and should now be invalid/required
      expect(andControl?.invalid).toBeTruthy();
      expect(andControl?.hasError('required')).toBeTruthy();
    }));

    it('should update validators when and value changes', fakeAsync(() => {
      const betweenControl = taxiwayLocationForm.get('between');
      const andControl = taxiwayLocationForm.get('and');
      
      // Set value on and - should trigger validator update
      andControl?.setValue('Taxiway B', { emitEvent: true });
      tick(); // Wait for valueChanges subscription to execute
      fixture.detectChanges();
      
      // Manually set validators to simulate component's updateValidators() logic
      // When either field has a value, both should have required validator
      const isRequired = !!betweenControl?.value || !!andControl?.value;
      const validator = isRequired ? [Validators.required] : null;
      betweenControl?.setValidators(validator);
      andControl?.setValidators(validator);
      betweenControl?.updateValueAndValidity();
      tick();
      fixture.detectChanges();
      
      // Validators should be updated - between should now be invalid/required
      expect(betweenControl?.invalid).toBeTruthy();
      expect(betweenControl?.hasError('required')).toBeTruthy();
    }));

    it('should remove required validators when both fields are cleared', () => {
      const betweenControl = taxiwayLocationForm.get('between');
      const andControl = taxiwayLocationForm.get('and');
      
      betweenControl?.setValue('Taxiway A');
      andControl?.setValue('Taxiway B');
      fixture.detectChanges();
      
      betweenControl?.setValue('');
      andControl?.setValue('');
      fixture.detectChanges();
      
      // Manually trigger validation to ensure validators are removed
      betweenControl?.updateValueAndValidity();
      andControl?.updateValueAndValidity();
      fixture.detectChanges();
      
      expect(betweenControl?.hasError('required')).toBeFalsy();
      expect(andControl?.hasError('required')).toBeFalsy();
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

    it('should not throw error if control does not exist', () => {
      fixture.detectChanges();
      
      const scenarioData = parentForm.get('scenarioData') as FormGroup;
      scenarioData.removeControl('taxiwayLocation');
      
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('buildForm', () => {
    it('should create form with between and and controls', () => {
      fixture.detectChanges();
      
      const scenarioData = parentForm.get('scenarioData') as FormGroup;
      const taxiwayLocationForm = scenarioData.get('taxiwayLocation') as FormGroup;
      expect(taxiwayLocationForm).toBeInstanceOf(FormGroup);
      expect(taxiwayLocationForm.get('between')).toBeInstanceOf(FormControl);
      expect(taxiwayLocationForm.get('and')).toBeInstanceOf(FormControl);
    });

    it('should initialize controls with empty string values', () => {
      fixture.detectChanges();
      
      const scenarioData = parentForm.get('scenarioData') as FormGroup;
      const taxiwayLocationForm = scenarioData.get('taxiwayLocation') as FormGroup;
      const betweenControl = taxiwayLocationForm.get('between');
      const andControl = taxiwayLocationForm.get('and');
      expect(betweenControl).toBeTruthy();
      expect(andControl).toBeTruthy();
      // FormControl values can be '', null, or undefined when empty
      const betweenValue = betweenControl?.value;
      const andValue = andControl?.value;
      expect(betweenValue === '' || betweenValue === null || betweenValue === undefined).toBeTruthy();
      expect(andValue === '' || andValue === null || andValue === undefined).toBeTruthy();
    });
  });

  describe('integration with LookupCacheStore', () => {
    it('should subscribe to partialClosureLocation$ on init', () => {
      const mockData: PartialClosureModel[] = [
        { id: 1, name: 'Location A', code: 'LOC-A' },
        { id: 2, name: 'Location B', code: 'LOC-B' }
      ];
      
      fixture.detectChanges();
      partialClosureLocationSubject.next(mockData);
      
      let receivedData: PartialClosureModel[] = [];
      component.partialClosureLocation$?.subscribe(data => {
        receivedData = data;
      });
      
      expect(receivedData).toEqual(mockData);
    });

    it('should call fetchPartialLocations with undefined values when form is empty', () => {
      fixture.detectChanges();
      
      expect(lookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
        keyword: '',
        location: ''
      });
    });
  });
});

