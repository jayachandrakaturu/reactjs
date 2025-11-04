  it('should clear agencyPhoneNumber validators when frequency has value and phone is empty', fakeAsync(() => {
            Object.assign(cacheStore, {
                navaidList$: of([]),
            })
            fixture = TestBed.createComponent(NavaidComponent)
            component = fixture.componentInstance
            component['form'] = new FormGroup({
                scenarioData: new FormGroup({}),
            })
            const formGroupDirective = TestBed.inject(FormGroupDirective)
            Object.defineProperty(formGroupDirective, 'form', {
                value: component['form'],
                writable: true,
            })

            fixture.detectChanges()
            
            const navaidForm = component['navaidForm']
            const frequency = navaidForm.get('frequency')!
            const phone = navaidForm.get('agencyPhoneNumber')!
            
            // Stub updateValueAndValidity on THESE SPECIFIC controls only to prevent infinite loop
            spyOn(frequency, 'updateValueAndValidity').and.stub()
            spyOn(phone, 'updateValueAndValidity').and.stub()
            
            // Spy on the validator methods to track the specific call we want
            const frequencySetValidatorsSpy = spyOn(frequency, 'setValidators').and.callThrough()
            const phoneClearValidatorsSpy = spyOn(phone, 'clearValidators').and.callThrough()
            
            // Trigger the else if branch: phone empty, frequency has value
            phone.setValue('', { emitEvent: false })
            frequency.setValue('108.5', { emitEvent: true })
            tick()
            
            // Verify that the else if branch methods were called (lines 115-116)
            expect(frequencySetValidatorsSpy).toHaveBeenCalledWith([Validators.required])
            expect(phoneClearValidatorsSpy).toHaveBeenCalled()

        }))
