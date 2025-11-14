import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormGroup, FormGroupDirective, FormControl } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { TaxiwayLocationComponent } from './taxiway-location.component';
import { LookupCacheStore } from '../../store/lookup-cache-store';

describe('TaxiwayLocationComponent (Full Coverage)', () => {
  let component: TaxiwayLocationComponent;
  let fixture: ComponentFixture<TaxiwayLocationComponent>;

  let mockLookupStore: any;
  let mockFormGroupDirective: any;

  beforeEach(async () => {
    mockLookupStore = {
      partialClosureLocation$: of([{ id: 1 }]), // ensure observable emits
      fetchPartialLocations: jasmine.createSpy('fetchPartialLocations')
    };

    mockFormGroupDirective = {
      form: new FormGroup({
        keyword: new FormControl('K-test'),
        location: new FormControl('L-test'),
        scenarioData: new FormGroup({})
      })
    };

    await TestBed.configureTestingModule({
      imports: [TaxiwayLocationComponent, ReactiveFormsModule],
      providers: [
        { provide: LookupCacheStore, useValue: mockLookupStore },
        { provide: FormGroupDirective, useValue: mockFormGroupDirective }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaxiwayLocationComponent);
    component = fixture.componentInstance;

    component.model.set({
      scenarioData: {
        taxiwayLocation: { between: 'B1', and: 'A1' }
      }
    } as any);

    fixture.detectChanges(); // triggers ngOnInit()
  });

  // -----------------------------------------
  // BASIC CREATION
  // -----------------------------------------
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // -----------------------------------------
  // FORM BUILD & PATCHING
  // -----------------------------------------
  it('should build taxiwayLocationForm and patch initial model data', () => {
    expect(component.taxiwayLocationForm.value).toEqual({
      between: 'B1',
      and: 'A1'
    });
  });

  it('should register taxiwayLocation inside scenarioData form', () => {
    const scenarioData = mockFormGroupDirective.form.get('scenarioData') as FormGroup;
    expect(scenarioData.contains('taxiwayLocation')).toBeTrue();
  });

  // -----------------------------------------
  // STORE CALL
  // -----------------------------------------
  it('should call fetchPartialLocations with keyword & location', () => {
    expect(mockLookupStore.fetchPartialLocations).toHaveBeenCalledWith({
      keyword: 'K-test',
      location: 'L-test'
    });
  });

  // -----------------------------------------
  // VALUE CHANGES (VALIDATION BRANCHES)
  // -----------------------------------------
  it('should apply validators when either field has value (branch A)', () => {
    const form = component.taxiwayLocationForm;
    form.patchValue({ between: 'HasValue', and: '' });

    expect(form.get('between')?.validator).toBeTruthy();
    expect(form.get('and')?.validator).toBeTruthy();
  });

  it('should apply validators when second field has value (branch B)', () => {
    const form = component.taxiwayLocationForm;
    form.patchValue({ between: '', and: 'SomeValue' });

    expect(form.get('between')?.validator).toBeTruthy();
    expect(form.get('and')?.validator).toBeTruthy();
  });

  it('should remove validators when both fields are empty (branch C)', () => {
    const form = component.taxiwayLocationForm;
    form.patchValue({ between: '', and: '' });

    expect(form.get('between')?.validator).toBeNull();
    expect(form.get('and')?.validator).toBeNull();
  });

  // -----------------------------------------
  // VALUE CHANGE SUBSCRIPTION EXECUTION
  // -----------------------------------------
  it('should trigger valueChanges subscription at least once', () => {
    const spy = spyOn(component.taxiwayLocationForm.valueChanges, 'subscribe').and.callThrough();
    component.ngOnInit(); // re-run to confirm
    expect(spy).toHaveBeenCalled();
  });

  // -----------------------------------------
  // ON DESTROY
  // -----------------------------------------
  it('should remove taxiwayLocation control on component destroy', () => {
    component.ngOnDestroy();

    const scenarioData = mockFormGroupDirective.form.get('scenarioData') as FormGroup;
    expect(scenarioData.get('taxiwayLocation')).toBeNull();
  });

  // -----------------------------------------
  // COVER CHANGE DETECTION + RE-ASSIGNMENT BRANCH
  // -----------------------------------------
  it('should re-run ngOnInit and still maintain structure', () => {
    component.ngOnInit();
    expect(component.taxiwayLocationForm).toBeDefined();
  });

  // -----------------------------------------
  // COVER ALL PRIVATE FUNCTIONS INDIRECTLY
  // -----------------------------------------
  it('should build form and attach controls correctly (indirect coverage)', () => {
    const scenarioData = mockFormGroupDirective.form.get('scenarioData') as FormGroup;
    expect(Object.keys(scenarioData.controls)).toContain('taxiwayLocation');
  });
});
