import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TaxiwayRemainderComponent } from './taxiway-remainder.component';
import { LookupCacheStore } from '../store/lookup-cache-store';
import { FaaNotamModel, AixmLookupModel, TaxiwayRemainderModel } from '../models';
import { AIXM_TYPES, UNIT_IDS } from '../misc/constants';
import { of } from 'rxjs';

fdescribe('TaxiwayRemainderComponent', () => {
    let component: TaxiwayRemainderComponent;
    let fixture: ComponentFixture<TaxiwayRemainderComponent>;
    let lookupCacheStore: jasmine.SpyObj<LookupCacheStore>;
    let parentForm: FormGroup;
    let formGroupDirective: FormGroupDirective;
    let formBuilder: FormBuilder;

    beforeEach(async () => {
        // Create parent form with scenarioData
        parentForm = new FormGroup({
            scenarioData: new FormGroup({})
        });

        // Create FormGroupDirective mock
        formGroupDirective = {
            form: parentForm
        } as FormGroupDirective;

        // Create mock AixmLookupModel data
        const mockContaminationTypes: AixmLookupModel[] = [
            new AixmLookupModel({
                id: '1',
                translationPlainText: 'Contamination Type 1',
                translationAixm: 'CONT1',
                translationIcao: 'CONT1',
                translationFaa: 'CONT1',
                translationDod: 'CONT1'
            }),
            new AixmLookupModel({
                id: '2',
                translationPlainText: 'Contamination Type 2',
                translationAixm: 'CONT2',
                translationIcao: 'CONT2',
                translationFaa: 'CONT2',
                translationDod: 'CONT2'
            })
        ];

        const mockCoverageTypes: AixmLookupModel[] = [
            new AixmLookupModel({
                id: '1',
                translationPlainText: 'Coverage Type 1',
                translationAixm: 'COV1',
                translationIcao: 'COV1',
                translationFaa: 'COV1',
                translationDod: 'COV1'
            })
        ];

        const mockConditionDepths: AixmLookupModel[] = [
            new AixmLookupModel({
                id: '1',
                translationPlainText: 'INCHES',
                translationAixm: 'IN',
                translationIcao: 'IN',
                translationFaa: 'IN',
                translationDod: 'IN'
            }),
            new AixmLookupModel({
                id: '2',
                translationPlainText: 'CENTIMETERS',
                translationAixm: 'CM',
                translationIcao: 'CM',
                translationFaa: 'CM',
                translationDod: 'CM'
            })
        ];

        const mockDepthUnits: string[] = ['INCHES', 'CENTIMETERS'];

        // Create LookupCacheStore spy with all required methods
        lookupCacheStore = jasmine.createSpyObj('LookupCacheStore', [
            'fetchAixmKeyLookup',
            'getAixmKeyLookup',
            'getDepthUnits',
            'selectUnit',
            'getFilteredByUnit'
        ]);

        lookupCacheStore.getAixmKeyLookup.and.callFake((key: string) => {
            if (key === AIXM_TYPES.CONTAMINATION_TYPE) {
                return of(mockContaminationTypes);
            }
            if (key === AIXM_TYPES.COVERAGE_FOR) {
                return of(mockCoverageTypes);
            }
            if (key === AIXM_TYPES.CONDITION_DEPTH) {
                return of(mockConditionDepths);
            }
            return of([]);
        });

        lookupCacheStore.getDepthUnits.and.returnValue(of(mockDepthUnits));
        lookupCacheStore.getFilteredByUnit.and.returnValue(of(mockConditionDepths));

        await TestBed.configureTestingModule({
            imports: [
                TaxiwayRemainderComponent,
                ReactiveFormsModule,
                NoopAnimationsModule
            ],
            providers: [
                FormBuilder,
                { provide: FormGroupDirective, useValue: formGroupDirective },
                { provide: LookupCacheStore, useValue: lookupCacheStore }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TaxiwayRemainderComponent);
        component = fixture.componentInstance;
        formBuilder = TestBed.inject(FormBuilder);
    });

    describe('Component Initialization', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
            fixture.detectChanges();
        });

        it('should initialize observables from lookupCacheStore', () => {
            expect(component.contaminationTypes$).toBeUndefined();
            expect(component.coverageType$).toBeUndefined();
            expect(component.conditionDepths$).toBeUndefined();
            fixture.detectChanges();
            expect(component.contaminationTypes$).toBeDefined();
            expect(component.coverageType$).toBeDefined();
            expect(component.conditionDepths$).toBeDefined();
        });
    });

    describe('ngOnInit', () => {
        it('should build form and add taxiwayRemainder control to scenarioData form', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('taxiwayRemainder')).toBeTruthy();
            expect(component['scenarioDataForm']).toBeTruthy();
            expect(component['scenarioDataForm'].get('taxiwayRemainder')).toBeTruthy();
        });

        it('should call fetchAixmKeyLookup for CONTAMINATION_TYPE, COVERAGE_FOR, and CONDITION_DEPTH', () => {
            fixture.detectChanges();

            expect(lookupCacheStore.fetchAixmKeyLookup).toHaveBeenCalledWith(AIXM_TYPES.CONTAMINATION_TYPE);
            expect(lookupCacheStore.fetchAixmKeyLookup).toHaveBeenCalledWith(AIXM_TYPES.COVERAGE_FOR);
            expect(lookupCacheStore.fetchAixmKeyLookup).toHaveBeenCalledWith(AIXM_TYPES.CONDITION_DEPTH);
            expect(lookupCacheStore.fetchAixmKeyLookup).toHaveBeenCalledTimes(3);
        });

        it('should call getAixmKeyLookup for CONTAMINATION_TYPE and COVERAGE_FOR', () => {
            fixture.detectChanges();

            expect(lookupCacheStore.getAixmKeyLookup).toHaveBeenCalledWith(AIXM_TYPES.CONTAMINATION_TYPE);
            expect(lookupCacheStore.getAixmKeyLookup).toHaveBeenCalledWith(AIXM_TYPES.COVERAGE_FOR);
            expect(lookupCacheStore.getAixmKeyLookup).toHaveBeenCalledTimes(2);
        });

        it('should call getDepthUnits for CONDITION_DEPTH', () => {
            fixture.detectChanges();

            expect(lookupCacheStore.getDepthUnits).toHaveBeenCalledWith(AIXM_TYPES.CONDITION_DEPTH);
            expect(lookupCacheStore.getDepthUnits).toHaveBeenCalledTimes(1);
        });

        it('should initialize contaminationTypes$ observable', (done) => {
            fixture.detectChanges();

            component.contaminationTypes$!.subscribe((types) => {
                expect(types).toBeDefined();
                expect(types.length).toBe(2);
                expect(types[0].translationAixm).toBe('CONT1');
                done();
            });
        });

        it('should initialize coverageType$ observable', (done) => {
            fixture.detectChanges();

            component.coverageType$!.subscribe((types) => {
                expect(types).toBeDefined();
                expect(types.length).toBe(1);
                expect(types[0].translationAixm).toBe('COV1');
                done();
            });
        });

        it('should initialize conditionDepths$ observable', (done) => {
            fixture.detectChanges();

            component.conditionDepths$!.subscribe((units) => {
                expect(units).toBeDefined();
                expect(units.length).toBe(2);
                expect(units).toContain('INCHES');
                expect(units).toContain('CENTIMETERS');
                done();
            });
        });

        it('should add remainder groups when model has taxiwayRemainder data', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    taxiwayRemainder: [
                        {
                            contaminationType: 'CONT1',
                            coverage: 'COV1',
                            depthUnits: 'INCHES',
                            contDepth: 'DEPTH1'
                        },
                        {
                            contaminationType: 'CONT2',
                            depthUnits: 'CENTIMETERS',
                            contDepth: 'DEPTH2'
                        }
                    ]
                }
            };

            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            expect(component.remainderGroup.length).toBe(2);
        });

        it('should handle null model gracefully', () => {
            fixture.componentRef.setInput('model', null);
            fixture.detectChanges();

            expect(component.remainderGroup.length).toBe(0);
        });

        it('should handle model without taxiwayRemainder', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {}
            };

            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            expect(component.remainderGroup.length).toBe(0);
        });

        it('should handle model with empty taxiwayRemainder array', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    taxiwayRemainder: []
                }
            };

            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();

            expect(component.remainderGroup.length).toBe(0);
        });
    });

    describe('ngOnDestroy', () => {
        it('should remove taxiwayRemainder control from scenarioData form', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            expect(scenarioData.get('taxiwayRemainder')).toBeTruthy();

            component.ngOnDestroy();

            expect(scenarioData.get('taxiwayRemainder')).toBeNull();
        });

        it('should handle ngOnDestroy when control does not exist', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            scenarioData.removeControl('taxiwayRemainder');

            expect(() => component.ngOnDestroy()).not.toThrow();
        });
    });

    describe('remainderGroup getter', () => {
        it('should return FormArray from scenarioDataForm', () => {
            fixture.detectChanges();

            const remainderGroup = component.remainderGroup;
            expect(remainderGroup).toBeInstanceOf(FormArray);
            const taxiwayRemainder = component['scenarioDataForm'].get('taxiwayRemainder') as FormArray;
            expect(taxiwayRemainder).toBeTruthy();
            expect(remainderGroup).toBe(taxiwayRemainder);
        });
    });

    describe('addNewremainderGroup', () => {
        it('should add new remainder group when array length is less than 2', () => {
            fixture.detectChanges();

            expect(component.remainderGroup.length).toBe(0);

            component.addNewremainderGroup(0);
            expect(component.remainderGroup.length).toBe(1);

            component.addNewremainderGroup(1);
            expect(component.remainderGroup.length).toBe(2);
        });

        it('should not add new remainder group when array length is 2 or more', () => {
            fixture.detectChanges();

            component.addNewremainderGroup(0);
            component.addNewremainderGroup(1);
            expect(component.remainderGroup.length).toBe(2);

            component.addNewremainderGroup(2);
            expect(component.remainderGroup.length).toBe(2);
        });

        it('should create group with param values when provided', () => {
            fixture.detectChanges();

            const param: TaxiwayRemainderModel = {
                contaminationType: 'CONT1',
                coverage: 'COV1',
                depthUnits: 'INCHES',
                contDepth: 'DEPTH1'
            };

            component.addNewremainderGroup(0, param);

            const group = component.remainderGroup.at(0) as FormGroup;
            expect(group.get('contaminationType')?.value).toBe('CONT1');
            expect(group.get('coverage')?.value).toBe(''); // coverage is not patched in createremainderGroup
            expect(group.get('depthUnits')?.value).toBe('INCHES');
            expect(group.get('contDepth')?.value).toBe('DEPTH1');
        });

        it('should create group with empty values when param is not provided', () => {
            fixture.detectChanges();

            component.addNewremainderGroup(0);

            const group = component.remainderGroup.at(0) as FormGroup;
            expect(group.get('contaminationType')?.value).toBe('');
            expect(group.get('coverage')?.value).toBe('');
            expect(group.get('depthUnits')?.value).toBe('');
            expect(group.get('contDepth')?.value).toBe('');
        });

        it('should create group with partial param values', () => {
            fixture.detectChanges();

            const param: TaxiwayRemainderModel = {
                contaminationType: 'CONT1',
                depthUnits: 'INCHES',
                contDepth: 'DEPTH1'
            };

            component.addNewremainderGroup(0, param);

            const group = component.remainderGroup.at(0) as FormGroup;
            expect(group.get('contaminationType')?.value).toBe('CONT1');
            expect(group.get('coverage')?.value).toBe('');
            expect(group.get('depthUnits')?.value).toBe('INCHES');
            expect(group.get('contDepth')?.value).toBe('DEPTH1');
        });
    });

    describe('deleteremainderGroup', () => {
        it('should remove remainder group at specified index', () => {
            fixture.detectChanges();

            component.addNewremainderGroup(0);
            component.addNewremainderGroup(1);
            expect(component.remainderGroup.length).toBe(2);

            component.deleteremainderGroup(0);
            expect(component.remainderGroup.length).toBe(1);

            component.deleteremainderGroup(0);
            expect(component.remainderGroup.length).toBe(0);
        });

        it('should handle deletion when array is empty', () => {
            fixture.detectChanges();

            expect(() => component.deleteremainderGroup(0)).not.toThrow();
        });
    });

    describe('createremainderGroup', () => {
        it('should create FormGroup with all required controls', () => {
            fixture.detectChanges();

            const group = (component as any).createremainderGroup(0);

            expect(group).toBeInstanceOf(FormGroup);
            expect(group.get('contaminationType')).toBeTruthy();
            expect(group.get('coverage')).toBeTruthy();
            expect(group.get('depthUnits')).toBeTruthy();
            expect(group.get('contDepth')).toBeTruthy();
        });

        it('should patch values when param is provided', () => {
            fixture.detectChanges();

            const param: TaxiwayRemainderModel = {
                contaminationType: 'CONT1',
                depthUnits: 'INCHES',
                contDepth: 'DEPTH1'
            };

            const group = (component as any).createremainderGroup(0, param);

            expect(group.get('contaminationType')?.value).toBe('CONT1');
            expect(group.get('depthUnits')?.value).toBe('INCHES');
            expect(group.get('contDepth')?.value).toBe('DEPTH1');
        });

        it('should not patch values when param is not provided', () => {
            fixture.detectChanges();

            const group = (component as any).createremainderGroup(0);

            expect(group.get('contaminationType')?.value).toBe('');
            expect(group.get('coverage')?.value).toBe('');
            expect(group.get('depthUnits')?.value).toBe('');
            expect(group.get('contDepth')?.value).toBe('');
        });

        it('should subscribe to depthUnits valueChanges and call selectUnit when unit changes', () => {
            fixture.detectChanges();

            const group = (component as any).createremainderGroup(0);
            const depthUnitsControl = group.get('depthUnits');
            const contDepthControl = group.get('contDepth');

            contDepthControl?.setValue('DEPTH1');
            expect(contDepthControl?.value).toBe('DEPTH1');

            depthUnitsControl?.setValue('INCHES');

            expect(lookupCacheStore.selectUnit).toHaveBeenCalledWith({
                key: AIXM_TYPES.CONDITION_DEPTH,
                unit: 'INCHES',
                unitId: `${UNIT_IDS.RUNWAY_REMAINDER}0`
            });
            expect(contDepthControl?.value).toBe('');
        });

        it('should reset contDepth when depthUnits changes', () => {
            fixture.detectChanges();

            const group = (component as any).createremainderGroup(0);
            const depthUnitsControl = group.get('depthUnits');
            const contDepthControl = group.get('contDepth');

            contDepthControl?.setValue('DEPTH1');
            depthUnitsControl?.setValue('CENTIMETERS');

            expect(contDepthControl?.value).toBe('');
        });

        it('should not call selectUnit when depthUnits is empty', () => {
            fixture.detectChanges();

            const group = (component as any).createremainderGroup(0);
            const depthUnitsControl = group.get('depthUnits');

            depthUnitsControl?.setValue('');

            expect(lookupCacheStore.selectUnit).not.toHaveBeenCalled();
        });

        it('should set up contDepth$ observable for the index', () => {
            fixture.detectChanges();

            const group = (component as any).createremainderGroup(0);

            expect(component.contDepth$[0]).toBeDefined();
            expect(lookupCacheStore.getFilteredByUnit).toHaveBeenCalledWith(
                AIXM_TYPES.CONDITION_DEPTH,
                `${UNIT_IDS.RUNWAY_REMAINDER}0`
            );
        });

        it('should set up contDepth$ observable for different indices', () => {
            fixture.detectChanges();

            (component as any).createremainderGroup(0);
            (component as any).createremainderGroup(1);

            expect(component.contDepth$[0]).toBeDefined();
            expect(component.contDepth$[1]).toBeDefined();
            expect(lookupCacheStore.getFilteredByUnit).toHaveBeenCalledWith(
                AIXM_TYPES.CONDITION_DEPTH,
                `${UNIT_IDS.RUNWAY_REMAINDER}0`
            );
            expect(lookupCacheStore.getFilteredByUnit).toHaveBeenCalledWith(
                AIXM_TYPES.CONDITION_DEPTH,
                `${UNIT_IDS.RUNWAY_REMAINDER}1`
            );
        });

        it('should handle multiple depthUnits changes', () => {
            fixture.detectChanges();

            const group = (component as any).createremainderGroup(0);
            const depthUnitsControl = group.get('depthUnits');
            const contDepthControl = group.get('contDepth');

            depthUnitsControl?.setValue('INCHES');
            contDepthControl?.setValue('DEPTH1');
            depthUnitsControl?.setValue('CENTIMETERS');

            expect(lookupCacheStore.selectUnit).toHaveBeenCalledTimes(2);
            expect(contDepthControl?.value).toBe('');
        });
    });

    describe('buildForm', () => {
        it('should create scenarioDataForm reference from parent form', () => {
            fixture.detectChanges();

            expect(component['scenarioDataForm']).toBeTruthy();
            expect(component['scenarioDataForm']).toBe(parentForm.get('scenarioData') as FormGroup);
        });

        it('should add taxiwayRemainder FormArray to scenarioData form', () => {
            fixture.detectChanges();

            const scenarioData = parentForm.get('scenarioData') as FormGroup;
            const taxiwayRemainder = scenarioData.get('taxiwayRemainder');
            expect(taxiwayRemainder).toBeTruthy();
            expect(taxiwayRemainder).toBeInstanceOf(FormArray);
        });

        it('should initialize taxiwayRemainder as empty FormArray', () => {
            fixture.detectChanges();

            const taxiwayRemainder = component['scenarioDataForm'].get('taxiwayRemainder') as FormArray;
            expect(taxiwayRemainder.length).toBe(0);
        });
    });

    describe('Form Control Integration', () => {
        it('should allow setting and getting form control values', () => {
            fixture.detectChanges();

            component.addNewremainderGroup(0);
            const group = component.remainderGroup.at(0) as FormGroup;

            group.get('contaminationType')?.setValue('CONT1');
            group.get('coverage')?.setValue('COV1');
            group.get('depthUnits')?.setValue('INCHES');
            group.get('contDepth')?.setValue('DEPTH1');

            expect(group.get('contaminationType')?.value).toBe('CONT1');
            expect(group.get('coverage')?.value).toBe('COV1');
            expect(group.get('depthUnits')?.value).toBe('INCHES');
            expect(group.get('contDepth')?.value).toBe('DEPTH1');
        });

        it('should maintain form control state after value changes', () => {
            fixture.detectChanges();

            component.addNewremainderGroup(0);
            const group = component.remainderGroup.at(0) as FormGroup;
            const contaminationTypeControl = group.get('contaminationType');

            contaminationTypeControl?.setValue('CONT1');
            expect(contaminationTypeControl?.value).toBe('CONT1');
            expect(contaminationTypeControl?.valid).toBeTruthy();

            contaminationTypeControl?.setValue('');
            expect(contaminationTypeControl?.value).toBe('');
        });
    });

    describe('LookupCacheStore Integration', () => {
        it('should fetch lookup data on initialization', () => {
            fixture.detectChanges();

            expect(lookupCacheStore.fetchAixmKeyLookup).toHaveBeenCalled();
            expect(lookupCacheStore.getAixmKeyLookup).toHaveBeenCalled();
            expect(lookupCacheStore.getDepthUnits).toHaveBeenCalled();
        });

        it('should use correct AIXM type constants', () => {
            fixture.detectChanges();

            expect(lookupCacheStore.fetchAixmKeyLookup).toHaveBeenCalledWith(AIXM_TYPES.CONTAMINATION_TYPE);
            expect(lookupCacheStore.fetchAixmKeyLookup).toHaveBeenCalledWith(AIXM_TYPES.COVERAGE_FOR);
            expect(lookupCacheStore.fetchAixmKeyLookup).toHaveBeenCalledWith(AIXM_TYPES.CONDITION_DEPTH);
            expect(lookupCacheStore.getAixmKeyLookup).toHaveBeenCalledWith(AIXM_TYPES.CONTAMINATION_TYPE);
            expect(lookupCacheStore.getAixmKeyLookup).toHaveBeenCalledWith(AIXM_TYPES.COVERAGE_FOR);
            expect(lookupCacheStore.getDepthUnits).toHaveBeenCalledWith(AIXM_TYPES.CONDITION_DEPTH);
        });

        it('should handle empty lookup results', (done) => {
            lookupCacheStore.getAixmKeyLookup.and.returnValue(of([]));
            lookupCacheStore.getDepthUnits.and.returnValue(of([]));

            fixture.detectChanges();

            component.contaminationTypes$!.subscribe((types) => {
                expect(types).toEqual([]);
                done();
            });
        });

        it('should call selectUnit with correct parameters when depthUnits changes', () => {
            fixture.detectChanges();

            component.addNewremainderGroup(0);
            const group = component.remainderGroup.at(0) as FormGroup;
            const depthUnitsControl = group.get('depthUnits');

            depthUnitsControl?.setValue('INCHES');

            expect(lookupCacheStore.selectUnit).toHaveBeenCalledWith({
                key: AIXM_TYPES.CONDITION_DEPTH,
                unit: 'INCHES',
                unitId: `${UNIT_IDS.RUNWAY_REMAINDER}0`
            });
        });

        it('should call getFilteredByUnit with correct parameters', () => {
            fixture.detectChanges();

            component.addNewremainderGroup(0);
            component.addNewremainderGroup(1);

            expect(lookupCacheStore.getFilteredByUnit).toHaveBeenCalledWith(
                AIXM_TYPES.CONDITION_DEPTH,
                `${UNIT_IDS.RUNWAY_REMAINDER}0`
            );
            expect(lookupCacheStore.getFilteredByUnit).toHaveBeenCalledWith(
                AIXM_TYPES.CONDITION_DEPTH,
                `${UNIT_IDS.RUNWAY_REMAINDER}1`
            );
        });
    });

    describe('Edge Cases', () => {
        it('should handle model with undefined taxiwayRemainder', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    taxiwayRemainder: undefined as any
                }
            };

            fixture.componentRef.setInput('model', mockModel);

            expect(() => {
                fixture.detectChanges();
            }).not.toThrow();

            expect(component.remainderGroup.length).toBe(0);
        });

        it('should handle adding groups up to maximum limit', () => {
            fixture.detectChanges();

            component.addNewremainderGroup(0);
            component.addNewremainderGroup(1);
            expect(component.remainderGroup.length).toBe(2);

            component.addNewremainderGroup(2);
            component.addNewremainderGroup(3);
            expect(component.remainderGroup.length).toBe(2);
        });

        it('should handle deletion of all groups', () => {
            fixture.detectChanges();

            component.addNewremainderGroup(0);
            component.addNewremainderGroup(1);
            expect(component.remainderGroup.length).toBe(2);

            component.deleteremainderGroup(1);
            component.deleteremainderGroup(0);
            expect(component.remainderGroup.length).toBe(0);
        });

        it('should handle depthUnits valueChanges subscription cleanup', () => {
            fixture.detectChanges();

            const group = (component as any).createremainderGroup(0);
            const depthUnitsControl = group.get('depthUnits');

            depthUnitsControl?.setValue('INCHES');
            expect(lookupCacheStore.selectUnit).toHaveBeenCalled();

            lookupCacheStore.selectUnit.calls.reset();
            depthUnitsControl?.setValue('CENTIMETERS');
            expect(lookupCacheStore.selectUnit).toHaveBeenCalled();
        });
    });
});
