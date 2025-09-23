#!/usr/bin/env tsx

/**
 * MariaIntelligence File Corruption Detection Script
 * Systematically finds files with embedded escape sequences
 * Created: 2025-09-21
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

interface CorruptionMatch {
  line: number;
  column: number;
  pattern: string;
  context: string;
}

interface CorruptedFile {
  path: string;
  relativePath: string;
  size: number;
  matches: CorruptionMatch[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface DetectionReport {
  timestamp: string;
  totalFilesScanned: number;
  corruptedFilesFound: number;
  files: CorruptedFile[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// Corruption patterns to detect
const CORRUPTION_PATTERNS = [
  { pattern: /\\n/g, name: 'escaped-newline', severity: 'critical' as const },
  { pattern: /\\t/g, name: 'escaped-tab', severity: 'high' as const },
  { pattern: /\\"/g, name: 'escaped-quote', severity: 'medium' as const },
  { pattern: /\\'/g, name: 'escaped-single-quote', severity: 'medium' as const },
  { pattern: /\\\\/g, name: 'double-backslash', severity: 'low' as const },
  { pattern: /\\r/g, name: 'escaped-return', severity: 'high' as const },
];

class CorruptionDetector {
  private projectRoot: string;
  private report: DetectionReport;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.report = {
      timestamp: new Date().toISOString(),
      totalFilesScanned: 0,
      corruptedFilesFound: 0,
      files: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0 }
    };
  }

  /**
   * Scan directories for TypeScript/JavaScript files
   */
  private scanDirectory(dirPath: string, extensions: string[] = ['.ts', '.js', '.tsx', '.jsx']): string[] {
    const files: string[] = [];

    try {
      const items = readdirSync(dirPath);

      for (const item of items) {
        const fullPath = join(dirPath, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules, .git, dist, and other build directories
          if (!item.startsWith('.') && !['node_modules', 'dist', 'build', 'coverage'].includes(item)) {
            files.push(...this.scanDirectory(fullPath, extensions));
          }
        } else if (stat.isFile() && extensions.includes(extname(item))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}:`, (error as Error).message);
    }

    return files;
  }

  /**
   * Analyze a single file for corruption patterns
   */
  private analyzeFile(filePath: string): CorruptedFile | null {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const matches: CorruptionMatch[] = [];
      let maxSeverity: 'critical' | 'high' | 'medium' | 'low' = 'low';

      // Check each line for corruption patterns
      lines.forEach((line, lineIndex) => {
        CORRUPTION_PATTERNS.forEach(({ pattern, name, severity }) => {
          const regex = new RegExp(pattern.source, 'g');
          let match;

          while ((match = regex.exec(line)) !== null) {
            // Avoid false positives in string literals and comments
            const beforeMatch = line.substring(0, match.index);
            const isInString = this.isInStringLiteral(beforeMatch);
            const isInComment = this.isInComment(beforeMatch);

            if (!isInString && !isInComment) {
              matches.push({
                line: lineIndex + 1,
                column: match.index + 1,
                pattern: name,
                context: line.substring(Math.max(0, match.index - 20), match.index + 20)
              });

              // Update max severity
              if (this.getSeverityWeight(severity) > this.getSeverityWeight(maxSeverity)) {
                maxSeverity = severity;
              }
            }
          }
        });
      });

      if (matches.length > 0) {
        return {
          path: filePath,
          relativePath: relative(this.projectRoot, filePath),
          size: content.length,
          matches: matches.slice(0, 10), // Limit to first 10 matches
          severity: maxSeverity
        };
      }
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}:`, (error as Error).message);
    }

    return null;
  }

  /**
   * Check if position is inside a string literal
   */
  private isInStringLiteral(beforeMatch: string): boolean {
    const singleQuotes = (beforeMatch.match(/'/g) || []).length;
    const doubleQuotes = (beforeMatch.match(/"/g) || []).length;
    const backticks = (beforeMatch.match(/`/g) || []).length;

    return (singleQuotes % 2 === 1) || (doubleQuotes % 2 === 1) || (backticks % 2 === 1);
  }

  /**
   * Check if position is inside a comment
   */
  private isInComment(beforeMatch: string): boolean {
    return beforeMatch.includes('//') || beforeMatch.includes('/*');
  }

  /**
   * Get numeric weight for severity comparison
   */
  private getSeverityWeight(severity: string): number {
    const weights = { critical: 4, high: 3, medium: 2, low: 1 };
    return weights[severity as keyof typeof weights] || 0;
  }

  /**
   * Run comprehensive corruption detection
   */
  public async detect(): Promise<DetectionReport> {
    console.log('🔍 Starting systematic corruption detection...');

    // Scan server and shared directories
    const directories = [
      join(this.projectRoot, 'server'),
      join(this.projectRoot, 'shared'),
      join(this.projectRoot, 'src'),
      join(this.projectRoot, 'client/src')
    ].filter(dir => {
      try {
        return statSync(dir).isDirectory();
      } catch {
        return false;
      }
    });

    const allFiles: string[] = [];
    directories.forEach(dir => {
      allFiles.push(...this.scanDirectory(dir));
    });

    console.log(`📁 Scanning ${allFiles.length} files...`);

    // Analyze each file
    for (const filePath of allFiles) {
      this.report.totalFilesScanned++;

      const corrupted = this.analyzeFile(filePath);
      if (corrupted) {
        this.report.files.push(corrupted);
        this.report.corruptedFilesFound++;
        this.report.summary[corrupted.severity]++;

        console.log(`❌ Found ${corrupted.matches.length} issues in ${corrupted.relativePath}`);
      }
    }

    // Sort by severity and match count
    this.report.files.sort((a, b) => {
      const severityDiff = this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity);
      if (severityDiff !== 0) return severityDiff;
      return b.matches.length - a.matches.length;
    });

    return this.report;
  }

  /**
   * Save report to file
   */
  public saveReport(outputPath: string): void {
    writeFileSync(outputPath, JSON.stringify(this.report, null, 2));
    console.log(`📊 Report saved to ${outputPath}`);
  }

  /**
   * Display summary to console
   */
  public displaySummary(): void {
    console.log('\n🎯 CORRUPTION DETECTION SUMMARY');
    console.log('================================');
    console.log(`📁 Files scanned: ${this.report.totalFilesScanned}`);
    console.log(`❌ Corrupted files: ${this.report.corruptedFilesFound}`);
    console.log(`📊 By severity:`);
    console.log(`   🚨 Critical: ${this.report.summary.critical}`);
    console.log(`   ⚠️  High: ${this.report.summary.high}`);
    console.log(`   🔶 Medium: ${this.report.summary.medium}`);
    console.log(`   🟨 Low: ${this.report.summary.low}`);

    if (this.report.files.length > 0) {
      console.log('\n🔥 TOP CRITICAL FILES:');
      this.report.files
        .filter(f => f.severity === 'critical')
        .slice(0, 5)
        .forEach(file => {
          console.log(`   ${file.relativePath} (${file.matches.length} issues)`);
        });
    }
  }
}

// Main execution
async function main() {
  const projectRoot = process.cwd();
  const detector = new CorruptionDetector(projectRoot);

  try {
    const report = await detector.detect();

    // Save detailed report
    const reportPath = 'tmp/corrupted-files.json';
    detector.saveReport(reportPath);

    // Display summary
    detector.displaySummary();

    // Exit with appropriate code
    process.exit(report.corruptedFilesFound > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Detection failed:', error);
    process.exit(1);
  }
}

// Run if this is the main module (ES modules style)
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  main();
}

export { CorruptionDetector, type DetectionReport, type CorruptedFile };