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
            
            // Initially both are empty, so both have required validators (else branch)
            // Now we trigger the else if branch by setting frequency with value, phone empty
            phone.setValue('', { emitEvent: false })
            frequency.setValue('108.5')
            tick()
            
            // Verify the result of lines 115-116 executing:
            // Line 115: frequency.setValidators([Validators.required]) 
            // Line 116: agencyPhoneNumber.clearValidators()
            
            // Check frequency still has required (should fail when empty)
            frequency.setValue('')
            expect(frequency.hasError('required')).toBeTrue()
            
            // Check phone has NO validators (should be valid even when empty)
            phone.setValue('')
            expect(phone.valid).toBeTrue()

        }))
