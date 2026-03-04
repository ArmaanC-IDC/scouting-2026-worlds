/**
 * BinaryDTO: A Schema-based Binary Serializer for FRC Scouting
 * Optimized for QR Code density and iPhone 7/8 camera sensors.
 */

const BASE45_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

export class BinaryDTO {
  constructor(schema) {
    this.schema = schema;
  }

  /**
   * Encodes a JS Object into a Base45 string based on the schema.
   */
  pack(jsObject) {
    const bytes = [];

    this.schema.forEach((field) => {
      const value = jsObject[field.key];
      this._serializeField(field, value, bytes);
    });

    return this._toBase45(new Uint8Array(bytes));
  }

  /**
   * Decodes a Base45 string back into a JS Object.
   */
  unpack(base45String) {
    const bytes = this._fromBase45(base45String);
    const result = {};
    let offset = 0;

    const decode = (schemaSlice, targetObj) => {
      schemaSlice.forEach((field) => {
        const { value, newOffset } = this._deserializeField(field, bytes, offset);
        targetObj[field.key] = value;
        offset = newOffset;
      });
    };

    decode(this.schema, result);
    return result;
  }

  // --- Internal Serialization Logic ---

  _serializeField(field, value, bytes) {
    if (field.type === "uint16") {
      bytes.push((value >> 8) & 0xff, value & 0xff);
    } else if (field.type === "uint8") {
      const val = field.map ? field.map.indexOf(value) : value;
      bytes.push((val === -1 ? 0 : val) & 0xff);
    } else if (field.type === "bool") {
      bytes.push(value ? 1 : 0);
    } else if (field.type === "array") {
      // First byte is the length of the array
      const arr = value || [];
      bytes.push(arr.length & 0xff);
      arr.forEach((item) => {
        field.itemSchema.forEach((subField) => {
          this._serializeField(subField, item[subField.key], bytes);
        });
      });
    }
  }

  _deserializeField(field, bytes, offset) {
    let value;
    let newOffset = offset;

    if (field.type === "uint16") {
      value = (bytes[offset] << 8) | bytes[offset + 1];
      newOffset += 2;
    } else if (field.type === "uint8") {
      const raw = bytes[offset];
      value = field.map ? field.map[raw] : raw;
      newOffset += 1;
    } else if (field.type === "bool") {
      value = bytes[offset] === 1;
      newOffset += 1;
    } else if (field.type === "array") {
      const count = bytes[offset];
      newOffset += 1;
      value = [];
      for (let i = 0; i < count; i++) {
        const item = {};
        field.itemSchema.forEach((subField) => {
          const res = this._deserializeField(subField, bytes, newOffset);
          item[subField.key] = res.value;
          newOffset = res.newOffset;
        });
        value.push(item);
      }
    }
    return { value, newOffset };
  }

  // --- Base45 Encoding/Decoding ---

  _toBase45(uint8Array) {
    let res = "";
    for (let i = 0; i < uint8Array.length; i += 2) {
      if (uint8Array.length - i > 1) {
        let x = (uint8Array[i] << 8) + uint8Array[i + 1];
        res += BASE45_CHARSET[x % 45] + BASE45_CHARSET[Math.floor(x / 45) % 45] + BASE45_CHARSET[Math.floor(x / 2025)];
      } else {
        let x = uint8Array[i];
        res += BASE45_CHARSET[x % 45] + BASE45_CHARSET[Math.floor(x / 45)];
      }
    }
    return res;
  }

  _fromBase45(str) {
    const output = [];
    for (let i = 0; i < str.length; i += 3) {
      const isShort = str.length - i === 2;
      let x = BASE45_CHARSET.indexOf(str[i]) + 
              BASE45_CHARSET.indexOf(str[i + 1]) * 45 + 
              (isShort ? 0 : BASE45_CHARSET.indexOf(str[i + 2]) * 2025);
      if (isShort) output.push(x);
      else output.push((x >> 8) & 0xff, x & 0xff);
    }
    return new Uint8Array(output);
  }
}