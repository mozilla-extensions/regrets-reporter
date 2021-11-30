const fs = require('fs');

const filePath = process.argv[2];

const content = fs.readFileSync(filePath);
const json = JSON.parse(content);

/** @type {Array.<string>} */
const webResources = json['web_accessible_resources'];

// Make font files web accessible
webResources.push('*.woff', '*.woff2');

const htmlFilePathRegex = /.*html/gm;

// Remove HTML files from web accessible resources
json['web_accessible_resources'] = webResources.filter((r) => !r.match(htmlFilePathRegex));

fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
