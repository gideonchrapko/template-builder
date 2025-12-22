#!/usr/bin/env node

/**
 * Automatically sets the database provider in schema.prisma
 * based on DATABASE_PROVIDER environment variable
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const provider = process.env.DATABASE_PROVIDER || 'sqlite';

// Read the schema file
const schema = fs.readFileSync(schemaPath, 'utf8');

// Replace the provider line - find any provider = "value" or provider = env(...)
const updatedSchema = schema.replace(
  /(provider\s*=\s*)(?:["'][^"']+["']|env\(["'][^"']+["']\))/,
  `$1"${provider}"`
);

if (updatedSchema !== schema) {
  fs.writeFileSync(schemaPath, updatedSchema);
  console.log(`✅ Database provider set to: ${provider}`);
} else {
  console.warn('⚠️  Could not find provider line to replace');
}
