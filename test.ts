import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormGroup, FormControl, FormGroupDirective } from '@angular/forms';
import { firstValueFrom, of } from 'rxjs';

import { OperationalStatusComponent } from './operational-status.component';
import { LookupCacheStore } from '../../store/lookup-cache-store';
import { FaaNotamModel, KeyValueModel } from '../../models';

describe('OperationalStatusComponent', () => {
  let fixture: ComponentFixture<OperationalStatusComponent>;
  let component: OperationalStatusComponent;

  let rootForm: FormGroup;
  let mockStore: jasmine.SpyObj<LookupCacheStore>;

  beforeEach(async () => {
    rootForm = new FormGroup({
      scenarioData: new FormGroup({
        equipmentStatus: new FormControl<string | null>(null),
      }),
    });

    const navaidStatus: KeyValueModel[] = [{ key: 'OP', value: 'Operational' }];

    mockStore = jasmine.createSpyObj<LookupCacheStore>(
      'LookupCacheStore',
      ['fetchNavaidStatusType'],
      { navaidStatusType$: of(navaidStatus) }
    );

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, OperationalStatusComponent],
      providers: [
        { provide: LookupCacheStore, useValue: mockStore },
        { provide: FormGroupDirective, useValue: { form: rootForm } as FormGroupDirective },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperationalStatusComponent);
    component = fixture.componentInstance;

    component.model.set({ scenarioData: { equipmentStatus: 'OP' } } as FaaNotamModel);
    fixture.detectChanges(); // triggers ngOnInit
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

  it('should patch equipmentStatus from input model', () => {
    const scenario = rootForm.get('scenarioData') as FormGroup;
    expect(scenario.get('equipmentStatus')?.value).toBe('OP');
  });

  it('should wire operationalStatus$ and fetch options on init', async () => {
    const vals = await firstValueFrom(component.operationalStatus$);
    expect(vals.length).toBe(1);
    expect(vals[0].key).toBe('OP');
    expect(mockStore.fetchNavaidStatusType).toHaveBeenCalledTimes(1);
  });

  it('should remove operationalStatus control on destroy', () => {
    const scenario = rootForm.get('scenarioData') as FormGroup;
    expect(scenario.get('operationalStatus')).toBeTruthy();
    fixture.destroy(); // triggers ngOnDestroy
    expect(scenario.get('operationalStatus')).toBeNull();
  });
});
