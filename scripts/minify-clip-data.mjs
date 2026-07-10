import fs from "node:fs";
import path from "node:path";

const targetPath = path.resolve(process.argv[2] ?? "clip-search-data.json");
const source = fs.readFileSync(targetPath, "utf8");
const minified = JSON.stringify(JSON.parse(source));

fs.writeFileSync(targetPath, minified);
