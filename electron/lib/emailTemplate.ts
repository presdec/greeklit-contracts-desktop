import { readFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';

const EMAIL_TEMPLATE_TOKEN_RE = /\{\{([^}]+)\}\}/g;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const XML_PART_PREFIXES = [
  'word/document.xml',
  'word/header',
  'word/footer',
  'word/footnotes.xml',
  'word/endnotes.xml',
];

function decodeXml(value: string) {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}

function findEndOfCentralDirectory(buffer: Buffer) {
  const minOffset = Math.max(0, buffer.length - 65_557);

  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      return offset;
    }
  }

  throw new Error('Could not read DOCX file directory.');
}

function readZipEntries(buffer: Buffer) {
  const endOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(endOffset + 10);
  let centralOffset = buffer.readUInt32LE(endOffset + 16);
  const entries = new Map<string, string>();

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(centralOffset) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error('Invalid DOCX central directory.');
    }

    const compressionMethod = buffer.readUInt16LE(centralOffset + 10);
    const compressedSize = buffer.readUInt32LE(centralOffset + 20);
    const fileNameLength = buffer.readUInt16LE(centralOffset + 28);
    const extraLength = buffer.readUInt16LE(centralOffset + 30);
    const commentLength = buffer.readUInt16LE(centralOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(centralOffset + 42);
    const fileName = buffer.toString('utf8', centralOffset + 46, centralOffset + 46 + fileNameLength);

    if (buffer.readUInt32LE(localHeaderOffset) !== LOCAL_FILE_HEADER_SIGNATURE) {
      throw new Error('Invalid DOCX local file header.');
    }

    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const content = compressionMethod === 0
      ? compressed
      : compressionMethod === 8
        ? inflateRawSync(compressed)
        : null;

    if (content) {
      entries.set(fileName, content.toString('utf8'));
    }

    centralOffset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function extractParagraphsFromXml(content: string) {
  const paragraphs = content.match(/<w:p(?:\s[^>]*)?>(.*?)<\/w:p>/gs) ?? [];

  return paragraphs
    .map((paragraph) => {
      const textNodes = paragraph.match(/<w:t(?:\s[^>]*)?>(.*?)<\/w:t>/gs) ?? [];
      return textNodes
        .map((node) => node.replace(/<w:t(?:\s[^>]*)?>|<\/w:t>/g, ''))
        .map(decodeXml)
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
    })
    .filter(Boolean);
}

function extractDocxText(buffer: Buffer) {
  const entries = readZipEntries(buffer);
  const paragraphs: string[] = [];

  for (const [name, content] of entries) {
    if (!XML_PART_PREFIXES.some((prefix) => name === prefix || name.startsWith(prefix))) {
      continue;
    }

    paragraphs.push(...extractParagraphsFromXml(content));
  }

  return paragraphs.join('\n\n');
}

export function extractEmailTemplateVariables(value: string) {
  return Array.from(
    new Set(
      [...value.matchAll(EMAIL_TEMPLATE_TOKEN_RE)]
        .map((match) => match[1]?.trim() ?? '')
        .filter(Boolean),
    ),
  );
}

export async function readEmailTemplateContent(templatePath: string) {
  const buffer = await readFile(templatePath);

  if (templatePath.toLowerCase().endsWith('.docx')) {
    return extractDocxText(buffer);
  }

  return buffer.toString('utf8');
}
