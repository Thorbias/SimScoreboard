// Builds anonymized result files from real Le Mans Ultimate files. Real files
// contain other drivers' names and must never be committed; only the output of
// this script goes into the repository.
//
// Two modes:
//   Fixtures (default): shrunken files for the tests: a few drivers per class
//   and a short stream.
//   node tools/anonymize-results.mjs <results-dir> <out-dir> <own-name> <file>...
//
//   Demo (--demo): complete sessions for the preview: all drivers, all events
//   that the app reads (lap-crossing scores are dropped), neutral chat texts.
//   Also writes `manifest.json` with the list of files.
//   node tools/anonymize-results.mjs --demo <results-dir> <out-dir> <own-name> <file>...
//
// Besides the output it merges every real name seen in the sources into
// `samples/leak-names.txt` (git-ignored), so a test can check the committed
// files for leaks on the machine that has the real files.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const args = process.argv.slice(2);
const demo = args[0] === '--demo';
if (demo) args.shift();
const [resultsDir, outDir, ownName, ...files] = args;
if (!resultsDir || !outDir || !ownName || files.length === 0) {
  console.error(
    'usage: anonymize-results.mjs [--demo] <results-dir> <out-dir> <own-name> <file>...',
  );
  process.exit(1);
}

const KEEP_PER_CLASS = demo ? Infinity : 3;
const MAX_STREAM_EVENTS = demo ? Infinity : 150;
const OWN_LABEL = demo ? 'Demo Driver' : 'Own Driver';
const CHAT_PHRASES = [
  'Good luck everyone',
  'Sorry about that',
  'Nice battle',
  'Watch the gap',
  'Clean start',
  'GG',
  'Thanks for the race',
  'Box this lap?',
];

const tag = (name, text) =>
  text.match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1] ?? '';
const attr = (name, text) =>
  text.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? '';
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Names match without the online suffix and regardless of case, like in the app. */
const normalize = (n) =>
  n.split('#')[0].trim().replace(/\s+/g, ' ').toLowerCase();
const isOwn = (n) => normalize(n) === normalize(ownName);
/** True when `name` occurs in `text` as a word of its own, not inside another word. */
const occurs = (name, text) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}])${escapeRegExp(name)}(?![\\p{L}\\p{N}])`,
    'u',
  ).test(text);

const allNames = new Set();
const written = [];
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

  // Choose the drivers to keep: the best few per class (all in demo mode), the
  // own driver and the first one with an unusual finish status.
  const kept = new Set();
  const classes = [...new Set(drivers.map((d) => d.cls))];
  for (const cls of classes) {
    drivers
      .filter((d) => d.cls === cls)
      .sort((a, b) => a.pos - b.pos)
      .slice(0, KEEP_PER_CLASS)
      .forEach((d) => kept.add(d));
  }
  drivers.filter((d) => isOwn(d.name)).forEach((d) => kept.add(d));
  const odd = drivers.find(
    (d) => !['None', 'Finished Normally'].includes(d.status),
  );
  if (odd) kept.add(odd);
  const keptDrivers = drivers.filter((d) => kept.has(d));
  const keptNames = new Set(keptDrivers.map((d) => d.name));

  // Pseudonyms. Every driver of the file gets one, because the stream also
  // names drivers that are dropped from the output.
  const nameMap = new Map();
  const teamMap = new Map();
  drivers.forEach((d, i) => {
    nameMap.set(
      d.name,
      isOwn(d.name) ? OWN_LABEL : `Driver ${String(i + 1).padStart(2, '0')}`,
    );
  });
  keptDrivers.forEach((d) => {
    if (!teamMap.has(d.team)) {
      const n = teamMap.size;
      teamMap.set(
        d.team,
        demo
          ? `Team ${String(n + 1).padStart(2, '0')}`
          : `Team ${String.fromCharCode(65 + n)}`,
      );
    }
  });
  let guests = 0;

  // Stream events.
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
  let penaltyCount = 0;
  const outEvents = [];
  for (const ev of events) {
    const { el, names } = eventNames(ev);
    names.forEach((n) => allNames.add(n));
    for (const n of names) {
      if (!nameMap.has(n)) {
        nameMap.set(n, `Guest ${String(++guests).padStart(2, '0')}`);
      }
    }
    if (demo) {
      // The app does not read these, and they make up most of a stream.
      if (el === 'Score') continue;
      if (el === 'Sector' && !/reports new/.test(ev)) continue;
    }
    // Keep events that involve a kept driver, plus a few chat lines and penalties.
    const involvesKept = [...names].some((n) => keptNames.has(n));
    const sample =
      demo ||
      (el === 'ChatMessage' && chatCount < 6) ||
      (el === 'Penalty' && penaltyCount++ < 6);
    if (!involvesKept && !sample) continue;
    if (outEvents.length >= MAX_STREAM_EVENTS) break;
    let out = ev;
    if (el === 'ChatMessage') {
      const [sender] = [...names];
      const text = demo
        ? CHAT_PHRASES[chatCount++ % CHAT_PHRASES.length]
        : `Chat message ${++chatCount}`;
      out = out.replace(
        />[\s\S]*<\/ChatMessage>$/,
        `>${sender}: ${text}</ChatMessage>`,
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
  const label = `(?:Driver|Guest) \\d\\d|${escapeRegExp(OWN_LABEL)}`;
  text = text.replace(
    new RegExp(`((?:${label}))\\((\\d+)\\)`, 'g'),
    (_, n, id) => `${n}(${mappedId(n, id)})`,
  );
  text = text.replace(
    new RegExp(`(Driver="(?:${label})" ID=")(\\d+)"`, 'g'),
    (_, pre, id) => {
      const n = pre.match(/Driver="([^"]+)"/)[1];
      return `${pre}${mappedId(n, id)}"`;
    },
  );

  // Safety net: no real name may survive, as a word of its own.
  const real = [...new Set([...allNames, ...nameMap.keys()])].filter(Boolean);
  const leaked = real.filter((n) => occurs(n, text));
  if (leaked.length) {
    console.error(`${file}: real names left in output:`, leaked);
    process.exit(2);
  }
  writeFileSync(join(outDir, basename(file)), text, 'utf8');
  written.push(basename(file));
  console.log(
    `${file}: ${keptDrivers.length}/${drivers.length} drivers, ${outEvents.length}/${events.length} events, ${Math.round(text.length / 1024)} KB`,
  );
}

if (demo) {
  writeFileSync(
    join(outDir, 'manifest.json'),
    JSON.stringify(
      { ownName: OWN_LABEL, files: [...written].sort() },
      null,
      2,
    ) + '\n',
    'utf8',
  );
}

mkdirSync('samples', { recursive: true });
const leakFile = 'samples/leak-names.txt';
const known = existsSync(leakFile)
  ? readFileSync(leakFile, 'utf8').split('\n').filter(Boolean)
  : [];
writeFileSync(
  leakFile,
  [...new Set([...known, ...[...allNames].filter((n) => n.length > 3)])].join(
    '\n',
  ) + '\n',
  'utf8',
);
