import Search from './modules/search';
import RegistrationForm from './modules/registrationForm';

if (document.querySelector('#registration-form')) {
  new RegistrationForm()
};

if (document.querySelector('.header-search-icon')) {new Search()};