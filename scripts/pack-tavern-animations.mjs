import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const selected = {
  ual1: [
    'Walk_Loop',
    'Idle_Loop',
    'Idle_Talking_Loop',
    'Idle_Torch_Loop',
    'Interact',
    'PickUp_Table',
    'Sitting_Enter',
    'Sitting_Exit',
    'Sitting_Idle_Loop',
    'Sitting_Talking_Loop',
    'Dance_Loop',
    'Fixing_Kneeling',
  ],
  ual2: ['Consume', 'Idle_FoldArms_Loop', 'Idle_Lantern_Loop', 'Yes'],
};

function readGlb(file) {
  const data = fs.readFileSync(file);
  assert.equal(data.toString('ascii', 0, 4), 'glTF', `${file} is not a GLB`);
  assert.equal(data.readUInt32LE(4), 2, `${file} is not GLB 2.0`);
  assert.equal(data.readUInt32LE(8), data.length, `${file} has an invalid length`);
  let offset = 12,
    json,
    binary;
  while (offset < data.length) {
    const length = data.readUInt32LE(offset),
      type = data.readUInt32LE(offset + 4);
    const chunk = data.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8').trimEnd());
    if (type === 0x004e4942) binary = chunk;
    offset += 8 + length;
  }
  assert.ok(json && binary, `${file} must contain JSON and binary chunks`);
  return { json, binary };
}

function build(input1, input2, output) {
  const sources = [readGlb(input1), readGlb(input2)];
  const base = sources[0].json;
  const nodeByName = new Map(base.nodes.map((node, index) => [node.name, index]).filter(([name]) => name));
  const views = [],
    accessors = [],
    parts = [];
  let binaryLength = 0;
  const viewMap = new Map(),
    accessorMap = new Map();
  const align = () => {
    const padding = (4 - (binaryLength % 4)) % 4;
    if (padding) parts.push(Buffer.alloc(padding));
    binaryLength += padding;
  };
  function remapAccessor(sourceIndex, sourceAccessorIndex) {
    const key = `${sourceIndex}:${sourceAccessorIndex}`;
    if (accessorMap.has(key)) return accessorMap.get(key);
    const source = sources[sourceIndex],
      accessor = source.json.accessors[sourceAccessorIndex];
    assert.ok(accessor && !accessor.sparse, `Unsupported animation accessor ${key}`);
    assert.notEqual(accessor.bufferView, undefined, `Animation accessor ${key} has no buffer view`);
    const sourceViewIndex = accessor.bufferView;
    let outputViewIndex = viewMap.get(`${sourceIndex}:${sourceViewIndex}`);
    if (outputViewIndex === undefined) {
      const sourceView = source.json.bufferViews[sourceViewIndex];
      const start = sourceView.byteOffset ?? 0,
        end = start + sourceView.byteLength;
      assert.ok(
        start >= 0 && end <= source.binary.length,
        `Invalid animation buffer view ${sourceViewIndex}`,
      );
      align();
      outputViewIndex = views.length;
      views.push({ ...sourceView, buffer: 0, byteOffset: binaryLength });
      const bytes = source.binary.subarray(start, end);
      parts.push(bytes);
      binaryLength += bytes.length;
      viewMap.set(`${sourceIndex}:${sourceViewIndex}`, outputViewIndex);
    }
    const outputAccessorIndex = accessors.length;
    accessors.push({ ...accessor, bufferView: outputViewIndex });
    accessorMap.set(key, outputAccessorIndex);
    return outputAccessorIndex;
  }

  const animations = [];
  for (let sourceIndex = 0; sourceIndex < 2; sourceIndex += 1) {
    const pack = sourceIndex === 0 ? selected.ual1 : selected.ual2;
    const source = sources[sourceIndex];
    for (const name of pack) {
      const animation = source.json.animations.find((candidate) => candidate.name === name);
      assert.ok(animation, `${name} is missing from source pack ${sourceIndex + 1}`);
      const outputAnimation = JSON.parse(JSON.stringify(animation));
      for (const sampler of outputAnimation.samplers) {
        sampler.input = remapAccessor(sourceIndex, sampler.input);
        sampler.output = remapAccessor(sourceIndex, sampler.output);
      }
      for (const channel of outputAnimation.channels) {
        const sourceNode = source.json.nodes[channel.target.node];
        const targetNode = nodeByName.get(sourceNode?.name);
        assert.notEqual(targetNode, undefined, `${name} targets an unknown joint ${sourceNode?.name}`);
        channel.target.node = targetNode;
      }
      animations.push(outputAnimation);
    }
  }

  const json = JSON.parse(JSON.stringify(base));
  json.asset.generator = 'LiveTabern curated Quaternius CC0 animation subset';
  json.nodes = json.nodes.map((node) => {
    const copy = { ...node };
    delete copy.mesh;
    delete copy.skin;
    return copy;
  });
  delete json.meshes;
  delete json.skins;
  delete json.materials;
  delete json.textures;
  delete json.images;
  delete json.samplers;
  delete json.cameras;
  delete json.extensionsUsed;
  delete json.extensionsRequired;
  json.buffers = [{ byteLength: binaryLength }];
  json.bufferViews = views;
  json.accessors = accessors;
  json.animations = animations;
  const binary = Buffer.concat(parts, binaryLength);
  const jsonBytes = Buffer.from(JSON.stringify(json));
  const jsonChunk = Buffer.concat([jsonBytes, Buffer.alloc((4 - (jsonBytes.length % 4)) % 4, 0x20)]);
  const binaryChunk = Buffer.concat([binary, Buffer.alloc((4 - (binary.length % 4)) % 4)]);
  const totalLength = 12 + 8 + jsonChunk.length + 8 + binaryChunk.length;
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(binaryChunk.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, Buffer.concat([header, jsonHeader, jsonChunk, binaryHeader, binaryChunk]));
  const result = readGlb(output);
  assert.deepEqual(
    result.json.animations.map((animation) => animation.name),
    [...selected.ual1, ...selected.ual2],
  );
  assert.equal(
    result.json.meshes,
    undefined,
    'The runtime animation file must not carry the source mannequin mesh',
  );
  assert.equal(
    result.json.skins,
    undefined,
    'The runtime animation file must not carry duplicate source skin data',
  );
  for (const animation of result.json.animations)
    for (const channel of animation.channels)
      assert.ok(
        result.json.nodes[channel.target.node]?.name,
        `${animation.name} contains an unbound joint target`,
      );
  return { clips: animations.length, bytes: totalLength };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  assert.equal(
    process.argv.length,
    5,
    'Usage: node scripts/pack-tavern-animations.mjs <UAL1.glb> <UAL2.glb> <output.glb>',
  );
  const result = build(process.argv[2], process.argv[3], process.argv[4]);
  process.stdout.write(
    `Packed ${result.clips} CC0 action clips (${(result.bytes / 1_048_576).toFixed(2)} MiB).\n`,
  );
}
