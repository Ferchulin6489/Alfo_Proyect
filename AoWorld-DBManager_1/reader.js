class Reader {

    constructor(buffer) {
        this.buffer = buffer;
        this.offset = 0;
    }

    ZeroNull(value) {
        return value ? value : 0;
    }

    readInt8 () {
        let value = this.buffer.readUInt8(this.offset);
        this.offset++;
        return value;
    }
    readInt16 () {
        let value = this.buffer.readInt16LE(this.offset);
        this.offset+=2;
        return value;
    }
    readInt32 () {
        let value = this.buffer.readInt32LE(this.offset);
        this.offset+=4;
        return value;
    }
    readDouble () {
        let value = this.buffer.readDoubleLE(this.offset);
        this.offset+=8;
        return value;
    }
    readString () {
        let length = this.buffer.readUInt8(this.offset);
        let value = this.buffer.toString('ascii', this.offset + 1, length + this.offset + 1);

        this.offset += value.length + 1;
        return value;
    }
    readString16 () {
        let length = this.buffer.readInt16LE(this.offset);
        let value = this.buffer.toString('ascii', this.offset + 2, length + this.offset + 2);

        this.offset += value.length + 2;
        return value;
    }
}

module.exports = Reader;