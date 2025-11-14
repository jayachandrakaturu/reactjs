import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { TaxiwayLocationComponent } from './taxiway-location.component';
import { LookupCacheStore } from '../../store/lookup-cache-store';
import { DestroyRef } from '@angular/core';

describe('TaxiwayLocationComponent', () => {
  let component: TaxiwayLocationComponent;
  let fixture: ComponentFixture<TaxiwayLocationComponent>;

  let mockStore: any;
  let mockFormGroupDirective: any;

  let rootForm: FormGroup;
  let scenarioData: FormGroup;

  beforeEach(async () => {
    // mock store
    mockStore = {
      partialClosureLocation$: of([{ id: 1, name: 'X' }]),
      fetchPartialLocations: jasmine.createSpy('fetchPartialLocations'),
    };

    // Root form structure
    scenarioData = new FormGroup({});
    rootForm = new FormGroup({
      keyword: new FormControl('TEST_KW'),
      location: new FormControl('TEST_LOC'),
      scenarioData: scenarioData
    });

    // Mock FormGroupDirective
    mockFormGroupDirective = {
      form: rootForm
    };

    // Mock DestroyRef
    const destroyRefMock = {
      onDestroy: (fn: () => void) => fn()
    };

    await TestBed.configureTestingModule({
      imports: [TaxiwayLocationComponent, ReactiveFormsModule],
      providers: [
        { provide: LookupCacheStore, useValue: mockStore },
        { provide: FormGroupDirective, useValue: mockFormGroupDirective },
        { provide: DestroyRef, useValue: destroyRefMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaxiwayLocationComponent);
    component = fixture.componentInstance;

    // mock model() input signal
    component.model = () =>
      ({
        scenarioData: {
          taxiwayLocation: {
            between: 'A',
            and: 'B'
          }
        }
      }) as any;

    fixture.detectChanges(); // triggers ngOnInit
  });

  // -------------------------------------------------------------
  // TESTS
  // -------------------------------------------------------------

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form and add taxiwayLocation control', () => {
    const ctrl = scenarioData.get('taxiwayLocation');
    expect(ctrl).toBeTruthy();
    expect(ctrl instanceof FormGroup).toBeTrue();
  });

  it('should patch model values into form', () => {
    const taxiForm = scenarioData.get('taxiwayLocation') as FormGroup;

    expect(taxiForm.value).toEqual({
      between: 'A',
      and: 'B'
    });
  });

  it('should call fetchPartialLocations on init', () => {
    expect(mockStore.fetchPartialLocations).toHaveBeenCalledWith({
      keyword: 'TEST_KW',
      location: 'TEST_LOC'
    });
  });

  it('should set validators when between/and have values', () => {
    const taxiForm = scenarioData.get('taxiwayLocation') as FormGroup;

    taxiForm.patchValue({ between: 'A', and: 'B' });

    fixture.detectChanges();

    taxiForm.updateValueAndValidity();

    expect(taxiForm.get('between')?.hasValidator)?.toBeTruthy;
    expect(taxiForm.get('and')?.hasValidator)?.toBeTruthy;
  });

  it('should clear validators when both values empty', () => {
    const taxiForm = scenarioData.get('taxiwayLocation') as FormGroup;

    taxiForm.patchValue({ between: null, and: null });

    fixture.detectChanges();

    taxiForm.updateValueAndValidity();

    expect(taxiForm.get('between')?.errors).toBeNull();
    expect(taxiForm.get('and')?.errors).toBeNull();
  });

  it('should remove taxiwayLocation control on destroy', () => {
    component.ngOnDestroy();

    expect(scenarioData.get('taxiwayLocation')).toBeNull();
  });
});
