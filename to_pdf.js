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
    const baseDir = fs.existsSync(path.join(__dirname, 'frontend/public/resumes'))
        ? path.join(__dirname, 'frontend/public/resumes')
        : path.join(__dirname, 'public/resumes');

    await convert(
        path.join(baseDir, 'detailed_resume.md'),
        path.join(baseDir, 'detailed_resume.pdf')
    );
    await convert(
        path.join(baseDir, 'optimized_resume.md'),
        path.join(baseDir, 'optimized_resume.pdf')
    );
    await convert(
        path.join(baseDir, 'master_cv.md'),
        path.join(baseDir, 'master_cv.pdf')
    );
})();
