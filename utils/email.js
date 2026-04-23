const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, purpose) => {
    const subject = purpose === 'signup' ? 'Verify Your Email - Expense Tracker' : 'Reset Password - Expense Tracker';
    const heading = purpose === 'signup' ? 'Email Verification' : 'Password Reset';
    const message = purpose === 'signup'
        ? 'Thank you for registering! Please use the OTP below to verify your email address.'
        : 'We received a request to reset your password. Use the OTP below to proceed.';

    const mailOptions = {
        from: `"Expense Tracker" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
            <h2 style="color: #1a1a2e; margin-bottom: 8px;">${heading}</h2>
            <p style="color: #555; margin-bottom: 24px;">${message}</p>
            <div style="background: #1a1a2e; color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                ${otp}
            </div>
            <p style="color: #888; font-size: 13px;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
        </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};

module.exports = { generateOTP, sendOTPEmail };
