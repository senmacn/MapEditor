export default class ExtendedDataView {
  readonly buffer: ArrayBuffer;
  readonly view: DataView;
  private byteLength: number;
  private bitPosition: number;
  private readPosition: number;

  constructor(size) {
    this.buffer = new ArrayBuffer(size);
    this.view = new DataView(this.buffer);
    this.byteLength = 0;
    this.bitPosition = 0;
    this.readPosition = 0;
  }

  addBit(bit) {
    if (this.byteLength < this.buffer.byteLength) {
      if (bit) {
        this.view.setUint8(
          this.byteLength,
          this.view.getUint8(this.byteLength) | (1 << this.bitPosition),
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

  readTwoBits() {
    if (this.readPosition >= this.getBitsLength()) {
      throw new Error('Reached end!');
    }

    const byte1 = this.view.getUint8(this.readPosition >> 3);
    const byte2 = this.view.getUint8((this.readPosition + 1) >> 3);

    const bit1 = (byte1 >> (this.readPosition & 7)) & 1;
    const bit2 = (byte2 >> ((this.readPosition + 1) & 7)) & 1;

    this.readPosition += 2;

    return (bit1 << 1) | bit2;
  }

  resetPosition() {
    this.readPosition = 0;
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
}
