import exifr from 'exifr';
import fs from 'fs';

async function test() {
  // Let's just check if exifr handles a dummy buffer without throwing if options=true
  try {
    const tags = await exifr.parse(Buffer.from('dummy'), true);
    console.log("Success", tags);
  } catch (e) {
    console.error("Error", e);
  }
}
test();
