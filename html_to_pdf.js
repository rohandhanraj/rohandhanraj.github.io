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
    await htmlToPdf(
        path.join(__dirname, 'portfolio/public/resumes/master_cv.html'),
        path.join(__dirname, 'portfolio/public/resumes/master_cv.pdf')
    );
})();
