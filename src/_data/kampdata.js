import EleventyFetch from '@11ty/eleventy-fetch';
import { parse } from 'csv-parse/sync';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/16eNrJbiGx3NLotCBqJNSlm3BsPLFr8ljU5uwKDCUeU0/gviz/tq?tqx=out:csv";

function makeSlug(text) {
  return text?.toLowerCase()
    .replace(/[æåä]/g, 'a')
    .replace(/[øö]/g, 'o')
    .replace(/[éèê]/g, 'e')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default async function () {
  try {
    const csv = await EleventyFetch(SHEET_URL, { duration: '1h', type: 'text' });
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true
    });

    const kamp = records[0] || {};

    return {
      neste: kamp.neste || 'Ingen kamp funne',
      forrige: kamp.forrige || 'Ingen kampdata tilgjengeleg',
      slugNeste: kamp.neste ? makeSlug(kamp.neste) : null,
      slugForrige: kamp.forrige ? makeSlug(kamp.forrige) : null
    };
  } catch (err) {
    console.error("Feil ved henting av kampdata:", err);
    return {
      neste: "Feil ved henting",
      forrige: "Feil ved henting",
      slugNeste: null,
      slugForrige: null
    };
  }
}
