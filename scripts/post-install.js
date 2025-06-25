const path = require("path");
const fs = require("fs");
const version = "2.9.359";

const pdfjs_dist_destination = path.join(__dirname, "../node_modules/pdfjs-dist/${version}");
const cmap_source = path.join(__dirname, "../node_modules/pdfjs-dist/cmaps");
const cmap_destination = path.join(__dirname, `../public/pdfjs-dist/${version}/cmaps`);
const worker_source = path.join(__dirname, "../node_modules/pdfjs-dist/build");
const worker_destination = path.join(__dirname, `../public/pdfjs-dist/${version}/`);

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath);
    }
}

try {
    fs.rmdirSync(pdfjs_dist_destination, { recursive: true });
    copyDir(cmap_source, cmap_destination);
    copyDir(worker_source, worker_destination);
} catch (error) {
    console.log("An error occured while copying the folder.", error);
}
