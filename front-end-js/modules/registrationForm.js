import axios from 'axios';

export default class RegistrationForm {
  constructor() {
    this.form = document.querySelector('#registration-form'),
    this.allFields = document.querySelectorAll('#registration-form .form-control');
    this.insertValidationElements();
    this.username = document.querySelector('#username-register');
    this.username.previousValue ='';
    this.email = document.querySelector('#email-register');
    this.email.previousValue = '';
    this.password = document.querySelector('#password-register');
    this.password.previousValue = '';
    this.passwordConfirm = document.querySelector('#password-register-confirm');
    this.passwordConfirm.previousValue = '';
    this.username.isUnique = false;
    this.email.isUnique = false;
    this.events();
  };  

  // Events
  events() {
    this.form.addEventListener('submit', e => {
      e.preventDefault();
      this.formSubmitHandler();
    });

    this.username.addEventListener('keyup', () => {
      this.isDifferent(this.username, this.usernameHandler)
    });

    this.email.addEventListener('keyup', () => {
      this.isDifferent(this.email, this.emailHandler)
    });

    this.password.addEventListener('keyup', () => {
      this.isDifferent(this.password, this.passwordHandler)
    });

    this.passwordConfirm.addEventListener('keyup', () => {
      this.isDifferent(this.passwordConfirm, this.passwordConfirmHandler)
    });

    this.username.addEventListener('blur', () => {
      this.isDifferent(this.username, this.usernameHandler)
    });

    this.email.addEventListener('blur', () => {
      this.isDifferent(this.email, this.emailHandler)
    });

    this.password.addEventListener('blur', () => {
      this.isDifferent(this.password, this.passwordHandler)
    });

    this.passwordConfirm.addEventListener('blur', () => {
      this.isDifferent(this.passwordConfirm, this.passwordConfirmHandler)
    });
  };

  // Methods
  isDifferent(el, handler) {
    if (el.previousValue !=el.value) {
      handler.call(this);
    }
    el.previousValue = el.value;
  };

  usernameHandler() {
    this.username.errors = false;
    this.usernameImmediately();
    clearTimeout(this.username.timer)
    this.username.timer = setTimeout(() => this.usernameAfterDelay(), 700);
  };

  emailHandler() {
    this.email.errors = false;
    clearTimeout(this.email.timer)
    this.email.timer = setTimeout(() => this.emailAfterDelay(), 800);
  };

  passwordHandler() {
    this.password.errors = false;
    this.passwordImmediately();
    clearTimeout(this.password.timer)
    this.password.timer = setTimeout(() => this.passwordAfterDelay(), 700);
  };

  passwordConfirmHandler() {
    this.passwordConfirm.errors = false;
    clearTimeout(this.passwordConfirm.timer)
    this.passwordConfirm.timer = setTimeout(() => this.passwordConfirmAfterDelay(), 700);
  };

  formSubmitHandler() {
    this.usernameImmediately();
    this.usernameAfterDelay();
    this.emailAfterDelay();
    this.passwordImmediately();
    this.passwordAfterDelay();
    this.passwordConfirmAfterDelay();

    if (
        this.username.isUnique && 
        !this.username.errors && 
        this.email.isUnique &&
        !this.email.errors &&
        !this.password.errors &&
        !this.passwordConfirm.errors
      ) {
      this.form.submit();
    };
  };

  usernameImmediately() {
    if (this.username.value != '' && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
      this.showValidationError(this.username, 'Username can only contain letters and numbers')
    };

    if (this.username.value.length > 20) {
      this.showValidationError(this.username, 'Username cannot exceed 20 characters');
    };


    if (!this.username.errors) {
      this.hideValidationError(this.username);
    };
  };

  passwordImmediately() {
    if (this.password.value.length > 30) {
      this.showValidationError(this.password, 'Passwords cannot exceed 30 charavters')
    };

    if (!this.password.errors) {
      this.hideValidationError(this.password)
    };
  };

  emailAfterDelay() {
    if (!/^\S+@\S+$/.test(this.email.value)) {
      this.showValidationError(this.email, "You must provide a valid email address");
    };

    if (!this.email.errors) {
      axios.post('/doesemailexist', {email: this.email.value}).then((response) => {
        if (response.data) {
          this.email.isUnique = false;
          this.showValidationError(this.email, 'This email is already linked to an account');          
        } else {
          this.email.isUnique = true;
          this.hideValidationError(this.email);
        };

      }).catch(() => {
        console.log('Please try again later')
      });
    };
  };

  passwordAfterDelay() {
    if (this.password.value.length < 8) {
      this.showValidationError(this.password, 'Passwords must contain at least 8 characters')
    };
  };

  passwordConfirmAfterDelay() {
    if (this.passwordConfirm.value != this.password.value) {
      this.showValidationError(this.passwordConfirm, 'Password Confirmation does not match Password')
    };
  };
  
  showValidationError(el, message) {
    el.nextElementSibling.innerHTML = message;
    el.nextElementSibling.classList.add('liveValidateMessage--visible');
    el.errors = true;
  };

  hideValidationError(el) {
    el.nextElementSibling.classList.remove('liveValidateMessage--visible');
  };

  usernameAfterDelay() {
    if (this.username.value.length < 3) {
      this.showValidationError(this.username, 'Username must contain at least 3 characters')
    };

    if (!this.username.errors) {
      axios.post('/doesusernameexist', {username: this.username.value}).then((response) => {
        if (response.data) {
          this.showValidationError(this.username, 'This username is already taken');
          this.username.isUnique = false;
        } else {
          this.username.isUnique = true;
        };
      }).catch(() => {
        console.log ('Please try again later');
      });
    };
  };

  insertValidationElements() {
    this.allFields.forEach(function (el) {
      el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>');
    });
  };
};