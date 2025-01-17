import Command from '../../command';

export interface UninstallCommandOptions {
  /**
   * keep the data and cache directories around after package removal.
   */
  keep?: boolean;
  /**
   * remove the app from the given user.
   */
  user?: string | number;
  /**
   * only uninstall if the app has the given version code.
   */
  versionCode?: string;
}

export default class UninstallCommand extends Command<boolean> {
  async execute(pkg: string, opts?: UninstallCommandOptions): Promise<boolean> {
    let cmd = 'shell:pm uninstall';
    if (opts) {
      if (opts.keep) cmd += ' -k';
      if (opts.user) cmd += ` --user ${opts.user}`;
      if (opts.versionCode) cmd += ` --versionCode ${opts.versionCode}`;
    }
    cmd += ` ${pkg}`
    this.sendCommand(cmd);
    await this.readOKAY();
    try {
      const match = await this.parser.searchLine(/^(Success|Failure.*|.*Unknown package:.*)$/);
      if (match[1] === 'Success') {
        return true;
      } else {
        // Either way, the package was uninstalled or doesn't exist,
        // which is good enough for us.
        return true;
      }
    } finally {
      this.parser.readAll();
    }
  }
}
