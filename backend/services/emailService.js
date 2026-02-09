const nodemailer = require('nodemailer');

// Create transporter using Resend SMTP
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendAlertEmail = async (toEmail, stockData, reason) => {
    const { symbol, price, change, changePercent } = stockData;
    const direction = change >= 0 ? 'rose' : 'fell';
    const color = change >= 0 ? 'green' : 'red';
    const arrow = change >= 0 ? '↑' : '↓';

    const subject = `Stock Alert: ${symbol} ${direction} ${Math.abs(changePercent).toFixed(2)}%`;

    // Simple HTML template
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Stock Alert: ${symbol}</h2>
        <p style="font-size: 16px;">
            <strong>${symbol}</strong> just moved significantly.
        </p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0; font-size: 18px;">
                Current Price: <strong>$${price.toFixed(2)}</strong>
            </p>
            <p style="margin: 5px 0; font-size: 18px; color: ${color};">
                Change: <strong>${arrow} ${Math.abs(change).toFixed(2)} (${Math.abs(changePercent).toFixed(2)}%)</strong>
            </p>
        </div>

        <div style="margin-top: 20px;">
            <h3 style="color: #555;">Analysis</h3>
            <p style="font-style: italic; color: #666;">
                ${reason}
            </p>
        </div>

        <p style="font-size: 12px; color: #999; margin-top: 30px;">
            Time: ${new Date().toLocaleString()}
        </p>
    </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: toEmail,
            subject: subject,
            html: html
        });
        console.log(`Email sent to ${toEmail} for ${symbol}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${toEmail}:`, error);
        return false;
    }
};

module.exports = { sendAlertEmail };
