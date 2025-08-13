import EleventyFetch from '@11ty/eleventy-fetch';
import { parse } from 'csv-parse/sync';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/12IuNw3Ky9RzDxENuOyeSYUYOyQRUvnmdbrm87S3ZGFs/gviz/tq?tqx=out:csv';

export default async function () {
  try {
    const csv = await EleventyFetch(SHEET_URL, { duration: '12h', type: 'text' });
    const rows = parse(csv, {
      columns: true,
      skip_empty_lines: true
    });

    return rows.sort((a, b) => b.år - a.år);
  } catch (err) {
    console.error("Feil ved henting av dokumenter:", err);
    return [];
  }
}
