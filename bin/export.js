// Register 'esm' and 'dotenv'.
require = require('esm')(module);
require('dotenv').config();

const { writeFile } = require('fs');
const { printSchema } = require('graphql');
const schema = require('../src/schema');

// Transform stitched schema into SDL & print to a git-ignored file.
writeFile(`${__dirname}/../schema.graphql`, printSchema(schema), err => {
  if (err) throw err;

  console.log("Exported schema to 'schema.graphql'");
  process.exit();
});
