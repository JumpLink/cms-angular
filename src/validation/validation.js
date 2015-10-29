angular.module('jumplink.cms.validation', [
  'validation',                               // https://github.com/huei90/angular-validation
  'validation.rule',                          // https://github.com/huei90/angular-validation
])
.provider('jlValidation', function jlValidationProvider($validationProvider) {
  this.getLocale = function () {
    var defaultMsg = {
      "minlength": $validationProvider.getDefaultMsg('minlength'),
      "maxlength": $validationProvider.getDefaultMsg('maxlength'),
      "required": $validationProvider.getDefaultMsg('required'),
      "email": $validationProvider.getDefaultMsg('email'),
      "number": $validationProvider.getDefaultMsg('number'),
      "url": $validationProvider.getDefaultMsg('url'),
    };
    return defaultMsg;
  };
  this.changeLocale = function (lang) {
    var defaultMsg = {};
    switch(lang) {
      case 'de':
        defaultMsg = {
          'minlength': {
            error: "Eingabe muss länger sein!",
            success: "Eingabe lang genug"
          },
          'maxlength': {
            error: "Eingabe muss kürzer sein!",
            success: "Eingabe kurz genug"
          },
          'required': {
            error: "Eine Eingabe ist erforderlich!",
            success: "Okay"
          },
          'email': {
            error: "Eingabe muss einer E-Mail entsprechen!",
            success: "Eingabe ist eine E-Mail"
          },
          'number': {
            error: "Eingabe darf nur Zahlen enthalten!",
            success: "Eingabe enthält nur Zahlen"
          },
          'url': {
            error: "Eingabe muss einer URL entsprechen!",
            success: "Eingabe entspricht einer URL"
          },
        };
      break;
      case 'en':
      break;
      default:
      break;
    }
    switch(lang) {
      case 'de':
        $validationProvider.setDefaultMsg(defaultMsg);
      break;
      case 'en':
        // do nothing
      break;
      default:
        // do nothing
      break;
    }
  };
  this.$get = function jlValidationFactory() {
    // let's assume that the UnicornLauncher constructor was also changed to
    // accept and use the useTinfoilShielding argument
    return new jlValidation();
  };
});