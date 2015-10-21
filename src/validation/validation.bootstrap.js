angular.module('jumplink.cms.bootstrap.validation', [
  'jumplink.cms.validation',
])
.provider('jlValidationBootstrap', function jlValidationBootstrapProvider(jlValidationProvider, $validationProvider) {
  this.setup = function () {
    $validationProvider.setErrorHTML(function (msg) {
      return "<span ng-show='form.name.$error.required' class='form-control-feedback'><i class='fa fa-exclamation-triangle'></i></span><label class=\"control-label has-error absolute-control-label-bottom\">" + msg + "</label>";
    });
    $validationProvider.setSuccessHTML(function (msg) {
      return "<span class='form-control-feedback'><i class='fa fa-check'></i></span><label class=\"control-label has-success absolute-control-label-bottom\">" + msg + "</label>";
    });
    angular.extend($validationProvider, {
      validCallback: function (element){
        $(element).parents('.form-group:first').removeClass('has-error').addClass('has-success');
      },
      invalidCallback: function (element) {
        $(element).parents('.form-group:first').removeClass('has-success').addClass('has-error');
      }
    });
  };
  this.getLocale = jlValidationProvider.getLocale;
  this.changeLocale = jlValidationProvider.changeLocale;
  this.$get = function jlValidationBootstrapFactory() {
    // let's assume that the UnicornLauncher constructor was also changed to
    // accept and use the useTinfoilShielding argument
    return new jlValidationBootstrap();
  };
});