const { Router } = require('express');
const { initiateSignup, verifySignupOtp, login, forgotPassword, verifyForgotOtp, resetPassword } = require('../Controllers/AuthController');
const { signupValidation, loginValidation } = require('../Middlewares/AuthValidation');

const router = Router();

router.post('/signup', signupValidation, initiateSignup);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-forgot-otp', verifyForgotOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
