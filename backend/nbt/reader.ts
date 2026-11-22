import { gunzipSync } from "node:zlib";
import type { NbtCompound, NbtValue } from "./types";

class BinaryNbtReader {
  private view: DataView;
  private bytes: Uint8Array;
  private offset = 0;
  private decoder = new TextDecoder("utf-8");

  constructor(buffer: Uint8Array) {
    this.bytes = buffer;
    this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }

  readByte(): number {
    const val = this.view.getInt8(this.offset);
    this.offset += 1;
    return val;
  }

  readUByte(): number {
    const val = this.view.getUint8(this.offset);
    this.offset += 1;
    return val;
  }

  readShort(): number {
    const val = this.view.getInt16(this.offset, false);
    this.offset += 2;
    return val;
  }

  readUShort(): number {
    const val = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return val;
  }

  readInt(): number {
    const val = this.view.getInt32(this.offset, false);
    this.offset += 4;
    return val;
  }

  readLong(): bigint {
    const val = this.view.getBigInt64(this.offset, false);
    this.offset += 8;
    return val;
  }

  readFloat(): number {
    const val = this.view.getFloat32(this.offset, false);
    this.offset += 4;
    return val;
  }

  readDouble(): number {
    const val = this.view.getFloat64(this.offset, false);
    this.offset += 8;
    return val;
  }

  readString(): string {
    const len = this.readUShort();
    const slice = this.bytes.subarray(this.offset, this.offset + len);
    this.offset += len;
    return this.decoder.decode(slice);
  }

  readPayload(tagType: number): NbtValue {
    switch (tagType) {
      case 1:
        return this.readByte();
      case 2:
        return this.readShort();
      case 3:
        return this.readInt();
      case 4:
        return this.readLong();
      case 5:
        return this.readFloat();
      case 6:
        return this.readDouble();
      case 7: {
        const len = this.readInt();
        const arr = this.bytes.slice(this.offset, this.offset + len);
        this.offset += len;
        return arr;
      }
      case 8:
        return this.readString();
      case 9: {
        const elemType = this.readUByte();
        const len = this.readInt();
        const list: NbtValue[] = [];
        for (let i = 0; i < len; i++) {
          list.push(this.readPayload(elemType));
        }
        return list;
      }
      case 10: {
        const obj: NbtCompound = {};
        while (true) {
          const nextType = this.readUByte();
          if (nextType === 0) break;
          const name = this.readString();
          obj[name] = this.readPayload(nextType);
        }
        return obj;
      }
      case 11: {
        const len = this.readInt();
        const arr = new Int32Array(len);
        for (let i = 0; i < len; i++) {
          arr[i] = this.readInt();
        }
        return arr;
      }
      case 12: {
        const len = this.readInt();
        const arr = new BigInt64Array(len);
        for (let i = 0; i < len; i++) {
          arr[i] = this.readLong();
        }
        return arr;
      }
      default:
        throw new Error("Неизвестный тип NBT-тега: " + tagType);
    }
  }
}

export function readRootNbt(rawBuffer: Uint8Array): NbtCompound {
  let data = rawBuffer;
  if (data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b) {
    data = new Uint8Array(gunzipSync(data));
  }

  const reader = new BinaryNbtReader(data);
  const rootType = reader.readUByte();
  if (rootType !== 10) {
    throw new Error("Корневой NBT-тег должен быть Compound (получен " + rootType + ")");
  }

  reader.readString(); // Имя корневого тега
  return reader.readPayload(10) as NbtCompound;
}
