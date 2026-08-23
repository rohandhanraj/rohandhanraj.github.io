const puppeteer = require('puppeteer');
const path = require('path');

async function htmlToPdf(inputHtml, outputPdf) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Use file:// URL so local assets (images, fonts) resolve correctly
    const fileUrl = 'file://' + path.resolve(inputHtml);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    await page.pdf({
        path: outputPdf,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: false,
        margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' }
    });

    await browser.close();
    console.log('Compiled ' + outputPdf);
}

(async () => {
    const fs = require('fs');
    const inputHtml = fs.existsSync(path.join(__dirname, 'frontend/public/resumes/master_cv.html'))
        ? path.join(__dirname, 'frontend/public/resumes/master_cv.html')
        : path.join(__dirname, 'public/resumes/master_cv.html');
    const outputPdf = fs.existsSync(path.join(__dirname, 'frontend/public/resumes'))
        ? path.join(__dirname, 'frontend/public/resumes/master_cv_html.pdf')
        : path.join(__dirname, 'public/resumes/master_cv_html.pdf');

    await htmlToPdf(inputHtml, outputPdf);
})();
