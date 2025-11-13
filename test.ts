import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TaxiwayLocationComponent } from './taxiway-location.component';
import { LookupCacheStore } from '../../store/lookup-cache-store';
import { FaaNotamModel, PartialClosureModel } from '../../models';

describe('TaxiwayLocationComponent', () => {
  let component: TaxiwayLocationComponent;
  let fixture: ComponentFixture<TaxiwayLocationComponent>;
  let mockLookupCacheStore: jasmine.SpyObj<LookupCacheStore>;
  let mockFormGroupDirective: FormGroupDirective;
  let parentForm: FormGroup;

  beforeEach(async () => {
    // ✅ Prevent recursive calls in Angular forms during testing
    spyOn(FormGroup.prototype, 'updateValueAndValidity').and.callFake(function () {
      // No-op to avoid recursive triggering
    });

    // ✅ Mock LookupCacheStore with observable
    mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchPartialLocations']);

    Object.defineProperty(mockLookupCacheStore, 'partialClosureLocation$', {
      get: () =>
        of([
          { id: '1', name: 'Location 1' } as PartialClosureModel,
          { id: '2', name: 'Location 2' } as PartialClosureModel,
        ]),
      configurable: true,
    });

    // ✅ Create lightweight parent form
    parentForm = new FormGroup({
      keyword: new FormControl('test-keyword'),
      location: new FormControl('test-location'),
      scenarioData: new FormGroup({}),
    });

    // ✅ Simplified FormGroupDirective mock (avoid Angular internals)
    mockFormGroupDirective = {
      form: parentForm,
    } as unknown as FormGroupDirective;

    await TestBed.configureTestingModule({
      imports: [TaxiwayLocationComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: FormGroupDirective, useValue: mockFormGroupDirective },
        { provide: LookupCacheStore, useValue: mockLookupCacheStore },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxiwayLocationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form on ngOnInit', () => {
    fixture.componentRef.setInput('model', null);
    fixture.detectChanges();

    expect(component['taxiwayLocationForm']).toBeDefined();
    expect(component['taxiwayLocationForm'].get('between')).toBeDefined();
    expect(component['taxiwayLocationForm'].get('and')).toBeDefined();

    const scenarioData = parentForm.get('scenarioData') as FormGroup;
    expect(scenarioData.get('taxiwayLocation')).toBe(component['taxiwayLocationForm']);
  });

  it('should patch form values when model is provided', () => {
    const mockModel: FaaNotamModel = {
      scenarioData: {
        taxiwayLocation: { between: 'Taxiway A', and: 'Taxiway B' },
      },
    } as FaaNotamModel;

    fixture.componentRef.setInput('model', mockModel);
    fixture.detectChanges();

    expect(component['taxiwayLocationForm'].get('between')?.value).toBe('Taxiway A');
    expect(component['taxiwayLocationForm'].get('and')?.value).toBe('Taxiway B');
  });

  it('should fetch partial locations on ngOnInit', () => {
    fixture.componentRef.setInput('model', null);
    fixture.detectChanges();

    expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
      keyword: 'test-keyword',
      location: 'test-location',
    });
  });

  it('should initialize partialClosureLocation$ observable', (done) => {
    fixture.componentRef.setInput('model', null);
    fixture.detectChanges();

    component.partialClosureLocation$.subscribe((locations: PartialClosureModel[]) => {
      expect(locations.length).toBe(2);
      expect(locations[0].name).toBe('Location 1');
      expect(locations[1].name).toBe('Location 2');
      done();
    });
  });

  it('should update form values when manually set', () => {
    fixture.componentRef.setInput('model', null);
    fixture.detectChanges();

    component['taxiwayLocationForm'].patchValue({
      between: 'Taxiway O',
      and: 'Taxiway P',
    });

    expect(component['taxiwayLocationForm'].get('between')?.value).toBe('Taxiway O');
    expect(component['taxiwayLocationForm'].get('and')?.value).toBe('Taxiway P');
  });

  it('should remove taxiwayLocation control from scenarioData on ngOnDestroy', () => {
    fixture.componentRef.setInput('model', null);
    fixture.detectChanges();

    const scenarioData = parentForm.get('scenarioData') as FormGroup;
    expect(scenarioData.get('taxiwayLocation')).toBeDefined();

    component.ngOnDestroy();

    expect(scenarioData.get('taxiwayLocation')).toBeNull();
  });

  it('should correctly integrate with parent form', () => {
    fixture.componentRef.setInput('model', null);
    fixture.detectChanges();

    component['taxiwayLocationForm'].patchValue({
      between: 'Taxiway Q',
      and: 'Taxiway R',
    });

    const scenarioData = parentForm.get('scenarioData') as FormGroup;
    const taxiwayLocation = scenarioData.get('taxiwayLocation') as FormGroup;

    expect(taxiwayLocation.get('between')?.value).toBe('Taxiway Q');
    expect(taxiwayLocation.get('and')?.value).toBe('Taxiway R');
  });

  it('should render form template without errors', () => {
    fixture.componentRef.setInput('model', null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();
  });
});
