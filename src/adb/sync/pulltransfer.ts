import { Stream } from 'stream';

/**
 * `PullTransfer` is a [`Stream`][node-stream]. Use [`fs.createWriteStream()`][node-fs] to pipe the stream to a file if necessary.
 */
export default class PullTransfer extends Stream.PassThrough {
  public stats = {
    bytesTransferred: 0,
  };

  /**
   * Cancels the transfer by ending the connection. Can be useful for reading endless streams of data, such as `/dev/urandom` or `/dev/zero`, perhaps for benchmarking use. Note that you must create a new sync connection if you wish to continue using the sync service.
   * @returns The pullTransfer instance.
   */
  public cancel(): boolean {
    return this.emit('cancel');
  }

  write(
    chunk: Buffer,
    encoding?: BufferEncoding | typeof callback,
    callback?: (error: Error | null | undefined) => void,
  ): boolean {
    this.stats.bytesTransferred += chunk.length;
    this.emit('progress', this.stats);
    if (typeof encoding === 'function') {
      return super.write(chunk, encoding);
    }
    return super.write(chunk, encoding, callback);
  }

  promiseWrite(
    chunk: Buffer,
    encoding?: BufferEncoding
  ): Promise<void> {
    this.stats.bytesTransferred += chunk.length;
    this.emit('progress', this.stats);
    return new Promise<void>((accept, reject) => {
      super.write(chunk, encoding, (err) => {
        if (err) reject(err);
        else accept();
      });
    })
  }

  private waitForEndPromise?: Promise<void>;
  /**
   * get end notification using Promise
   */
  public waitForEnd(): Promise<void> {
    if (!this.waitForEndPromise) {
      this.waitForEndPromise = new Promise<void>((resolve, reject) => {
        const unReg = (cb: () => void, e?: Error) => {
          this.off('end', resolve);
          this.off('error', () => reject(e));
          cb();
        }
        this.on('end', () => unReg(resolve));
        this.on('error', (e) => unReg(reject, e));
      })
    }
    return this.waitForEndPromise;

  }
}
