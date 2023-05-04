import * as process from "process";

const nodemailer = require('nodemailer');
export function validateUsername(username:string):string{
    return username.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").replace(" ", '-');
}

export const transporter = nodemailer.createTransport({
    port: 587,
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASSWORD,
    },
    secure: false,
});
export function createMailData(email:string,pass:string){
    return  {
        from: process.env.MAILER_EMAIL,  // sender address
        to: email,   // list of receivers
        subject: 'Student Code Access',
        text: 'Prístupy do Student code',
        html: `<div style="display: grid"><h3>Vaše Prihlasovacie údaje</h3><b>email: ${email}</b><b>heslo: ${pass}</b><p>Heslo je jednorázové!</p></div>`
    };
}
