// Builds anonymized, shrunken test fixtures from real Le Mans Ultimate result
// files. Real files contain other drivers' names and must never be committed;
// only the output of this script goes into the repository.
//
// Usage:
//   node tools/anonymize-results.mjs <results-dir> <out-dir> <own-name> <file>...
//
// Besides the fixtures it writes `samples/leak-names.txt` (git-ignored) with
// every real name seen in the sources, so a test can check the fixtures for
// leaks on the machine that has the real files.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const [resultsDir, outDir, ownName, ...files] = process.argv.slice(2);
if (!resultsDir || !outDir || !ownName || files.length === 0) {
  console.error(
    'usage: anonymize-results.mjs <results-dir> <out-dir> <own-name> <file>...',
  );
  process.exit(1);
}

const KEEP_PER_CLASS = 3;
const MAX_STREAM_EVENTS = 150;

const tag = (name, text) =>
  text.match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1] ?? '';
const attr = (name, text) =>
  text.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? '';

const allNames = new Set();
mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const source = readFileSync(join(resultsDir, file), 'utf8');

  // Driver blocks.
  const driverBlocks = [
    ...source.matchAll(/<Driver>[\s\S]*?<\/Driver>\r?\n?/g),
  ];
  const drivers = driverBlocks.map((m) => ({
    block: m[0],
    name: tag('Name', m[0]),
    cls: tag('CarClass', m[0]),
    pos: Number(tag('Position', m[0])) || 9999,
    status: tag('FinishStatus', m[0]),
    team: tag('TeamName', m[0]),
  }));
  for (const d of drivers) allNames.add(d.name);

  // Choose the drivers to keep: the best few per class, the own driver and the
  // first one with an unusual finish status.
  const kept = new Set();
  const classes = [...new Set(drivers.map((d) => d.cls))];
  for (const cls of classes) {
    drivers
      .filter((d) => d.cls === cls)
      .sort((a, b) => a.pos - b.pos)
      .slice(0, KEEP_PER_CLASS)
      .forEach((d) => kept.add(d));
  }
  drivers.filter((d) => d.name === ownName).forEach((d) => kept.add(d));
  const odd = drivers.find(
    (d) => !['None', 'Finished Normally'].includes(d.status),
  );
  if (odd) kept.add(odd);
  const keptDrivers = drivers.filter((d) => kept.has(d));
  const keptNames = new Set(keptDrivers.map((d) => d.name));

  // Pseudonyms.
  const nameMap = new Map();
  const teamMap = new Map();
  keptDrivers.forEach((d, i) => {
    nameMap.set(
      d.name,
      d.name === ownName
        ? 'Own Driver'
        : `Driver ${String(i + 1).padStart(2, '0')}`,
    );
    if (!teamMap.has(d.team))
      teamMap.set(d.team, `Team ${String.fromCharCode(65 + teamMap.size)}`);
  });

  // Stream events: keep the ones that only involve kept drivers.
  const streamMatch = source.match(/<Stream>([\s\S]*?)<\/Stream>/);
  const events = streamMatch
    ? [...streamMatch[1].matchAll(/<(\w+)\b[^>]*>[\s\S]*?<\/\1>/g)].map(
        (m) => m[0],
      )
    : [];
  const idMap = new Map();
  const mappedId = (name, id) => {
    const key = `${name}|${id}`;
    if (!idMap.has(key)) idMap.set(key, String(idMap.size + 1));
    return idMap.get(key);
  };
  const eventNames = (ev) => {
    const names = new Set();
    const head = ev.match(/^<(\w+)\b[^>]*>([\s\S]*?)<\/\1>$/);
    const el = head?.[1] ?? '';
    const body = head?.[2] ?? '';
    const driverAttr = attr('Driver', ev.split('>')[0]);
    if (driverAttr) names.add(driverAttr);
    if (el === 'ChatMessage') {
      const sender = body.split(': ')[0];
      if (sender) names.add(sender);
    } else {
      const first = body.match(/^([^(\n]+?)\(\d+\)/)?.[1];
      if (first) names.add(first);
      const penalised = body.match(/^(.+?) (?:received|served) /)?.[1];
      if (penalised) names.add(penalised);
      for (const m of body.matchAll(/vehicle (.+?)\(\d+\)/g))
        if (m[1]) names.add(m[1]);
    }
    return { el, names };
  };
  let chatCount = 0;
  const outEvents = [];
  for (const ev of events) {
    const { el, names } = eventNames(ev);
    names.forEach((n) => allNames.add(n));
    if (![...names].every((n) => keptNames.has(n))) continue;
    if (outEvents.length >= MAX_STREAM_EVENTS) break;
    let out = ev;
    if (el === 'ChatMessage') {
      const [sender] = [...names];
      out = out.replace(
        />[\s\S]*<\/ChatMessage>$/,
        `>${sender}: Chat message ${++chatCount}</ChatMessage>`,
      );
    }
    if (el === 'Penalty') {
      out = out
        .replace(/Reason="[^"]*"/, 'Reason="Reason"')
        .replace(/(for )[^\n<]*?( Result:)/, '$1Reason$2');
    }
    outEvents.push(out);
  }

  // Rebuild the file text.
  let text = source;
  const keptText = keptDrivers
    .map((d) => {
      const carNumber = tag('CarNumber', d.block);
      return d.block
        .replace(/<VehFile>[^<]*<\/VehFile>/, '<VehFile>car.VEH</VehFile>')
        .replace(
          /<VehName>[^<]*<\/VehName>/,
          `<VehName>Car #${carNumber}</VehName>`,
        )
        .replace(
          /<TeamName>[^<]*<\/TeamName>/,
          `<TeamName>${teamMap.get(d.team)}</TeamName>`,
        );
    })
    .join('');
  text = text.replace(/(<Driver>[\s\S]*<\/Driver>\r?\n?)/, () => keptText);
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  text = text.replace(
    /<Stream>[\s\S]*?<\/Stream>/,
    () => `<Stream>${eol}${outEvents.map((e) => e + eol).join('')}</Stream>`,
  );
  text = text
    .replace(
      /<ServerName>[^<]+<\/ServerName>/,
      '<ServerName>Server</ServerName>',
    )
    .replace(
      /<TrackData>[^<]*<\/TrackData>/,
      '<TrackData>Installed\\Locations\\Track\\layout.mas</TrackData>',
    )
    .replace(/(<ConnectionType[^>]*>)[^<]*/, '$1Connection');

  // Replace names (longest first) and renumber the session-local IDs.
  const names = [...nameMap.keys()].sort((a, b) => b.length - a.length);
  for (const real of names) {
    const fake = nameMap.get(real);
    text = text.split(`${real}(`).join(`${fake}(`);
    text = text.split(`>${real}<`).join(`>${fake}<`);
    text = text.split(`"${real}"`).join(`"${fake}"`);
    text = text.split(`>${real}: `).join(`>${fake}: `);
    text = text.split(`>${real} `).join(`>${fake} `);
  }
  text = text.replace(
    /(Driver \d\d|Own Driver)\((\d+)\)/g,
    (_, n, id) => `${n}(${mappedId(n, id)})`,
  );
  text = text.replace(
    /(Driver="(?:Driver \d\d|Own Driver)" ID=")(\d+)"/g,
    (_, pre, id) => {
      const n = pre.match(/Driver="([^"]+)"/)[1];
      return `${pre}${mappedId(n, id)}"`;
    },
  );

  // Safety net: no real name may survive.
  const leaked = [...allNames].filter(
    (n) => n && !nameMap.has(n) && text.includes(n),
  );
  const leakedKept = [...nameMap.keys()].filter((n) => text.includes(n));
  if (leaked.length || leakedKept.length) {
    console.error(`${file}: real names left in output:`, [
      ...leaked,
      ...leakedKept,
    ]);
    process.exit(2);
  }
  writeFileSync(join(outDir, basename(file)), text, 'utf8');
  console.log(
    `${file}: ${keptDrivers.length}/${drivers.length} drivers, ${outEvents.length}/${events.length} events`,
  );
}

mkdirSync('samples', { recursive: true });
writeFileSync(
  'samples/leak-names.txt',
  [...allNames].filter((n) => n.length > 3).join('\n') + '\n',
  'utf8',
);
