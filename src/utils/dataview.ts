export default class ExtendedDataView {
  private buffer: ArrayBuffer;
  private view: DataView;
  private byteLength: number;
  private bitPosition: number;

  constructor(size) {
    this.buffer = new ArrayBuffer(size);
    this.view = new DataView(this.buffer);
    this.byteLength = 0;
    this.bitPosition = 0;
  }

  addBit(bit) {
    if (this.byteLength < this.buffer.byteLength) {
      if (bit) {
        this.view.setUint8(
          this.byteLength,
          this.view.getUint8(this.byteLength) | (1 << (7 - this.bitPosition)),
        );
      }
      this.bitPosition++;
      if (this.bitPosition >= 8) {
        this.bitPosition = 0;
        this.byteLength++;
      }
    } else {
      throw new Error('Buffer overflow!');
    }
  }

  addTwoBits(bits) {
    if (bits < 0 || bits > 3) {
      throw new Error('Invalid input: not 0-3');
    }
    this.addBit((bits >> 1) & 1);
    this.addBit(bits & 1);
  }

  addStr(str: string) {
    for (var i = 0; i < str.length; i++) {
      let char = str.charAt(i);
      this.addBit(Number(char));
    }
  }

  addByte(byte) {
    if (this.byteLength < this.buffer.byteLength) {
      if (this.bitPosition > 0) {
        this.bitPosition = 0;
        this.byteLength++;
      }

      this.view.setUint8(this.byteLength, byte);
      this.byteLength++;
    } else {
      throw new Error('Buffer overflow!');
    }
  }

  readByte(index) {
    if (index >= this.byteLength) {
      throw new Error('Reached end!');
    }
    return this.view.getUint8(index);
  }

  getDataLength() {
    return this.byteLength;
  }

  getBitsLength() {
    return this.byteLength * 8 + this.bitPosition;
  }

  getBuffer() {
    return this.buffer.slice(0, this.byteLength);
  }

  freemem() {
    // @ts-ignore
    this.buffer = null;
    // @ts-ignore
    this.view = null;
  }
}
