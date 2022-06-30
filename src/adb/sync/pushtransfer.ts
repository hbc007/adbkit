import EventEmitter from 'events';

/**
 * enforce EventEmitter typing
 */
interface IEmissions {
  /**
   * Emitted on error.
   */
  end: () => void
  cancel: () => void
  /**
   * **(stats)** Emitted when a chunk has been flushed to the ADB connection.
   * @param stats An object with the following stats about the transfer:
   */
  progress: (stats: { /** The number of bytes transferred so far. */ bytesTransferred: number }) => void
  /**
   * Emitted when the transfer has successfully completed.
   */
  error: (data: Error) => void
}
/**
 * A simple EventEmitter, mainly for keeping track of the progress.
 */
export default class PushTransfer extends EventEmitter {
  private stack: number[] = [];
  public stats = {
    bytesTransferred: 0,
  };

  public on = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.on(event, listener)
  public off = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.off(event, listener)
  public once = <K extends keyof IEmissions>(event: K, listener: IEmissions[K]): this => super.once(event, listener)
  public emit = <K extends keyof IEmissions>(event: K, ...args: Parameters<IEmissions[K]>): boolean => super.emit(event, ...args)

  /**
   * Cancels the transfer by ending both the stream that is being pushed and the sync connection. This will most likely end up creating a broken file on your device. **Use at your own risk.** Also note that you must create a new sync connection if you wish to continue using the sync service.
   * @returns The pushTransfer instance.
   */
  public cancel(): boolean {
    return this.emit('cancel');
  }

  public push(byteCount: number): number {
    return this.stack.push(byteCount);
  }

  public pop(): boolean {
    const byteCount = this.stack.pop();
    if (byteCount) {
      this.stats.bytesTransferred += byteCount;
    }
    return this.emit('progress', this.stats);
  }

  public end(): boolean {
    return this.emit('end');
  }

  /**
   * get end notification using Promise
   */
  public waitForEnd(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const unReg = (cb: () => void) => {
        this.off('end', resolve);
        this.off('error', reject);
        cb();
      }
      this.on('end', () => unReg(resolve));
      this.on('error', () => unReg(reject));
    })
  }
}
