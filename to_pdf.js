const { mdToPdf } = require('md-to-pdf');
const fs = require('fs');
const path = require('path');

async function convert(inputFile, outputFile) {
    try {
        const pdf = await mdToPdf(
            { path: inputFile },
            {
                launch_options: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
                pdf_options: {
                    format: 'A4',
                    preferCSSPageSize: true,
                    printBackground: true
                }
            }
        );
        if (pdf) {
            fs.writeFileSync(outputFile, pdf.content);
            console.log("Compiled " + outputFile);
        }
    } catch (e) {
        console.error(e);
    }
}

(async () => {
    await convert(
        path.join(__dirname, 'public/resumes/detailed_resume.md'),
        path.join(__dirname, 'public/resumes/detailed_resume.pdf')
    );
    // await convert(
    //     path.join(__dirname, 'public/resumes/optimized_resume.md'),
    //     path.join(__dirname, 'public/resumes/optimized_resume.pdf')
    // );
    // await convert(
    //     path.join(__dirname, 'public/resumes/master_cv.md'),
    //     path.join(__dirname, 'public/resumes/master_cv.pdf')
    // );
})();
