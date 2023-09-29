const nodemailer = require("nodemailer");
require("dotenv").config();
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
});

const sendEmail = (toEmail,subject,text)=>{
    return new Promise((resolve,reject)=>{
        const mailOptions = {
            from: process.env.EMAIL,
            to: toEmail,
            subject: subject,
            text: text
        };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                reject(error);
            } else {
                resolve('Email sent: ' + info.response);
            }
        });
    })
    
}

const sendEmailConfirmationLink = (toEmail,link)=>{
    const subject = "Email Verfication Link";
    const text = "Click on this link to verfiy your Email Address: " + link + "\nNote:The Link is only valid for the next 24 hours";
    sendEmail(toEmail,subject,text)
    .then(message => console.log(message));
}

const sendEmailForgetPasswordLink = (toEmail,link)=>{
    const subject = "Password Reset Link";
    const text = "Click on this link to reset your password: " + link + "\nNote:The Link is only valid for the next 24 hours";
    sendEmail(toEmail,subject,text)
    .then(message => console.log(message));
}

module.exports = {
    sendEmailConfirmationLink,
    sendEmailForgetPasswordLink,
}
