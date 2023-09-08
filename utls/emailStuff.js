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
    const mailOptions = {
        from: process.env.EMAIL,
        to: toEmail,
        subject: subject,
        text: text
    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

const sendEmailConfirmationLink = (toEmail,link)=>{
    const subject = "Email Verfication Link";
    const text = "Click on this link to verfiy your Email Address: " + link;
    sendEmail(toEmail,subject,text);
}

module.exports = {
    sendEmailConfirmationLink,
}
