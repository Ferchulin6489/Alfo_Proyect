class Writer {

    constructor() {
        this.buffer = [Buffer.alloc(2)];
        this.size = 0;
    }

    setOff(value) {
        this.size = value;
    }

    writeInt8 (value) {
        let b = Buffer.alloc(1);
        b.writeUInt8(value);
        this.buffer.push(b);
        this.size += 1;
    }
    writeInt16 (value) {
        let b = Buffer.alloc(2);
        b.writeInt16LE(value);
        this.buffer.push(b);
        this.size += 2;
    }
    writeInt32 (value) {
        let b = Buffer.alloc(4);
        b.writeInt32LE(value);
        this.buffer.push(b);
        this.size += 4;
    }
    writeDouble (value) {
        let b = Buffer.alloc(8);
        b.writeDouble(value);
        this.buffer.push(b);
        this.size += 8;
    }
    writeString (value) {
        if (!value) value = "";
        let b = Buffer.alloc(value.length + 1);
        b.writeUInt8(value.length);
        b.write(value, 1);
        this.buffer.push(b);
        this.size += value.length + 1;
    }
    writeString16 (value) {
        if (!value) value = "";
        let b = Buffer.alloc(value.length + 2);
        b.writeInt16LE(value.length);
        b.write(value, 2);
        this.buffer.push(b);
        this.size += value.length + 2;
    }

    send(socket) {
        this.buffer[0].writeInt16LE(this.size);
        socket.write(Buffer.concat(this.buffer));
    }

    sendError(socket) {
        this.setOff(10);
        this.writeInt8(255); //Error desconocido
        this.send(socket);
    }
}

module.exports = Writer;