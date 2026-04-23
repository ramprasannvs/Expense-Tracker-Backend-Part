const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require("../Models/User");
const { generateOTP, sendOTPEmail } = require('../utils/email');

// Step 1: Initiate signup (send OTP)
const initiateSignup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await UserModel.findOne({ email, isVerified: true });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered. Please login.', success: false });
        }

        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        // Remove any unverified user with this email
        await UserModel.deleteOne({ email, isVerified: false });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new UserModel({
            name, email,
            password: hashedPassword,
            isVerified: false,
            otp: { code: otp, expiresAt: otpExpiresAt, purpose: 'signup' }
        });
        await newUser.save();

        const emailSent = await sendOTPEmail(email, otp, 'signup');
        if (!emailSent) {
            // For dev: return OTP in response
            return res.status(200).json({
                message: 'OTP generated (email failed - check server logs)',
                success: true,
                devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
            });
        }

        res.status(200).json({ message: 'OTP sent to your email. Please verify.', success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Step 2: Verify OTP and complete signup
const verifySignupOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await UserModel.findOne({ email, isVerified: false });

        if (!user) {
            return res.status(404).json({ message: 'User not found. Please register again.', success: false });
        }
        if (!user.otp || user.otp.purpose !== 'signup') {
            return res.status(400).json({ message: 'No pending OTP for signup.', success: false });
        }
        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({ message: 'OTP has expired. Please register again.', success: false });
        }
        if (user.otp.code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.', success: false });
        }

        user.isVerified = true;
        user.otp = undefined;
        await user.save();

        res.status(201).json({ message: 'Email verified! Registration successful.', success: true });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        const errorMsg = 'Auth failed: email or password is wrong';

        if (!user) return res.status(403).json({ message: errorMsg, success: false });
        if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first.', success: false });

        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) return res.status(403).json({ message: errorMsg, success: false });

        const jwtToken = jwt.sign(
            { email: user.email, _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login Success",
            success: true,
            jwtToken,
            email,
            name: user.name
        });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Forgot password: send OTP
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ email, isVerified: true });
        if (!user) {
            return res.status(404).json({ message: 'No verified account found with this email.', success: false });
        }

        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        user.otp = { code: otp, expiresAt: otpExpiresAt, purpose: 'forgot' };
        await user.save();

        const emailSent = await sendOTPEmail(email, otp, 'forgot');
        if (!emailSent) {
            return res.status(200).json({
                message: 'OTP generated (email failed)',
                success: true,
                devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
            });
        }

        res.status(200).json({ message: 'Password reset OTP sent to your email.', success: true });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Verify forgot password OTP
const verifyForgotOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await UserModel.findOne({ email, isVerified: true });

        if (!user) return res.status(404).json({ message: 'User not found.', success: false });
        if (!user.otp || user.otp.purpose !== 'forgot') {
            return res.status(400).json({ message: 'No pending reset OTP.', success: false });
        }
        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({ message: 'OTP has expired.', success: false });
        }
        if (user.otp.code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.', success: false });
        }

        // Issue a temporary token for password reset
        const resetToken = jwt.sign({ email, _id: user._id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
        user.otp = undefined;
        await user.save();

        res.status(200).json({ message: 'OTP verified.', success: true, resetToken });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Reset password
const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.purpose !== 'reset') return res.status(400).json({ message: 'Invalid token.', success: false });

        const user = await UserModel.findById(decoded._id);
        if (!user) return res.status(404).json({ message: 'User not found.', success: false });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: 'Password reset successfully!', success: true });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
};

module.exports = { initiateSignup, verifySignupOtp, login, forgotPassword, verifyForgotOtp, resetPassword };
