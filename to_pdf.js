const { mdToPdf } = require('md-to-pdf');
const fs = require('fs');

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
    await convert('/home/ai-machine-1/Projects/gpt_resume/portfolio/public/resumes/detailed_resume.md', '/home/ai-machine-1/Projects/gpt_resume/portfolio/public/resumes/ats_resume.pdf');
    await convert('/home/ai-machine-1/Projects/gpt_resume/portfolio/public/resumes/optimized_resume.md', '/home/ai-machine-1/Projects/gpt_resume/portfolio/public/resumes/optimized_resume.pdf');
    // await convert('/home/ai-machine-1/Projects/gpt_resume/portfolio/public/resumes/master_cv.md', '/home/ai-machine-1/Projects/gpt_resume/portfolio/public/resumes/master_cv.pdf');
})();
