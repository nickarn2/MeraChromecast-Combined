'use strict';

/*
 * @class ChunkMessage
 * @description ChunkMessage stores chunks of some message longer than 64 kb which sender app sends.
 *
 * @param {Number} id Message id
 * @property {Number} chunk_count Expected number of chunks
 */
function ChunkMessage(id, chunk_count) {
    if (!Utils.isInt(id)  || !Utils.isInt(chunk_count) || chunk_count<1) throw new Error();

    /*
     * @type {Number}
     * @private
     */
    this._id = id;
    /*
     * @type {Number}
     * @private
     */
    this._chunk_count = chunk_count;
    /*
     * @type {Number}
     * @private
     */
    this._chunk_received = 0;
    /*
     * @type {Array}
     * @private
     */
    this._chunks = [];
    /*
     * @type {String}
     * @public
     */
    this.message = "";
    /*
     * @type {Boolean}
     * @public
     */
    this.received = false;
}

/*
 * @public
 * @function ChunkMessage#addChunk
 */
ChunkMessage.prototype.addChunk = function(id, chunk_index, chunk) {
    if (id !== this._id) throw new Error('Chunk message id is not equal');
    else if (chunk_index < 0 || chunk_index > this._chunk_count-1) throw new Error('Chunk index is out of range');
    else if (typeof chunk !== 'string') throw new Error('Chunk message is not string');

    this._chunk_received++;
    this._chunks[chunk_index] = chunk;

    if (this._chunk_received == this._chunk_count) {
        this.received = true;
        this.message = this._chunks.join("");
    }
}
