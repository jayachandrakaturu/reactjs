it('should set required validator on frequency and clear validators on agencyPhoneNumber when frequency has value and phone is empty', fakeAsync(() => {
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

  // Set initial empty values to trigger correct branch
  phone.setValue('')
  frequency.setValue('118.5')
  fixture.detectChanges()
  tick()

  // Spy *after* detectChanges so it captures the reactive subscription's next call
  const frequencySetValidatorsSpy = spyOn(frequency, 'setValidators').and.callThrough()
  const phoneClearValidatorsSpy = spyOn(phone, 'clearValidators').and.callThrough()

  // Trigger the component’s internal logic again by simulating another frequency change
  frequency.setValue('119.5')
  tick()

  expect(frequencySetValidatorsSpy).toHaveBeenCalledWith([Validators.required])
  expect(phoneClearValidatorsSpy).toHaveBeenCalled()
}))
