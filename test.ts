import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormControl, FormGroup, FormGroupDirective } from '@angular/forms';
import { firstValueFrom, of } from 'rxjs';

import { OperationalStatusComponent } from './operational-status.component';
import { LookupCacheStore } from '../../store/lookup-cache-store';
import { FaaNotamModel, KeyValueModel } from '../../models';

describe('OperationalStatusComponent', () => {
  let fixture: ComponentFixture<OperationalStatusComponent>;
  let component: OperationalStatusComponent;

  let rootForm: FormGroup;
  let store: jasmine.SpyObj<LookupCacheStore>;

  beforeEach(async () => {
    rootForm = new FormGroup({
      scenarioData: new FormGroup({
        equipmentStatus: new FormControl<string | null>(null),
      }),
    });

    const options: KeyValueModel[] = [{ key: 'OP', value: 'Operational' }];

    store = jasmine.createSpyObj<LookupCacheStore>(
      'LookupCacheStore',
      ['fetchNavaidStatusType'],
      { navaidStatusType$: of(options) }
    );

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, OperationalStatusComponent],
      providers: [
        { provide: LookupCacheStore, useValue: store },
        { provide: FormGroupDirective, useValue: { form: rootForm } as FormGroupDirective },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperationalStatusComponent);
    component = fixture.componentInstance;

    // Set the input BEFORE running lifecycle so ngOnInit sees it
    fixture.componentRef.setInput('model', {
      scenarioData: { equipmentStatus: 'OP' },
    } as FaaNotamModel);

    // Run initialization manually to avoid timing issues with signal inputs
    component.ngOnInit();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add required operationalStatus control to scenarioData', () => {
    const scenario = rootForm.get('scenarioData') as FormGroup;
    const control = scenario.get('operationalStatus');
    expect(control).toBeTruthy();
    expect(control?.valid).toBeFalse();
    control?.setValue('OP');
    expect(control?.valid).toBeTrue();
  });

  it('should patch operationalStatus from input model', () => {
    // Ensure the component is properly initialized
    fixture.detectChanges();
    
    const scenario = rootForm.get('scenarioData') as FormGroup;
    const control = scenario.get('operationalStatus');
    
    expect(control).toBeTruthy();
    expect(control?.value).toBe('OP');
  });

  it('should wire operationalStatus$ and fetch options on init', async () => {
    const vals = await firstValueFrom(component.operationalStatus$);
    expect(vals[0].key).toBe('OP');
    expect(store.fetchNavaidStatusType).toHaveBeenCalledTimes(1);
  });

  it('should remove operationalStatus control on destroy', () => {
    const scenario = rootForm.get('scenarioData') as FormGroup;
    expect(scenario.get('operationalStatus')).toBeTruthy();
    fixture.destroy(); // triggers ngOnDestroy
    expect(scenario.get('operationalStatus')).toBeNull();
  });

  it('should handle null model input gracefully', () => {
    // Reset component with null model
    fixture.componentRef.setInput('model', null);
    
    // Trigger change detection to update the component
    fixture.detectChanges();
    
    const scenario = rootForm.get('scenarioData') as FormGroup;
    const control = scenario.get('operationalStatus');
    // The control should exist and be created properly
    expect(control).toBeTruthy();
    // The value should be empty string (from the || '' fallback in patching logic)
    expect(control?.value).toBe('');
  });

  it('should handle model with null scenarioData gracefully', () => {
    // Reset component with model having null scenarioData
    fixture.componentRef.setInput('model', { scenarioData: null } as unknown as FaaNotamModel);
    
    // Trigger change detection to update the component
    fixture.detectChanges();
    
    const scenario = rootForm.get('scenarioData') as FormGroup;
    const control = scenario.get('operationalStatus');
    // The control should still exist and have its default value
    expect(control).toBeTruthy();
    expect(control?.value).toBe('');
  });

  it('should handle model with undefined equipmentStatus gracefully', () => {
    // Reset component with model having undefined equipmentStatus
    fixture.componentRef.setInput('model', { scenarioData: { equipmentStatus: undefined } } as unknown as FaaNotamModel);
    
    // Trigger change detection to update the component
    fixture.detectChanges();
    
    const scenario = rootForm.get('scenarioData') as FormGroup;
    const control = scenario.get('operationalStatus');
    // The control should exist and be created properly
    expect(control).toBeTruthy();
    // The value should be empty string (from the || '' fallback in patching logic)
    expect(control?.value).toBe('');
  });

  it('should not add operationalStatus control if it already exists', () => {
    const scenario = rootForm.get('scenarioData') as FormGroup;
    const initialControl = scenario.get('operationalStatus');
    
    // Call buildForm again
    component['buildForm']();
    
    const afterControl = scenario.get('operationalStatus');
    expect(afterControl).toBe(initialControl); // Same reference, not recreated
  });

});
