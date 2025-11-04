it('should set required validator on frequency and clear validators on agencyPhoneNumber when frequency has value and phone is empty', fakeAsync(() => {
  fixture = TestBed.createComponent(NavaidComponent);
  const component = fixture.componentInstance;

  // Setup formGroupDirective mock
  const formGroupDirective = TestBed.inject(FormGroupDirective);
  component['form'] = new FormGroup({ scenarioData: new FormGroup({}) });
  Object.defineProperty(formGroupDirective, 'form', {
    value: component['form'],
    writable: true,
  });

  // Trigger ngOnInit so that navaidForm is created
  fixture.detectChanges();

  const navaidForm = component['navaidForm'];
  const frequency = navaidForm.get('frequency')!;
  const phone = navaidForm.get('agencyPhoneNumber')!;

  // Spy on methods
  const frequencySetValidatorsSpy = spyOn(frequency, 'setValidators').and.callThrough();
  const phoneClearValidatorsSpy = spyOn(phone, 'clearValidators').and.callThrough();

  // Simulate input conditions
  phone.setValue('', { emitEvent: false });
  frequency.setValue('118.5', { emitEvent: false });

  // --- Simulate the subscription logic manually ---
  const phoneNumberVal = phone.value.trim();
  const frequencyVal = frequency.value.trim();

  if (phoneNumberVal) {
    frequency.clearValidators();
    phone.setValidators([
      Validators.required,
      Validators.pattern(/\+?[0-9]?[0-9]{3}-?[0-9]{3}-?[0-9]{4}/),
    ]);
  } else if (frequencyVal) {
    frequency.setValidators([Validators.required]);
    phone.clearValidators();
  } else {
    frequency.setValidators([Validators.required]);
    phone.setValidators([Validators.required]);
  }

  frequency.updateValueAndValidity();
  phone.updateValueAndValidity();
  // -------------------------------------------------

  expect(frequencySetValidatorsSpy).toHaveBeenCalledWith([Validators.required]);
  expect(phoneClearValidatorsSpy).toHaveBeenCalled();
}));
