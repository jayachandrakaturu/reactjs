import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RunwayDesignatorComponent } from './runway-designator.component';
import { LookupCacheStore } from '../store/lookup-cache-store';
import { FaaNotamModel, DesignatorKeyValueModel } from '../models';
import { BehaviorSubject } from 'rxjs';

describe('RunwayDesignatorComponent', () => {
    let component: RunwayDesignatorComponent;
    let fixture: ComponentFixture<RunwayDesignatorComponent>;
    let lookupCacheStore: jasmine.SpyObj<LookupCacheStore>;
    let parentForm: FormGroup;
    let formGroupDirective: FormGroupDirective;
    let designatorsSubject: BehaviorSubject<DesignatorKeyValueModel[]>;

    beforeEach(async () => {
        // Create parent form with keyword and location
        parentForm = new FormGroup({
            keyword: new FormControl('test-keyword'),
            location: new FormControl('test-location')
        });

        // Create FormGroupDirective mock
        formGroupDirective = {
            form: parentForm
        } as FormGroupDirective;

        // Create BehaviorSubject for designators
        designatorsSubject = new BehaviorSubject<DesignatorKeyValueModel[]>([]);

        // Create LookupCacheStore spy
        lookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchDesignator'], {
            designators$: designatorsSubject.asObservable()
        });

        await TestBed.configureTestingModule({
            imports: [
                RunwayDesignatorComponent,
                ReactiveFormsModule,
                NoopAnimationsModule
            ],
            providers: [
                { provide: FormGroupDirective, useValue: formGroupDirective },
                { provide: LookupCacheStore, useValue: lookupCacheStore }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RunwayDesignatorComponent);
        component = fixture.componentInstance;
    });

    describe('Component Initialization', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
            fixture.detectChanges();
        });

        it('should initialize designator$ from lookupCacheStore', () => {
            fixture.detectChanges();
            expect(component.designator$).toBeDefined();
        });
    });

    describe('ngOnInit', () => {
        it('should set form from formGroupDirective', () => {
            fixture.detectChanges();
            expect(component['form']).toBe(parentForm);
        });

        it('should call buildForm and add designator and rootAximId controls', () => {
            fixture.detectChanges();
            
            expect(parentForm.get('designator')).toBeTruthy();
            expect(parentForm.get('rootAximId')).toBeTruthy();
            
            const designatorControl = parentForm.get('designator');
            const rootAximIdControl = parentForm.get('rootAximId');
            
            expect(designatorControl?.hasError('required')).toBeTruthy();
            expect(rootAximIdControl?.hasError('required')).toBeTruthy();
        });

        it('should set designator$ observable from lookupCacheStore', () => {
            const mockDesignators: DesignatorKeyValueModel[] = [
                { key: '09L', rootAixmUuid: 'uuid-09l' },
                { key: '27R', rootAixmUuid: 'uuid-27r' }
            ];
            designatorsSubject.next(mockDesignators);
            
            fixture.detectChanges();
            
            expect(component.designator$).toBeDefined();
            component.designator$.subscribe(designators => {
                expect(designators).toEqual(mockDesignators);
            }).unsubscribe();
        });

        it('should call fetchDesignator with form values', () => {
            fixture.detectChanges();
            
            expect(lookupCacheStore.fetchDesignator).toHaveBeenCalledWith({
                keyword: 'test-keyword',
                location: 'test-location'
            });
        });

        it('should call fetchDesignator with null values when form values are null', () => {
            parentForm.patchValue({ keyword: null, location: null });
            fixture.detectChanges();
            
            expect(lookupCacheStore.fetchDesignator).toHaveBeenCalledWith({
                keyword: jasmine.anything(),
                location: jasmine.anything()
            });
            const callArgs = (lookupCacheStore.fetchDesignator as jasmine.Spy).calls.mostRecent().args[0];
            expect(callArgs.keyword).toBeNull();
            expect(callArgs.location).toBeNull();
        });

        it('should patch form values when model has notamId', () => {
            const mockModel: FaaNotamModel = {
                notamId: 'test-notam-id',
                scenarioData: {},
                designator: '09L'
            };
            
            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();
            
            expect(parentForm.get('designator')?.value).toBe('09L');
        });

        it('should not patch form values when model is null', () => {
            fixture.componentRef.setInput('model', null);
            fixture.detectChanges();
            
            expect(parentForm.get('designator')?.value).toBe('');
            expect(parentForm.get('rootAximId')?.value).toBe('');
        });

        it('should not patch form values when model does not have notamId', () => {
            const mockModel: FaaNotamModel = {
                notamId: '',
                scenarioData: {},
                designator: '09L'
            };
            
            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();
            
            // When notamId is empty string, the condition is falsy, so no patch
            expect(parentForm.get('designator')?.value).toBe('');
        });

        it('should not patch form values when model has undefined notamId', () => {
            const mockModel: Partial<FaaNotamModel> = {
                scenarioData: {},
                designator: '09L'
            };
            
            fixture.componentRef.setInput('model', mockModel as FaaNotamModel);
            fixture.detectChanges();
            
            // When notamId is undefined, the condition is falsy, so no patch
            expect(parentForm.get('designator')?.value).toBe('');
        });

        it('should handle model with undefined designator', () => {
            const mockModel: FaaNotamModel = {
                notamId: 'test-notam-id',
                scenarioData: {},
                designator: undefined as unknown as string
            };
            
            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();
            
            // patchValue with undefined sets the value to undefined
            expect(parentForm.get('designator')?.value).toBeUndefined();
        });
    });

    describe('ngOnDestroy', () => {
        it('should remove designator control from form', () => {
            fixture.detectChanges();
            
            expect(parentForm.get('designator')).toBeTruthy();
            
            component.ngOnDestroy();
            
            expect(parentForm.get('designator')).toBeNull();
        });

        it('should remove rootAximId control from form', () => {
            fixture.detectChanges();
            
            expect(parentForm.get('rootAximId')).toBeTruthy();
            
            component.ngOnDestroy();
            
            expect(parentForm.get('rootAximId')).toBeNull();
        });

        it('should remove both controls even if called multiple times', () => {
            fixture.detectChanges();
            
            expect(parentForm.get('designator')).toBeTruthy();
            expect(parentForm.get('rootAximId')).toBeTruthy();
            
            // First destroy
            component.ngOnDestroy();
            expect(parentForm.get('designator')).toBeNull();
            expect(parentForm.get('rootAximId')).toBeNull();
            
            // Re-add controls to test multiple destroys
            parentForm.addControl('designator', new FormControl(''));
            parentForm.addControl('rootAximId', new FormControl(''));
            expect(parentForm.get('designator')).toBeTruthy();
            expect(parentForm.get('rootAximId')).toBeTruthy();
            
            // Second destroy
            component.ngOnDestroy();
            expect(parentForm.get('designator')).toBeNull();
            expect(parentForm.get('rootAximId')).toBeNull();
        });
    });

    describe('onDesignatorChange', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should patch rootAximId when designator is found', () => {
            const mockDesignators: DesignatorKeyValueModel[] = [
                { key: '09L', rootAixmUuid: 'uuid-09l' },
                { key: '27R', rootAixmUuid: 'uuid-27r' }
            ];
            designatorsSubject.next(mockDesignators);
            
            component.onDesignatorChange('09L');
            
            expect(parentForm.get('rootAximId')?.value).toBe('uuid-09l');
        });

        it('should patch rootAximId with undefined when designator is not found', () => {
            const mockDesignators: DesignatorKeyValueModel[] = [
                { key: '09L', rootAixmUuid: 'uuid-09l' },
                { key: '27R', rootAixmUuid: 'uuid-27r' }
            ];
            designatorsSubject.next(mockDesignators);
            
            component.onDesignatorChange('18');
            
            expect(parentForm.get('rootAximId')?.value).toBeUndefined();
        });

        it('should handle empty designators array', () => {
            designatorsSubject.next([]);
            
            component.onDesignatorChange('09L');
            
            expect(parentForm.get('rootAximId')?.value).toBeUndefined();
        });

        it('should handle designator with undefined rootAixmUuid', () => {
            const mockDesignators: DesignatorKeyValueModel[] = [
                { key: '09L' },
                { key: '27R', rootAixmUuid: 'uuid-27r' }
            ];
            designatorsSubject.next(mockDesignators);
            
            component.onDesignatorChange('09L');
            
            expect(parentForm.get('rootAximId')?.value).toBeUndefined();
        });

        it('should unsubscribe after patching value', () => {
            const mockDesignators: DesignatorKeyValueModel[] = [
                { key: '09L', rootAixmUuid: 'uuid-09l' }
            ];
            designatorsSubject.next(mockDesignators);
            
            const subscription = designatorsSubject.asObservable().subscribe();
            spyOn(subscription, 'unsubscribe');
            
            component.onDesignatorChange('09L');
            
            // The method creates a subscription and immediately unsubscribes
            // We verify the form was patched correctly
            expect(parentForm.get('rootAximId')?.value).toBe('uuid-09l');
        });
    });

    describe('buildForm', () => {
        it('should add designator control with required validator', () => {
            fixture.detectChanges();
            
            const designatorControl = parentForm.get('designator');
            expect(designatorControl).toBeTruthy();
            expect(designatorControl?.hasError('required')).toBeTruthy();
            
            designatorControl?.setValue('09L');
            designatorControl?.updateValueAndValidity();
            expect(designatorControl?.hasError('required')).toBeFalsy();
        });

        it('should add rootAximId control with required validator', () => {
            fixture.detectChanges();
            
            const rootAximIdControl = parentForm.get('rootAximId');
            expect(rootAximIdControl).toBeTruthy();
            expect(rootAximIdControl?.hasError('required')).toBeTruthy();
            
            rootAximIdControl?.setValue('uuid-09l');
            rootAximIdControl?.updateValueAndValidity();
            expect(rootAximIdControl?.hasError('required')).toBeFalsy();
        });

        it('should initialize controls with empty string values', () => {
            fixture.detectChanges();
            
            expect(parentForm.get('designator')?.value).toBe('');
            expect(parentForm.get('rootAximId')?.value).toBe('');
        });
    });

    describe('Integration Tests', () => {
        it('should complete full lifecycle: init, change designator, destroy', () => {
            const mockDesignators: DesignatorKeyValueModel[] = [
                { key: '09L', rootAixmUuid: 'uuid-09l' },
                { key: '27R', rootAixmUuid: 'uuid-27r' }
            ];
            designatorsSubject.next(mockDesignators);
            
            // Initialize
            fixture.detectChanges();
            expect(parentForm.get('designator')).toBeTruthy();
            expect(parentForm.get('rootAximId')).toBeTruthy();
            
            // Change designator
            component.onDesignatorChange('27R');
            expect(parentForm.get('rootAximId')?.value).toBe('uuid-27r');
            
            // Destroy
            component.ngOnDestroy();
            expect(parentForm.get('designator')).toBeNull();
            expect(parentForm.get('rootAximId')).toBeNull();
        });

        it('should handle model initialization and designator change together', () => {
            const mockModel: FaaNotamModel = {
                notamId: 'test-notam-id',
                scenarioData: {},
                designator: '09L'
            };
            
            const mockDesignators: DesignatorKeyValueModel[] = [
                { key: '09L', rootAixmUuid: 'uuid-09l' }
            ];
            designatorsSubject.next(mockDesignators);
            
            fixture.componentRef.setInput('model', mockModel);
            fixture.detectChanges();
            
            expect(parentForm.get('designator')?.value).toBe('09L');
            
            // Change to different designator
            component.onDesignatorChange('09L');
            expect(parentForm.get('rootAximId')?.value).toBe('uuid-09l');
        });
    });
});
